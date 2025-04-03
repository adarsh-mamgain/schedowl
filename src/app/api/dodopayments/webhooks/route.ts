"use server";

import { Webhook } from "standardwebhooks";
import { headers } from "next/headers";
import logger from "@/src/services/logger";
import prisma from "@/src/lib/prisma";
import { sendEmail } from "@/src/services/email";
import { PaymentStatus, SubscriptionStatus } from "@prisma/client";

const webhook = new Webhook(process.env.NEXT_PUBLIC_DODO_WEBHOOK_KEY!);

// Helper functions for feature management
function getFeaturesFromAmount(amount: number, currency: string) {
  // Convert amount to USD if needed for consistent comparison
  const amountInUSD = currency === "INR" ? amount / 83 : amount;

  return {
    maxWorkspaces: amountInUSD >= 79000 ? 10 : amountInUSD >= 49000 ? 5 : 1,
    maxSocialAccounts:
      amountInUSD >= 79000 ? 50 : amountInUSD >= 49000 ? 20 : 5,
    aiTokens: amountInUSD >= 79000 ? 1000 : amountInUSD >= 49000 ? 500 : 100,
    canSchedule: true,
    canUseAI: amountInUSD >= 49000,
    canUseAnalytics: amountInUSD >= 79000,
  };
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

    const features = getFeaturesFromAmount(
      payload.data.total_amount || payload.data.recurring_pre_tax_amount,
      payload.data.currency
    );

    switch (payload.type) {
      case "payment.succeeded": {
        // Create payment record
        await prisma.payment.create({
          data: {
            paymentId: payload.data.payment_id,
            subscriptionId: payload.data.subscription_id,
            status: PaymentStatus.SUCCEEDED,
            payload: payload,
            userId: user.id,
          },
        });

        // Update user features
        await prisma.user.update({
          where: { id: user.id },
          data: {
            features: features,
          },
        });

        // Send success email
        await sendEmail({
          to: user.email,
          subject: "Payment Successful - SchedOwl",
          html: `
            <h1>Payment Successful</h1>
            <p>Your payment of ${payload.data.total_amount / 100} ${
            payload.data.currency
          } has been processed successfully.</p>
            <p>Your account features have been updated:</p>
            <ul>
              <li>Workspaces: ${features.maxWorkspaces}</li>
              <li>Social Accounts: ${features.maxSocialAccounts}</li>
              <li>AI Tokens: ${features.aiTokens}</li>
              ${features.canUseAI ? "<li>AI Features: Enabled</li>" : ""}
              ${features.canUseAnalytics ? "<li>Analytics: Enabled</li>" : ""}
            </ul>
            <p>Thank you for your business!</p>
          `,
        });
        break;
      }

      case "subscription.active": {
        // Create subscription record
        await prisma.subscription.create({
          data: {
            subscriptionId: payload.data.subscription_id,
            subscriptionStatus: SubscriptionStatus.ACTIVE,
            nextBillingDate: new Date(payload.data.next_billing_date),
            payload: payload,
          },
        });

        // Update user features
        await prisma.user.update({
          where: { id: user.id },
          data: {
            features: features,
          },
        });

        // Send welcome email
        await sendEmail({
          to: user.email,
          subject: "Welcome to SchedOwl! Your subscription is active",
          html: `
            <h1>Welcome to SchedOwl!</h1>
            <p>Thank you for subscribing to SchedOwl. Your subscription is now active.</p>
            <p>Next billing date: ${new Date(
              payload.data.next_billing_date
            ).toLocaleDateString()}</p>
            <p>Amount: ${payload.data.recurring_pre_tax_amount / 100} ${
            payload.data.currency
          }</p>
            <p>Your account features:</p>
            <ul>
              <li>Workspaces: ${features.maxWorkspaces}</li>
              <li>Social Accounts: ${features.maxSocialAccounts}</li>
              <li>AI Tokens: ${features.aiTokens}</li>
              ${features.canUseAI ? "<li>AI Features: Enabled</li>" : ""}
              ${features.canUseAnalytics ? "<li>Analytics: Enabled</li>" : ""}
            </ul>
          `,
        });
        break;
      }

      case "subscription.renewed": {
        // Update subscription record
        await prisma.subscription.update({
          where: { subscriptionId: payload.data.subscription_id },
          data: {
            subscriptionStatus: SubscriptionStatus.RENEWED,
            nextBillingDate: new Date(payload.data.next_billing_date),
            updatedAt: new Date(),
          },
        });

        // Update user features
        await prisma.user.update({
          where: { id: user.id },
          data: {
            features: features,
          },
        });

        // Send renewal email
        await sendEmail({
          to: user.email,
          subject: "Subscription Renewed - SchedOwl",
          html: `
            <h1>Subscription Renewed</h1>
            <p>Your SchedOwl subscription has been successfully renewed.</p>
            <p>Next billing date: ${new Date(
              payload.data.next_billing_date
            ).toLocaleDateString()}</p>
            <p>Amount: ${payload.data.recurring_pre_tax_amount / 100} ${
            payload.data.currency
          }</p>
            <p>Your account features:</p>
            <ul>
              <li>Workspaces: ${features.maxWorkspaces}</li>
              <li>Social Accounts: ${features.maxSocialAccounts}</li>
              <li>AI Tokens: ${features.aiTokens}</li>
              ${features.canUseAI ? "<li>AI Features: Enabled</li>" : ""}
              ${features.canUseAnalytics ? "<li>Analytics: Enabled</li>" : ""}
            </ul>
          `,
        });
        break;
      }

      case "subscription.cancelled": {
        // Update subscription record
        await prisma.subscription.update({
          where: { subscriptionId: payload.data.subscription_id },
          data: {
            subscriptionStatus: SubscriptionStatus.CANCELLED,
            updatedAt: new Date(),
          },
        });

        // Reset user features to basic
        await prisma.user.update({
          where: { id: user.id },
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

        // Send cancellation email
        await sendEmail({
          to: user.email,
          subject: "Subscription Cancelled - SchedOwl",
          html: `
            <h1>Subscription Cancelled</h1>
            <p>Your SchedOwl subscription has been cancelled.</p>
            <p>You can still use your account until the end of your billing period.</p>
            <p>To reactivate your subscription, please visit our billing page.</p>
          `,
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
