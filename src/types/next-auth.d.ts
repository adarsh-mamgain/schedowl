import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    organisation: {
      id: string;
      name: string;
      slug: string;
    };
    organisationRole: {
      id: string;
      role: string;
    };
  }
}
