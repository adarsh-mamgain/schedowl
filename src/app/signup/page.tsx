"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "@/src/components/Button";
import axios from "axios";
import { toast } from "react-toastify";
import Toaster from "@/src/components/ui/Toaster";
import Link from "next/link";
import { verifyJWT } from "@/src/lib/auth";

export default function SignUp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [isEmailDisabled, setIsEmailDisabled] = useState(!!token);

  useEffect(() => {
    const verifyToken = async () => {
      const { payload } = await verifyJWT(token);
      setEmail(payload.email);
      setIsEmailDisabled(true);
    };

    if (token && token != "") {
      verifyToken();
    }
  }, [token]);

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
    if (!name) {
      setErrors(["Name is required."]);
      return;
    }
    if (!email) {
      setErrors(["Email is required."]);
      return;
    }
    if (!validatePassword(password)) {
      return;
    }
    try {
      await axios.post(
        "/api/auth/signup",
        { email, password, name, token },
        { headers: { "Content-Type": "application/json" } }
      );
      toast.success("Signup successful!");
      router.push("/dashboard"); // ✅ Redirect manually after success
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Signup failed.");
      } else {
        toast.error("An unexpected error occurred.");
      }
    }
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
              <label htmlFor="name" className="text-[#344054] font-medium">
                Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-[#667085] px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D]"
              />
            </div>
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
                disabled={isEmailDisabled}
                className={`text-[#667085] px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D] ${
                  isEmailDisabled ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
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
          {/* <div className="flex items-center">
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
          </form> */}

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
      <Toaster />
    </div>
  );
}
