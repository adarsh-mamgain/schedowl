import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      organisationId: string;
    };
  }

  interface User extends DefaultUser {
    id: string;
    organisationId: string;
  }

  interface JWT {
    sub: string;
    organisationId: string;
  }
}
