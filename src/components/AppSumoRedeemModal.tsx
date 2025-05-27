"use client";

import { useState } from "react";
import Button from "@/src/components/Button";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface AppSumoRedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppSumoRedeemModal({
  isOpen,
  onClose,
}: AppSumoRedeemModalProps) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/appsumo/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to validate code");
      }

      toast.success("AppSumo code redeemed successfully!");
      onClose();
      router.refresh(); // Refresh the page to update subscription status
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to validate code"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-medium text-gray-900">
          Redeem AppSumo Code
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Enter your AppSumo code to get lifetime access to Pro.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="code" className="text-[#344054] font-medium">
              Code
            </label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isLoading}
              className="text-[#667085] px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D] disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Enter your AppSumo code"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !code.trim()}
              size="small"
            >
              {isLoading ? "Redeeming..." : "Redeem Code"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
