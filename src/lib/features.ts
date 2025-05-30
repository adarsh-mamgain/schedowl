import prisma from "@/src/lib/prisma";
import {
  PRODUCT_FEATURES,
  DEFAULT_FEATURES,
} from "@/src/constants/productFeatures";

function extractProductId(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;

  // Check for nested data structure with product_id
  if ("data" in payload && payload.data && typeof payload.data === "object") {
    const data = payload.data as { product_id?: string };
    return data.product_id;
  }

  return undefined;
}

/**
 * Returns the feature set for the owner of the given organisation.
 * - If the owner has an active/renewed subscription, use its product_id.
 * - If the owner has AppSumo codes, use the count to determine the plan.
 * - Otherwise, return the default (free/trial) features.
 */
export async function getOrgOwnerFeatures(organisationId: string) {
  // Find the org and its owner
  const org = await prisma.organisation.findUnique({
    where: { id: organisationId },
    select: { ownerId: true, owner: { select: { id: true, email: true } } },
  });
  if (!org) return DEFAULT_FEATURES;

  // Check for active/renewed subscription for the owner
  const activeSub = await prisma.subscription.findFirst({
    where: {
      payments: {
        some: {
          userId: org.ownerId,
        },
      },
      OR: [{ subscriptionStatus: "ACTIVE" }, { subscriptionStatus: "RENEWED" }],
    },
    orderBy: { updatedAt: "desc" },
  });

  if (activeSub) {
    // Get product_id from the latest payment
    const payment = await prisma.payment.findFirst({
      where: { subscriptionId: activeSub.subscriptionId, userId: org.ownerId },
      orderBy: { createdAt: "desc" },
    });
    const productId =
      extractProductId(payment?.payload) || extractProductId(activeSub.payload);
    if (productId && PRODUCT_FEATURES[productId]) {
      return PRODUCT_FEATURES[productId];
    }
  }

  // Check AppSumo codes redeemed by owner
  const appsumoCount = await prisma.appSumoCode.count({
    where: { userId: org.ownerId, status: "REDEEMED" },
  });
  if (appsumoCount > 0) {
    // Map count to a plan (e.g., 1=basic, 2=pro, 3+=super)
    let plan = "basic";
    if (appsumoCount === 3) plan = "pro";
    if (appsumoCount >= 5) plan = "super";
    // Assume PRODUCT_FEATURES keys: basic, pro, super
    if (PRODUCT_FEATURES[plan]) return PRODUCT_FEATURES[plan];
  }

  // Default (free/trial) features
  return DEFAULT_FEATURES;
}
