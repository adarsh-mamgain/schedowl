import nodemailer from "nodemailer";
import logger from "@/src/services/logger";

interface EmailOptions {
  to: string;
  subject: string;
  template?: string;
  context?: Record<string, any>;
  html?: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const templates = {
  "post-failed": (context: Record<string, any>) => `
    <h2>Post Failed</h2>
    <p>Your scheduled post has failed to publish.</p>
    <p><strong>Content:</strong> ${context.postContent}</p>
    <p><strong>Error:</strong> ${context.errorMessage}</p>
    <p><strong>Retry Count:</strong> ${context.retryCount}/5</p>
    <p>Please check your post settings and try again.</p>
  `,
};

export async function sendEmail({
  to,
  subject,
  template,
  context,
  html,
}: EmailOptions) {
  try {
    let emailHtml = html;
    if (template && context && templates[template as keyof typeof templates]) {
      emailHtml = templates[template as keyof typeof templates](context);
    }

    if (!emailHtml) {
      throw new Error("No HTML content provided");
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html: emailHtml,
    });

    logger.info(`Email sent to ${to}`);
  } catch (error) {
    logger.error("Error sending email:", error);
    throw error;
  }
}
