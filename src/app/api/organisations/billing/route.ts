import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { getOrgOwnerFeatures } from "@/src/lib/features";
import { DEFAULT_FEATURES } from "@/src/constants/productFeatures";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.organisation?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const features = await getOrgOwnerFeatures(session.organisation.id);
    const hasActiveBilling = features !== DEFAULT_FEATURES;

    return NextResponse.json({
      hasActiveBilling,
      features,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
