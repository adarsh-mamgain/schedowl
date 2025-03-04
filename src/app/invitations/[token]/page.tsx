"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Button from "@/src/components/Button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterForm = z.infer<typeof registerSchema>;

type InvitationData = {
  email: string;
  role: string;
  organization: {
    name: string;
  };
};

function InvitationForm({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExistingUser, setIsExistingUser] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const response = await fetch(`/api/invitations/${params.token}`);
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to fetch invitation");
        }
        const data = await response.json();
        setInvitation(data.invitation);
        setIsExistingUser(data.isExistingUser);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to fetch invitation"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvitation();
  }, [params.token]);

  const onSubmit = async (data: RegisterForm) => {
    try {
      // First, register the user
      const registerResponse = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          organizationName: `${data.name}'s Organization`, // This will be replaced by the invited org
        }),
      });

      if (!registerResponse.ok) {
        const error = await registerResponse.json();
        throw new Error(error.error || "Registration failed");
      }

      // Then, sign in the user
      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error("Failed to sign in");
      }

      // Finally, accept the invitation
      await acceptInvitation();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to process invitation"
      );
    }
  };

  const acceptInvitation = async () => {
    const response = await fetch(`/api/invitations/${params.token}/accept`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to accept invitation");
    }

    router.push("/dashboard");
  };

  const handleGoogleSignIn = async () => {
    try {
      await signIn("google", {
        callbackUrl: `/invitations/${params.token}/accept`,
      });
    } catch {
      setError("Failed to sign in with Google");
    }
  };

  const handleExistingUser = async () => {
    router.push(`/login?callbackUrl=/invitations/${params.token}/accept`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Invalid invitation</div>
      </div>
    );
  }

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
            You&apos;ve been invited to join {invitation.organization.name}
          </h1>
          <p className="text-[#475467] mt-2">Role: {invitation.role}</p>
        </div>

        <div className="space-y-6">
          {isExistingUser ? (
            <div className="space-y-4">
              <p className="text-center text-[#475467] mt-2">
                You already have an account. Please sign in to accept the
                invitation.
              </p>
              <Button onClick={handleExistingUser} className="w-full">
                Sign in with Email
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleGoogleSignIn}
                loading={isSubmitting}
                className="w-full"
              >
                <Image
                  src="/google-icon.svg"
                  alt="google icon"
                  width={16}
                  height={16}
                />
                Sign in with Google
              </Button>
            </div>
          ) : (
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
                  defaultValue={invitation.email}
                  disabled
                  className={`text-[#667085] px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D] ${
                    invitation.email ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">
                    {errors.email.message as string}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="password"
                  className="text-[#344054] font-medium"
                >
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
          )}

          <div className="flex items-center">
            <hr className="flex-grow border-t border-gray-300" />
            <span className="mx-4 text-[#E4E7EC">OR</span>
            <hr className="flex-grow border-t border-gray-300" />
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={handleGoogleSignIn}
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
        </div>
      </main>
    </div>
  );
}

export default function Invitation({ params }: { params: { token: string } }) {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="border-t-4 border-[#1570EF] rounded-full w-16 h-16 animate-spin mb-3"></div>
          <div className="text-[#101828]">Loading...</div>
        </div>
      }
    >
      <InvitationForm params={params} />
    </Suspense>
  );
}
