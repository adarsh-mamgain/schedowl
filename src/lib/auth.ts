import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { LoginSchema } from "@/src/schema";
import prisma from "@/src/lib/prisma";
import bcrypt from "bcrypt";
import { generateUniqueSlug } from "@/src/lib/common";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const validatedData = LoginSchema.parse(credentials);
          const user = await prisma.user.findUnique({
            where: {
              email: validatedData.email,
            },
          });

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            validatedData.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          // Create new user with default organization
          const result = await prisma.$transaction(async (tx) => {
            // Create user
            const newUser = await tx.user.create({
              data: {
                email: user.email!,
                name: user.name,
                image: user.image,
              },
            });

            // Generate unique slug
            let slug = generateUniqueSlug(
              `${user.name || user.email!.split("@")[0]}'s Organization`
            );
            let slugExists = await tx.organisation.findUnique({
              where: { slug },
            });

            while (slugExists) {
              slug = `${generateUniqueSlug(
                `${user.name || user.email!.split("@")[0]}'s Organization`
              )}-${Math.random().toString(36).substring(2, 8)}`;
              slugExists = await tx.organisation.findUnique({
                where: { slug },
              });
            }

            // Create organization
            const organization = await tx.organisation.create({
              data: {
                name: `${
                  user.name || user.email!.split("@")[0]
                }'s Organization`,
                slug,
                ownerId: newUser.id,
              },
            });

            // Create organization role
            await tx.organisationRole.create({
              data: {
                userId: newUser.id,
                organizationId: organization.id,
                role: "OWNER",
              },
            });

            return newUser;
          });

          user.id = result.id;
        } else {
          user.id = existingUser.id;
        }
      }

      return true;
    },
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
};
