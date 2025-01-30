import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { getHash, verifyPassword } from "@/src/util/common";

const prisma = new PrismaClient();

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
              status: 1,
            },
          });

          user = await prisma.user.create({
            data: {
              email: profile.email,
              firstName: profile.given_name,
              lastName: profile.family_name,
              password: "", // No password for Google auth
              status: 1,
              authMethod: "google",
              organisationId: organisation.id,
            },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
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
              status: 1,
            },
          });

          user = await prisma.user.create({
            data: {
              email,
              firstName: "", // To be filled later
              lastName: "",
              password: getHash(password),
              status: 1,
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
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          organisationId: user.organisationId,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub as string;
        session.user.organisationId = token.organisationId as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.organisationId = user.organisationId;
      }
      return token;
    },
  },

  pages: {
    signIn: "/signin",
  },
  secret: process.env.AUTH_SECRET,
});
