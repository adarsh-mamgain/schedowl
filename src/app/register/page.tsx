"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import Button from "@/src/components/Button";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterSchema } from "@/src/schema";
import { z } from "zod";
import { signIn } from "next-auth/react";

type FormValues = z.infer<typeof RegisterSchema>;

function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Registration failed");
      }

      router.push("/");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Registration failed");
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setError("Failed to sign up with Google");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB]">
      <main className="w-full max-w-md p-8 bg-white rounded-xl shadow-[0px_4px_6px_-2px_#10182808]">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/SchedOwl Logo.svg"
            alt="SchedOwl Logo"
            width={80}
            height={80}
          />
          <h1 className="text-2xl font-semibold text-[#101828]">
            Create an account
          </h1>
          <p className="text-[#475467] mt-1">Start your 30-day free trial</p>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <div className="flex flex-col gap-1">
              <label htmlFor="name" className="text-[#344054] font-medium">
                Name
              </label>
              <input
                {...register("name")}
                type="text"
                className="text-[#667085] px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D]"
              />
              {errors.name && (
                <p className="text-red-500 text-sm">
                  {errors.name.message as string}
                </p>
              )}
            </div>

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

            <div className="flex flex-col gap-1">
              <label
                htmlFor="organisationName"
                className="text-[#344054] font-medium"
              >
                Organisation Name
              </label>
              <input
                {...register("organisationName")}
                type="organisationName"
                className="text-[#667085] px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D]"
              />
              {errors.organisationName && (
                <p className="text-red-500 text-sm">
                  {errors.organisationName.message as string}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              className="w-full"
            >
              Get started
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
            onClick={handleGoogleSignUp}
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
              Already have an account?{" "}
              <Link
                href="/"
                className="font-semibold underline hover:text-[#475467] hover:no-underline"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Register() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="border-t-4 border-[#1570EF] rounded-full w-16 h-16 animate-spin mb-3"></div>
          <div className="text-[#101828]">Loading...</div>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
