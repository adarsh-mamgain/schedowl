import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { LoginSchema } from "@/src/schema";
import prisma from "@/src/lib/prisma";
import bcrypt from "bcryptjs";
import { generateUniqueSlug } from "@/src/lib/common";
import { sendEmail, templates } from "../services/email";
import { DEFAULT_FEATURES } from "@/src/constants/productFeatures";
import { getOrgOwnerFeatures } from "@/src/lib/features";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
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
          // Create new user with default organisation
          const result = await prisma.$transaction(async (tx) => {
            // Create user
            const newUser = await tx.user.create({
              data: {
                email: user.email!,
                name: user.name || user.email!.split("@")[0],
                image: user.image,
              },
            });

            // Generate unique slug
            let slug = generateUniqueSlug(
              `${user.name || user.email!.split("@")[0]}'s Organisation`
            );
            let slugExists = await tx.organisation.findUnique({
              where: { slug },
            });

            while (slugExists) {
              slug = `${generateUniqueSlug(
                `${user.name || user.email!.split("@")[0]}'s `
              )}-${Math.random().toString(36).substring(2, 8)}`;
              slugExists = await tx.organisation.findUnique({
                where: { slug },
              });
            }

            // Create organisation
            const organisation = await tx.organisation.create({
              data: {
                name: `${
                  user.name || user.email!.split("@")[0]
                }'s Organisation`,
                slug,
                ownerId: newUser.id,
              },
            });

            // Create organisation role
            await tx.organisationRole.create({
              data: {
                userId: newUser.id,
                organisationId: organisation.id,
                role: "OWNER",
              },
            });

            return newUser;
          });

          // Send welcome email
          await sendEmail({
            to: result.email,
            subject: "Welcome to SchedOwl",
            html: templates.WELCOME_EMAIL(),
          });

          user.id = result.id;
        } else {
          user.id = existingUser.id;
        }
      } else if (account?.provider === "credentials") {
        // Send welcome email for credentials signup
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (existingUser) {
          // Send welcome back email
          await sendEmail({
            to: existingUser.email,
            subject: "Welcome back to SchedOwl",
            html: templates.WELCOME_EMAIL(),
          });
        }
      }

      return true;
    },
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
        session.organisation = token.organisation as {
          id: string;
          name: string;
          slug: string;
          image?: string | null;
        };
        session.organisationRole = token.organisationRole as {
          id: string;
          role: string;
        };
        // Fetch features from org owner for all members
        if (session.organisation?.id) {
          session.user.features = await getOrgOwnerFeatures(
            session.organisation.id
          );
        } else {
          session.user.features = DEFAULT_FEATURES;
        }
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;

        // Fetch user's organisation data
        const userData = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            organisations: {
              include: {
                organisation: true,
              },
              take: 1,
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        });

        if (userData?.organisations[0]) {
          const orgRole = userData.organisations[0];
          token.organisation = {
            id: orgRole.organisation.id,
            name: orgRole.organisation.name,
            slug: orgRole.organisation.slug,
            image: orgRole.organisation.image,
          };
          token.organisationRole = {
            id: orgRole.id,
            role: orgRole.role,
          };
        } else {
          token.organisation = null;
          token.organisationRole = null;
        }
      }

      // Handle organization switch
      if (trigger === "update" && session?.organisation) {
        token.organisation = session.organisation;
        token.organisationRole = session.organisationRole;
      }

      return token;
    },
  },
};
