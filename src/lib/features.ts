import prisma from "@/src/lib/prisma";
import type { FeatureSet } from "@/src/constants/productFeatures";

export async function getOrgOwnerFeatures(organisationId: string) {
  const org = await prisma.organisation.findUnique({
    where: { id: organisationId },
    select: {
      owner: {
        select: {
          features: true,
        },
      },
    },
  });
  if (!org?.owner) throw new Error("Organisation owner not found");
  return org.owner.features as FeatureSet;
}
