import { dodopayments } from "@/src/lib/dodopayments";
import { CreateSubscriptionSchema } from "@/src/schema";
import logger from "@/src/services/logger";
import {
  CustomerRequest,
  type BillingAddress,
} from "dodopayments/resources/payments.mjs";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    logger.info("Received subscription request", { body });

    const validatedData = CreateSubscriptionSchema.parse(body);
    logger.info("Validation passed", { validatedData });

    const {
      billing,
      customer,
      product_id,
      quantity,
      discount_code,
      metadata,
      payment_link,
      tax_id,
      trial_period_days,
    } = validatedData;

    const subscription = await dodopayments.subscriptions.create({
      billing: billing as BillingAddress,
      customer: customer as CustomerRequest,
      product_id,
      quantity,
      discount_code,
      metadata,
      payment_link,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
      tax_id,
      trial_period_days,
    });

    logger.info("Subscription created successfully", { subscription });
    return NextResponse.json(subscription);
  } catch (error) {
    logger.error("Error creating subscription:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    // Check if it's a DodoPayments API error
    if (error && typeof error === "object" && "message" in error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const subscriptions = await dodopayments.subscriptions.list();
  return NextResponse.json(subscriptions);
}
