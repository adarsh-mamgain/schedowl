import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "@/supabase";
import { getHash, verifyPassword } from "@/src/util/common";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      async profile(profile) {
        console.log("First");
        // Upsert Google user in Supabase
        // const { data, error } = await supabase
        //   .from("users")
        //   .upsert({
        //     email: profile.email,
        //     auth_method: "google",
        //   })
        //   .select()
        //   .single();

        return {
          id: "profile.sub",
          email: "profile.email",
          supabaseId: "data?.id",
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
      authorize: async (credentials, request) => {
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
        const { data: user, error } = await supabase
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
    async signIn({ user }) {
      console.log("Second");
      //   const { email, name, image } = user;

      //   // Check if user exists in Supabase
      //   const { data: existingUser, error: fetchError } = await supabase
      //     .from("users")
      //     .select("*")
      //     .eq("email", email)
      //     .single();

      //   if (fetchError) {
      //     console.error("Error fetching user:", fetchError);
      //   }

      //   // If user does not exist, insert them
      //   if (!existingUser) {
      //     const { error: insertError } = await supabase.from("users").insert([
      //       {
      //         email,
      //         name,
      //         image,
      //       },
      //     ]);

      //     if (insertError) {
      //       throw new Error("Could not create user. Please try again.");
      //       return false; // Prevent login
      //     }
      //   }

      return false; // Allow login
      // },
      // async session({ session }) {
      //   // Fetch user ID from Supabase and include it in the session
      //   const { email } = session.user;
      //   const { data: user } = await supabase
      //     .from("users")
      //     .select("id")
      //     .eq("email", email)
      //     .single();

      //   if (user) {
      //     session.user.id = user.id;
      //   }

      //   return session;
    },
  },
  secret: process.env.AUTH_SECRET, // Use a strong secret for session encryption
  pages: {
    signIn: "/signin",
  },
});
