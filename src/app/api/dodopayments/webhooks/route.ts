"use server";

import { Webhook } from "standardwebhooks";
import { headers } from "next/headers";
import logger from "@/src/services/logger";
import prisma from "@/src/lib/prisma";
import { sendSubscriptionEmail } from "@/src/services/email";
import { addDays } from "date-fns";
// import { WebhookPayload } from "@/types/api-types";
// import {
//   handleOneTimePayment,
//   handleSubscription,
//   updateSubscriptionInDatabase,
// } from "@/lib/api-functions";

const webhook = new Webhook(process.env.NEXT_PUBLIC_DODO_WEBHOOK_KEY!);

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

    switch (payload.type) {
      case "payment.succeeded": {
        // Create payment record
        const payment = await prisma.payment.create({
          data: {
            paymentId: payload.data.payment_id,
            subscriptionId: payload.data.subscription_id,
            status: "SUCCEEDED",
            customerId: payload.data.customer.customer_id,
            metadata: payload.data,
            userId: user.id,
          },
        });

        // If this is a subscription payment, update subscription status
        if (payload.data.subscription_id) {
          await prisma.subscription.update({
            where: { subscriptionId: payload.data.subscription_id },
            data: {
              subscriptionStatus: "ACTIVE",
              nextBillingDate: new Date(payload.data.next_billing_date),
              updatedAt: new Date(),
            },
          });

          // Send success email
          await sendSubscriptionEmail({
            type: "SUBSCRIPTION_RENEWED",
            user,
            subscription: {
              nextBillingDate: new Date(payload.data.next_billing_date),
              amount: payload.data.total_amount / 100, // Convert from cents
              currency: payload.data.currency,
            },
          });
        } else {
          // Handle one-time payment
          // Update user's billing status and features
          await prisma.user.update({
            where: { id: user.id },
            data: {
              billingStatus: "ACTIVE",
              trialEndsAt: null,
              features: {
                maxWorkspaces: getMaxWorkspaces(payload.data.total_amount),
                maxSocialAccounts: getMaxSocialAccounts(
                  payload.data.total_amount
                ),
                canSchedule: true,
              },
            },
          });

          // Send success email for one-time payment
          await sendSubscriptionEmail({
            type: "PAYMENT_SUCCESS",
            user,
            payment: {
              amount: payload.data.total_amount / 100,
              currency: payload.data.currency,
            },
          });
        }
        break;
      }

      case "payment.failed": {
        await prisma.payment.create({
          data: {
            paymentId: payload.data.payment_id,
            subscriptionId: payload.data.subscription_id,
            status: "FAILED",
            customerId: payload.data.customer.customer_id,
            metadata: payload.data,
            userId: user.id,
          },
        });

        if (payload.data.subscription_id) {
          // Update subscription status
          await prisma.subscription.update({
            where: { subscriptionId: payload.data.subscription_id },
            data: {
              subscriptionStatus: "FAILED",
              updatedAt: new Date(),
            },
          });

          // Send failure email
          await sendSubscriptionEmail({
            type: "PAYMENT_FAILED",
            user,
            subscription: {
              nextBillingDate: new Date(payload.data.next_billing_date),
              amount: payload.data.total_amount / 100,
              currency: payload.data.currency,
            },
          });
        }
        break;
      }

      case "subscription.active": {
        const subscription = await prisma.subscription.create({
          data: {
            subscriptionId: payload.data.subscription_id,
            customerId: payload.data.customer.customer_id,
            productId: payload.data.product_id,
            subscriptionStatus: "ACTIVE",
            currency: payload.data.currency,
            recurringAmount: payload.data.recurring_pre_tax_amount,
            quantity: payload.data.quantity,
            taxInclusive: payload.data.tax_inclusive,
            trialPeriodDays: payload.data.trial_period_days,
            periodInterval: payload.data.subscription_period_interval,
            periodCount: payload.data.subscription_period_count,
            nextBillingDate: new Date(payload.data.next_billing_date),
            customerName: payload.data.customer.name,
            customerEmail: payload.data.customer.email,
            metadata: payload.data.metadata,
          },
        });

        // Update user's billing status and features
        await prisma.user.update({
          where: { id: user.id },
          data: {
            billingStatus: "ACTIVE",
            trialEndsAt: null,
            features: {
              maxWorkspaces: getMaxWorkspaces(
                payload.data.recurring_pre_tax_amount
              ),
              maxSocialAccounts: getMaxSocialAccounts(
                payload.data.recurring_pre_tax_amount
              ),
              canSchedule: true,
            },
          },
        });

        // Send welcome email
        await sendSubscriptionEmail({
          type: "SUBSCRIPTION_ACTIVE",
          user,
          subscription: {
            nextBillingDate: new Date(payload.data.next_billing_date),
            amount: payload.data.recurring_pre_tax_amount / 100,
            currency: payload.data.currency,
          },
        });
        break;
      }

      case "subscription.cancelled": {
        await prisma.subscription.update({
          where: { subscriptionId: payload.data.subscription_id },
          data: {
            subscriptionStatus: "CANCELLED",
            cancelledAt: new Date(payload.data.cancelled_at),
            updatedAt: new Date(),
          },
        });

        // Update user's billing status
        await prisma.user.update({
          where: { id: user.id },
          data: {
            billingStatus: "CANCELLED",
            features: {
              maxWorkspaces: 1,
              maxSocialAccounts: 1,
              canSchedule: false,
            },
          },
        });

        // Send cancellation email
        await sendSubscriptionEmail({
          type: "SUBSCRIPTION_CANCELLED",
          user,
          subscription: {
            cancelledAt: new Date(payload.data.cancelled_at),
          },
        });
        break;
      }

      default:
        logger.info("Unhandled webhook event", { payload });
        break;
    }

    return Response.json(
      { message: "Webhook processed successfully" },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Dodo Payments webhook processing failed", error);
    return Response.json(
      {
        error: "Dodo Payments webhook processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}

// Helper functions
function getMaxWorkspaces(amount: number): number {
  // Define workspace limits based on subscription amount
  if (amount >= 79000) return 10; // Super plan
  if (amount >= 49000) return 5; // Pro plan
  return 1; // Basic plan
}

function getMaxSocialAccounts(amount: number): number {
  // Define social account limits based on subscription amount
  if (amount >= 79000) return 50; // Super plan
  if (amount >= 49000) return 20; // Pro plan
  return 5; // Basic plan
}
