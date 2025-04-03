import { addDays } from "date-fns";
import prisma from "@/src/lib/prisma";
import { sendSubscriptionEmail } from "@/src/services/email";
import { SubscriptionStatus, PaymentStatus } from "@prisma/client";
import { BaseWorker } from "./base-worker";
import { JsonValue } from "@prisma/client/runtime/library";

interface PaymentPayload {
  recurring_pre_tax_amount: number;
  currency: string;
}

// Helper function to safely parse JSON payload
function parsePayload<T>(payload: JsonValue): T | null {
  try {
    if (typeof payload === "string") {
      return JSON.parse(payload) as T;
    }
    return payload as T;
  } catch {
    return null;
  }
}

// // Helper function to get features based on subscription status
// async function getUserFeatures(userId: string) {
//   // Get the latest successful payment for the user
//   const latestPayment = await prisma.payment.findFirst({
//     where: {
//       userId,
//       status: PaymentStatus.SUCCEEDED,
//     },
//     orderBy: {
//       createdAt: "desc",
//     },
//   });

//   if (!latestPayment || !latestPayment.payload) {
//     return {
//       maxWorkspaces: 1,
//       maxSocialAccounts: 1,
//       aiTokens: 100,
//       canSchedule: true,
//       canUseAI: false,
//       canUseAnalytics: false,
//     };
//   }

//   const payload = parsePayload<PaymentPayload>(latestPayment.payload);
//   if (!payload) {
//     return {
//       maxWorkspaces: 1,
//       maxSocialAccounts: 1,
//       aiTokens: 100,
//       canSchedule: true,
//       canUseAI: false,
//       canUseAnalytics: false,
//     };
//   }

//   const amount = payload.total_amount || payload.recurring_pre_tax_amount || 0;
//   const currency = payload.currency;

//   // Convert amount to USD if needed for consistent comparison
//   const amountInUSD = currency === "INR" ? amount / 83 : amount;

//   return {
//     maxWorkspaces: amountInUSD >= 79000 ? 10 : amountInUSD >= 49000 ? 5 : 1,
//     maxSocialAccounts:
//       amountInUSD >= 79000 ? 50 : amountInUSD >= 49000 ? 20 : 5,
//     aiTokens: amountInUSD >= 79000 ? 1000 : amountInUSD >= 49000 ? 500 : 100,
//     canSchedule: true,
//     canUseAI: amountInUSD >= 49000,
//     canUseAnalytics: amountInUSD >= 79000,
//   };
// }

export class SubscriptionWorker extends BaseWorker {
  private static _instance: SubscriptionWorker;

  private constructor() {
    super("Subscription Worker");
  }

  public static getInstance(): SubscriptionWorker {
    if (!SubscriptionWorker._instance) {
      SubscriptionWorker._instance = new SubscriptionWorker();
    }
    return SubscriptionWorker._instance;
  }

  protected getSchedule(isDev: boolean): string {
    return isDev ? "*/5 * * * *" : "0 0 * * *"; // Every 5 minutes in dev, daily at midnight in prod
  }

  protected async process(): Promise<void> {
    await this.checkSubscriptionRenewals();
    await this.updateSubscriptionStatuses();
  }

  private async checkSubscriptionRenewals(): Promise<void> {
    const now = new Date();
    const renewalReminder = addDays(now, 7);

    const subscriptions = await prisma.subscription.findMany({
      where: {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        nextBillingDate: {
          gte: renewalReminder,
          lt: addDays(renewalReminder, 1),
        },
      },
    });

    for (const subscription of subscriptions) {
      const payment = await prisma.payment.findFirst({
        where: { subscriptionId: subscription.subscriptionId },
        include: { user: true },
      });

      if (payment?.user && subscription.payload) {
        const payload = parsePayload<PaymentPayload>(subscription.payload);
        if (payload) {
          await sendSubscriptionEmail({
            type: "SUBSCRIPTION_RENEWED",
            user: payment.user,
            subscription: {
              nextBillingDate: subscription.nextBillingDate,
              amount: payload.recurring_pre_tax_amount / 100,
              currency: payload.currency,
            },
          });
        }
      }
    }
  }

  private async updateSubscriptionStatuses(): Promise<void> {
    const now = new Date();
    const gracePeriodEnd = addDays(
      now,
      parseInt(process.env.GRACE_PERIOD_DAYS || "7", 10)
    );

    // Update failed subscriptions to expired if grace period has ended
    await prisma.subscription.updateMany({
      where: {
        subscriptionStatus: SubscriptionStatus.FAILED,
        updatedAt: {
          lt: gracePeriodEnd,
        },
      },
      data: {
        subscriptionStatus: SubscriptionStatus.EXPIRED,
      },
    });

    // Update user features for expired subscriptions
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        subscriptionStatus: SubscriptionStatus.EXPIRED,
      },
      include: {
        payments: {
          include: {
            user: true,
          },
        },
      },
    });

    for (const subscription of expiredSubscriptions) {
      if (subscription.payments[0]?.user) {
        await prisma.user.update({
          where: { id: subscription.payments[0].user.id },
          data: {
            features: {
              maxWorkspaces: 1,
              maxSocialAccounts: 1,
              aiTokens: 100,
              canSchedule: true,
              canUseAI: false,
              canUseAnalytics: false,
            },
          },
        });
      }
    }
  }
}

export async function checkFailedPayments() {
  const now = new Date();
  const gracePeriodEnd = addDays(
    now,
    parseInt(process.env.GRACE_PERIOD_DAYS || "7", 10)
  );

  // Find failed payments that are within grace period
  const failedPayments = await prisma.payment.findMany({
    where: {
      status: PaymentStatus.FAILED,
      createdAt: {
        gte: now,
        lt: gracePeriodEnd,
      },
    },
    include: {
      user: true,
      subscription: true,
    },
  });

  // Send daily reminder emails for failed payments
  for (const payment of failedPayments) {
    if (payment.subscription?.payload) {
      const payload = parsePayload<PaymentPayload>(
        payment.subscription.payload
      );
      if (payload) {
        await sendSubscriptionEmail({
          type: "PAYMENT_FAILED",
          user: payment.user,
          subscription: {
            nextBillingDate: payment.subscription.nextBillingDate,
            amount: payload.recurring_pre_tax_amount / 100,
            currency: payload.currency,
          },
        });
      }
    }
  }
}

// Helper function to check if a user has access to a feature
export async function hasFeatureAccess(
  userId: string,
  feature: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { features: true },
  });

  if (!user) return false;

  const features = user.features as Record<string, boolean>;
  return features[feature] === true;
}

// Helper function to check if a user has reached a limit
export async function hasReachedLimit(
  userId: string,
  limit: string,
  currentCount: number
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { features: true },
  });

  if (!user) return true;

  const features = user.features as Record<string, number>;
  const limitValue = features[limit];
  return currentCount >= limitValue;
}
