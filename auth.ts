import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "@/supabase";
import { getHash, verifyPassword } from "@/src/util/common";
import LinkedIn from "next-auth/providers/linkedin";
import { IntegrationType } from "./src/enums/integrations";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      async profile(profile) {
        const { error } = await supabase
          .from("users")
          .upsert({
            id: profile.sub,
            email: profile.email,
            firstName: profile.given_name,
            lastName: profile.family_name,
            avatar_url: profile.picture,
            auth_method: "google",
          })
          .select()
          .single();

        if (error) throw error;

        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
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
      authorize: async (credentials) => {
        if (!credentials) return null;

        const { mode, email, password } = credentials as {
          mode: string;
          email: string;
          password: string;
        };

        // Common check: Ensure email and password are provided
        if (!email || !password) {
          throw new Error("Email and password are required");
        }

        // Check if the user exists in the database
        const { data: user } = await supabase
          .from("users")
          .select("*")
          .eq("email", email)
          .single();

        if (mode === "signup") {
          if (user) {
            throw new Error("User already exists");
          }

          // Hash the password and create the user
          const hashedPassword = getHash(password);
          const { error: insertError } = await supabase
            .from("users")
            .insert([{ email, password: hashedPassword }]);

          if (insertError) {
            throw new Error("Could not create user. Please try again.");
          }

          return { id: null, email }; // Return basic user info after signup
        }

        if (mode === "signin") {
          if (!user) {
            throw new Error("User not found");
          }

          // Verify password
          const isValidPassword = verifyPassword(password, user.password);
          if (!isValidPassword) {
            throw new Error("Invalid credentials");
          }

          return { id: user.id, email: user.email };
        }

        throw new Error("Invalid mode");
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        if (token.sub) {
          session.user.id = token.sub;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  secret: process.env.AUTH_SECRET, // Use a strong secret for session encryption
  pages: {
    signIn: "/signin",
  },
});
