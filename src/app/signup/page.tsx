"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/src/components/Button";
import axios from "axios";

export default function SignUp() {
  const router = useRouter(); // ✅ Get the router instance
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const validatePassword = (password: string): boolean => {
    const newErrors: string[] = [];
    if (password.length < 8) {
      newErrors.push("Password must be at least 8 characters long.");
    }
    if (!/[A-Z]/.test(password)) {
      newErrors.push("Password must contain at least one uppercase letter.");
    }
    if (!/[a-z]/.test(password)) {
      newErrors.push("Password must contain at least one lowercase letter.");
    }
    if (!/[0-9]/.test(password)) {
      newErrors.push("Password must contain at least one number.");
    }
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const signUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      setErrors(["Email is required."]);
      return;
    }
    if (!validatePassword(password)) {
      return;
    }
    const res = await axios.post(
      "/api/auth/signup",
      { email, password, name: email.split("@")[0] },
      { headers: { "Content-Type": "application/json" } }
    );
    if (res.status !== 200) {
      const error = await res.data;
      throw new Error(error.message);
    }
    router.push("/dashboard"); // ✅ Redirect manually after success
  };

  return (
    <div className="grid items-center justify-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main>
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/SchedOwl logo.svg"
            className="mb-6"
            alt="SchedOwl logo"
            width={48}
            height={48}
          />
          <h1 className="text-3xl mb-3 font-semibold text-[#101828]">
            Welcome to SchedOwl
          </h1>
          <h2 className="text-[#475467] mb-2">Start your 30-day free trial.</h2>
        </div>
        <div className="flex flex-col gap-4">
          <form onSubmit={signUp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-[#344054] font-medium">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-[#667085 px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-[#344054] font-medium">
                Password
              </label>
              <input
                type="password"
                name="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-[#667085 px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D]"
              />
              <ul className="text-red-500 text-sm">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
            <Button type="submit" variant="primary">
              Get started
            </Button>
          </form>
          <div className="flex items-center">
            <hr className="flex-grow border-t border-gray-300" />
            <span className="mx-4 text-[#E4E7EC">OR</span>
            <hr className="flex-grow border-t border-gray-300" />
          </div>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              // signIn("google");
            }}
          >
            <Button type="submit" variant="secondary" icon="google-icon.svg">
              Continue with Google
            </Button>
          </form>

          <div className="flex justify-center text-[#344054]">
            <p>
              Already have an account?{" "}
              <Link
                href="/signin"
                className="font-semibold underline hover:text-[#475467] hover:no-underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
