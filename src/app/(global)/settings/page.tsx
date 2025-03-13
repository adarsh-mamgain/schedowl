"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/settings/profile");
  }, [router]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="border-t-4 border-[#1570EF] rounded-full w-16 h-16 animate-spin mb-3"></div>
      <div className="text-[#101828]">Redirecting...</div>
    </div>
  );
}
