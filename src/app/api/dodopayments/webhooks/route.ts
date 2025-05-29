"use server";

import { Webhook } from "standardwebhooks";
import { headers } from "next/headers";
import logger from "@/src/services/logger";
import prisma from "@/src/lib/prisma";
import { sendSubscriptionEmail } from "@/src/services/email";
import { PaymentStatus, Prisma, SubscriptionStatus } from "@prisma/client";

const webhook = new Webhook(process.env.DODO_WEBHOOK_KEY!);

// Helper function to safely parse dates
function parseDate(dateString: string | undefined | null): Date | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

// Helper function to process subscription updates
async function processSubscriptionUpdate(
  tx: Prisma.TransactionClient,
  subscriptionId: string,
  status: SubscriptionStatus,
  nextBillingDate: Date | null = null,
  payload: Prisma.InputJsonValue
) {
  return tx.subscription.upsert({
    where: { subscriptionId },
    create: {
      subscriptionId,
      subscriptionStatus: status,
      nextBillingDate: nextBillingDate || new Date(),
      payload,
    },
    update: {
      subscriptionStatus: status,
      ...(nextBillingDate && { nextBillingDate }),
      payload,
    },
  });
}

// Helper function to process payment creation
async function processPayment(
  tx: Prisma.TransactionClient,
  paymentId: string,
  subscriptionId: string,
  status: PaymentStatus,
  userId: string,
  payload: Prisma.InputJsonValue
) {
  return tx.payment.create({
    data: {
      paymentId,
      subscriptionId,
      status,
      payload,
      userId,
    },
  });
}

export async function POST(request: Request) {
  const headersList = await headers();

  try {
    const rawBody = await request.text();
    logger.info("Received webhook request", { rawBody });

    const webhookHeaders = {
      "webhook-id": headersList.get("webhook-id") || "",
      "webhook-signature": headersList.get("webhook-signature") || "",
      "webhook-timestamp": headersList.get("webhook-timestamp") || "",
    };

    await webhook.verify(rawBody, webhookHeaders);

    const payload = JSON.parse(rawBody);
    logger.info("Processing webhook payload", { payload });

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: payload.data.customer.email },
    });

    if (!user) {
      throw new Error(
        `User not found for email: ${payload.data.customer.email}`
      );
    }

    // Check for existing payment before starting transaction
    if (payload.data.payment_id) {
      const existingPayment = await prisma.payment.findUnique({
        where: { paymentId: payload.data.payment_id },
      });

      if (existingPayment) {
        logger.info("Payment already processed", {
          paymentId: payload.data.payment_id,
        });
        return Response.json(
          { message: "Payment already processed" },
          { status: 200 }
        );
      }
    }

    await prisma.$transaction(
      async (tx) => {
        switch (payload.type) {
          case "payment.succeeded": {
            const subscription = await processSubscriptionUpdate(
              tx,
              payload.data.subscription_id,
              SubscriptionStatus.ACTIVE,
              null,
              payload
            );

            await processPayment(
              tx,
              payload.data.payment_id,
              subscription.subscriptionId,
              PaymentStatus.SUCCEEDED,
              user.id,
              payload
            );

            // Send email outside transaction
            await sendSubscriptionEmail({
              type: "PAYMENT_SUCCESS",
              user: user,
              payment: {
                amount: payload.data.total_amount / 100,
                currency: payload.data.currency,
              },
            });
            break;
          }

          case "subscription.active": {
            const nextBillingDate =
              parseDate(payload.data.next_billing_date) || new Date();
            await processSubscriptionUpdate(
              tx,
              payload.data.subscription_id,
              SubscriptionStatus.ACTIVE,
              nextBillingDate,
              payload
            );

            // Send email outside transaction
            await sendSubscriptionEmail({
              type: "SUBSCRIPTION_ACTIVE",
              user: user,
              subscription: {
                nextBillingDate,
                amount: payload.data.recurring_pre_tax_amount / 100,
                currency: payload.data.currency,
              },
            });
            break;
          }

          case "subscription.renewed": {
            const nextBillingDate =
              parseDate(payload.data.next_billing_date) || new Date();
            await processSubscriptionUpdate(
              tx,
              payload.data.subscription_id,
              SubscriptionStatus.RENEWED,
              nextBillingDate,
              payload
            );

            // Send email outside transaction
            await sendSubscriptionEmail({
              type: "SUBSCRIPTION_RENEWED",
              user: user,
              subscription: {
                nextBillingDate,
              },
            });
            break;
          }

          case "payment.failed": {
            const nextBillingDate =
              parseDate(payload.data.next_billing_date) || new Date();
            const subscription = await processSubscriptionUpdate(
              tx,
              payload.data.subscription_id,
              SubscriptionStatus.FAILED,
              nextBillingDate,
              payload
            );

            await processPayment(
              tx,
              payload.data.payment_id,
              subscription.subscriptionId,
              PaymentStatus.FAILED,
              user.id,
              payload
            );

            // Send email outside transaction
            await sendSubscriptionEmail({
              type: "PAYMENT_FAILED",
              user: user,
              payment: {
                amount: payload.data.total_amount / 100,
                currency: payload.data.currency,
              },
            });
            break;
          }

          case "subscription.failed": {
            const nextBillingDate =
              parseDate(payload.data.next_billing_date) || new Date();
            await processSubscriptionUpdate(
              tx,
              payload.data.subscription_id,
              SubscriptionStatus.FAILED,
              nextBillingDate,
              payload
            );

            // Send email outside transaction
            await sendSubscriptionEmail({
              type: "SUBSCRIPTION_FAILED",
              user: user,
            });
            break;
          }

          default:
            logger.info("Unhandled webhook event", { payload });
            break;
        }
      },
      {
        timeout: 10000, // Increase transaction timeout to 10 seconds
      }
    );

    return Response.json(
      { message: "Webhook processed successfully" },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Dodo Payments webhook processing failed", error);

    // Handle specific error cases
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        // Unique constraint violation - likely duplicate webhook
        logger.info("Duplicate webhook received", { error });
        return Response.json(
          { message: "Webhook already processed" },
          { status: 200 }
        );
      }
    }

    return Response.json(
      {
        error: "Dodo Payments webhook processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}
