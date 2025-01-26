"use server";

import { signIn } from "next-auth/react";

export async function signInWithGoogle() {
  await signIn("google");
}
