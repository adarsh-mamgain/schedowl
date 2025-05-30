import "next-auth";
import type { FeatureSet } from "@/src/constants/productFeatures";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      features: FeatureSet;
    };
    organisation: {
      id: string;
      name: string;
      slug: string;
      image?: string | null;
    };
    organisationRole: {
      id: string;
      role: string;
    };
  }
}
