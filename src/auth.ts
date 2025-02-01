import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/src/lib/prisma";
import { getHash, verifyPassword } from "@/src/util/common";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      async profile(profile) {
        let user = await prisma.user.findUnique({
          where: { email: profile.email },
        });

        if (!user) {
          const organisation = await prisma.organisation.create({
            data: {
              name: `${profile.given_name}'s Organisation`,
            },
          });

          user = await prisma.user.create({
            data: {
              email: profile.email,
              firstName: profile.given_name,
              lastName: profile.family_name,
              password: "", // No password for Google auth
              authMethod: "google",
              organisationId: organisation.id,
            },
          });
        }

        return {
          userId: user.id,
          organisationId: user.organisationId,
        };
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        mode: { label: "Mode", type: "text" }, // either 'signup' or 'signin'
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const { mode, email, password } = credentials as {
          mode: string;
          email: string;
          password: string;
        };

        if (!email || !password) {
          throw new Error("Email and password are required");
        }

        let user = await prisma.user.findUnique({ where: { email } });

        if (mode === "signup") {
          if (user) throw new Error("User already exists");

          const organisation = await prisma.organisation.create({
            data: {
              name: `${email.split("@")[0]}'s Organisation`,
            },
          });

          user = await prisma.user.create({
            data: {
              email,
              firstName: "", // To be filled later
              lastName: "",
              password: getHash(password),
              authMethod: "credentials",
              organisationId: organisation.id,
            },
          });
        } else if (mode === "signin") {
          if (!user) throw new Error("User not found");
          if (!verifyPassword(password, user.password)) {
            throw new Error("Invalid credentials");
          }
        } else {
          throw new Error("Invalid mode");
        }

        return {
          userId: user.id,
          organisationId: user.organisationId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.userId = user.userId;
        token.organisationId = user.organisationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.userId = token.userId as string;
        session.user.organisationId = token.organisationId as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      return url === "/signin" ? `${baseUrl}/dashboard` : url;
    },
  },
  pages: {
    signIn: "/signin",
  },
  secret: process.env.AUTH_SECRET,
});
