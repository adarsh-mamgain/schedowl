"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "@/src/components/Button";
import axios from "axios";
import { toast } from "react-toastify";
import Toaster from "@/src/components/ui/Toaster";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignInSchema } from "@/src/schema";
import { z } from "zod";
import { useSession } from "@/src/hooks/useSession";

type FormValues = z.infer<typeof SignInSchema>;

export default function SignIn() {
  const router = useRouter(); // ✅ Get the router instance
  const { session, loading } = useSession();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!loading && session) {
      router.replace("/dashboard");
    }
  }, [session, loading, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(SignInSchema),
  });

  const [isLoading, setIsLoading] = useState(false);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    try {
      await axios.post("/api/auth/signin", data, {
        headers: { "Content-Type": "application/json" },
      });
      toast.success("Signin successful!");
      router.push("/dashboard"); // ✅ Redirect manually after success
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Signin failed.");
      } else {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid items-center justify-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main>
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/SchedOwl Logo.svg"
            className="mb-6"
            alt="SchedOwl Logo"
            width={48}
            height={48}
          />
          <h1 className="text-3xl mb-3 font-semibold text-[#101828]">
            Welcome to SchedOwl
          </h1>
          <h2 className="text-[#475467] mb-2">Start your 30-day free trial.</h2>
        </div>
        <div className="flex flex-col gap-4">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-[#344054] font-medium">
                Email
              </label>
              <input
                {...register("email")}
                type="email"
                className="text-[#667085 px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D]"
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
                className="text-[#667085 px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D]"
              />
              {errors.password && (
                <p className="text-red-500 text-sm">
                  {errors.password.message as string}
                </p>
              )}
            </div>
            <Button type="submit" variant="primary" loading={isLoading}>
              Sign In
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
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold underline hover:text-[#475467] hover:no-underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
