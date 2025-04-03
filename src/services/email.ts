import nodemailer from "nodemailer";
import { User } from "@prisma/client";
import logger from "./logger";
import { format } from "date-fns";

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

type EmailType =
  | "SUBSCRIPTION_ACTIVE"
  | "SUBSCRIPTION_RENEWED"
  | "SUBSCRIPTION_CANCELLED"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "TRIAL_ENDING"
  | "TRIAL_EXPIRED";

interface EmailData {
  type: EmailType;
  user: User;
  subscription?: {
    nextBillingDate?: Date;
    amount?: number;
    currency?: string;
    cancelledAt?: Date;
  };
  payment?: {
    amount: number;
    currency: string;
  };
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

interface Context {
  postContent: string;
  errorMessage: string;
  retryCount: number;
}

const BASE_TEMPLATE = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: start;
      background-color: #444CE7;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0px 0px 0px 8px;
    }
    .content {
      background-color: #fff;
      padding: 20px;
      border: 1px solid #e5e7eb;
      border-radius: 0 0 8px 8px;
    }
    .button {
      display: inline-block;
      background-color: #444CE7;
      color: white;
      padding: 10px 20px;
      text-decoration: none;
      border-radius: 4px;
      margin-top: 20px;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="https://stage.schedowl.com/SchedOwl%20Logo.svg" />
    <h1>SchedOwl</h1>
  </div>
  <div class="content">
    ${content}
  </div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} SchedOwl. All rights reserved.</p>
    <p>If you have any questions, please contact support@schedowl.com</p>
  </div>
</body>
</html>
`;

export const templates = {
  POST_FAILED: (context: Context) =>
    BASE_TEMPLATE(`
    <h2>Post Failed</h2>
    <p>Your scheduled post has failed to publish.</p>
    <p><strong>Content:</strong> ${context.postContent}</p>
    <p><strong>Error:</strong> ${context.errorMessage}</p>
    <p><strong>Retry Count:</strong> ${context.retryCount}/5</p>
    <p>Please check your post settings and try again.</p>
  `),
};

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}`);
  } catch (error) {
    logger.error("Error sending email:", error);
    throw error;
  }
}

export async function sendSubscriptionEmail(data: EmailData) {
  const { type, user, subscription, payment } = data;

  const templates = {
    SUBSCRIPTION_ACTIVE: {
      subject: "Welcome to SchedOwl! Your subscription is active",
      html: BASE_TEMPLATE(`
        <h2>Welcome to SchedOwl!</h2>
        <p>Thank you for subscribing to SchedOwl. Your subscription is now active.</p>
        <p><strong>Next billing date:</strong> ${format(
          subscription?.nextBillingDate || new Date(),
          "MMMM d, yyyy"
        )}</p>
        <p><strong>Amount:</strong> ${subscription?.amount} ${
        subscription?.currency
      }</p>
        <a href="${
          process.env.NEXT_PUBLIC_APP_URL
        }/dashboard" class="button">Go to Dashboard</a>
      `),
    },
    SUBSCRIPTION_RENEWED: {
      subject: "Your SchedOwl subscription has been renewed",
      html: BASE_TEMPLATE(`
        <h2>Subscription Renewed</h2>
        <p>Your SchedOwl subscription has been successfully renewed.</p>
        <p><strong>Next billing date:</strong> ${format(
          subscription?.nextBillingDate || new Date(),
          "MMMM d, yyyy"
        )}</p>
        <p><strong>Amount:</strong> ${subscription?.amount} ${
        subscription?.currency
      }</p>
        <a href="${
          process.env.NEXT_PUBLIC_APP_URL
        }/dashboard" class="button">Go to Dashboard</a>
      `),
    },
    SUBSCRIPTION_CANCELLED: {
      subject: "Your SchedOwl subscription has been cancelled",
      html: BASE_TEMPLATE(`
        <h2>Subscription Cancelled</h2>
        <p>Your SchedOwl subscription has been cancelled as of ${format(
          subscription?.cancelledAt || new Date(),
          "MMMM d, yyyy"
        )}.</p>
        <p>You can still use your account until the end of your billing period.</p>
        <a href="${
          process.env.NEXT_PUBLIC_APP_URL
        }/billing" class="button">Manage Subscription</a>
      `),
    },
    PAYMENT_SUCCESS: {
      subject: "Payment Successful - SchedOwl",
      html: BASE_TEMPLATE(`
        <h2>Payment Successful</h2>
        <p>Your payment of ${payment?.amount} ${payment?.currency} has been processed successfully.</p>
        <p>Thank you for your business!</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Go to Dashboard</a>
      `),
    },
    PAYMENT_FAILED: {
      subject: "Payment Failed - SchedOwl",
      html: BASE_TEMPLATE(`
        <h2>Payment Failed</h2>
        <p>We were unable to process your payment for your SchedOwl subscription.</p>
        <p>Please update your payment information to continue using our service.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing" class="button">Update Payment Method</a>
      `),
    },
    TRIAL_ENDING: {
      subject: "Your SchedOwl trial is ending soon",
      html: BASE_TEMPLATE(`
        <h2>Trial Period Ending Soon</h2>
        <p>Your SchedOwl trial period will end in 7 days.</p>
        <p>To continue using our service, please subscribe to one of our plans.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing" class="button">Choose a Plan</a>
      `),
    },
    TRIAL_EXPIRED: {
      subject: "Your SchedOwl trial has expired",
      html: BASE_TEMPLATE(`
        <h2>Trial Period Expired</h2>
        <p>Your SchedOwl trial period has expired.</p>
        <p>To continue using our service, please subscribe to one of our plans.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing" class="button">Choose a Plan</a>
      `),
    },
  };

  const template = templates[type];

  try {
    await sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
    });
  } catch (error) {
    logger.error("Failed to send email:", error);
    throw error;
  }
}
