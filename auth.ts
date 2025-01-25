import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "@/supabase";
import { verifyPassword } from "@/src/util/common";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google,
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const { email, password } = credentials;

        // Fetch user from Supabase
        const { data: user, error } = await supabase
          .from("users")
          .select("*")
          .eq("email", email)
          .single();

        if (error || !user) {
          throw new Error("No user found with this email");
        }

        // Verify the password
        const isValidPassword = verifyPassword(
          password as string,
          user.password
        );
        if (!isValidPassword) {
          throw new Error("Invalid credentials");
        }

        // Return user object to NextAuth
        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const { email, name, image } = user;

      // Check if user exists in Supabase
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (fetchError) {
        console.error("Error fetching user:", fetchError);
      }

      // If user does not exist, insert them
      if (!existingUser) {
        const { error: insertError } = await supabase.from("users").insert([
          {
            email,
            name,
            image,
          },
        ]);

        if (insertError) {
          console.error("Error inserting user:", insertError);
          return false; // Prevent login
        }
      }

      return true; // Allow login
    },
    async session({ session }) {
      // Fetch user ID from Supabase and include it in the session
      const { email } = session.user;
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (user) {
        session.user.id = user.id;
      }

      return session;
    },
  },
  secret: process.env.AUTH_SECRET, // Use a strong secret for session encryption
  pages: {
    signIn: "/signin",
  },
});
