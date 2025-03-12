"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Button from "@/src/components/Button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema } from "@/src/schema";
import { z } from "zod";
import { signIn } from "next-auth/react";

type FormValues = z.infer<typeof LoginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const callbackUrl = searchParams.get("callbackUrl");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        return;
      }

      if (callbackUrl) {
        // If there's a callback URL (e.g., from invitation), handle the invitation
        const acceptResponse = await fetch(callbackUrl, {
          method: "POST",
        });

        if (!acceptResponse.ok) {
          const error = await acceptResponse.json();
          throw new Error(error.error || "Failed to accept invitation");
        }
      }

      router.push("/dashboard");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred during login"
      );
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signIn("google", { callbackUrl: callbackUrl || "/dashboard" });
    } catch {
      setError("An error occurred during Google login");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB]">
      <main className="w-full max-w-md p-8 bg-white rounded-xl shadow-[0px_4px_6px_-2px_#10182808]">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/SchedOwl Logo.svg"
            alt="SchedOwl Logo"
            width={48}
            height={48}
            className="mb-4"
          />
          <h1 className="text-2xl font-semibold text-[#101828]">
            Welcome back
          </h1>
          <p className="text-[#475467] mt-2">
            Sign in to your account to continue
          </p>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-[#344054] font-medium">
                Email
              </label>
              <input
                {...register("email")}
                type="email"
                className="text-[#667085] px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D]"
              />
              {errors.email && (
                <p className="text-red-500 text-sm">
                  {errors.email.message as string}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-[#344054] font-medium">
                Password
              </label>
              <input
                {...register("password")}
                type="password"
                className="text-[#667085] px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D]"
              />
              {errors.password && (
                <p className="text-red-500 text-sm">
                  {errors.password.message as string}
                </p>
              )}
            </div>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              className="w-full"
            >
              Sign In
            </Button>
          </form>

          <div className="flex items-center">
            <hr className="flex-grow border-t border-gray-300" />
            <span className="mx-4 text-[#E4E7EC">OR</span>
            <hr className="flex-grow border-t border-gray-300" />
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={handleGoogleLogin}
            loading={isSubmitting}
            className="w-full"
          >
            <Image
              src="/google-icon.svg"
              alt="google icon"
              width={16}
              height={16}
            />
            Continue with Google
          </Button>

          <div className="flex justify-center text-[#344054]">
            <p>
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold underline hover:text-[#475467] hover:no-underline"
              >
                Register
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="border-t-4 border-[#1570EF] rounded-full w-16 h-16 animate-spin mb-3"></div>
          <div className="text-[#101828]">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
