"use client";

import { useState } from "react";
import Button from "@/src/components/Button";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface RedeemResult {
  code: string;
  status: "success" | "error";
  message: string;
}

interface AppSumoRedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppSumoRedeemModal({
  isOpen,
  onClose,
}: AppSumoRedeemModalProps) {
  const [codesInput, setCodesInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<RedeemResult[] | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResults(null);

    // Parse and validate codes
    const codes = codesInput
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);
    const uniqueCodes = Array.from(new Set(codes));
    if (uniqueCodes.length < 1 || uniqueCodes.length > 5) {
      toast.error("Please enter between 1 and 5 unique codes.");
      setIsLoading(false);
      return;
    }
    if (uniqueCodes.length !== codes.length) {
      toast.error("Duplicate codes detected. Please enter unique codes only.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/appsumo/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ codes: uniqueCodes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to validate codes");
      }

      setResults(data.results);
      // Show a summary toast
      const successCount = data.results.filter(
        (r: RedeemResult) => r.status === "success"
      ).length;
      if (successCount > 0) {
        toast.success(
          `${successCount} code${
            successCount > 1 ? "s" : ""
          } redeemed successfully!`
        );
        router.refresh();
      }
      if (successCount < data.results.length) {
        toast.error(
          data.results
            .filter((r: RedeemResult) => r.status === "error")
            .map((r: RedeemResult) => `${r.code}: ${r.message}`)
            .join("\n")
        );
      }
      if (successCount > 0) {
        onClose();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to validate codes"
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
          Redeem AppSumo Codes
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Enter 1 to 5 AppSumo codes (one per line) to get lifetime access. Each
          code can only be redeemed once.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="codes" className="text-[#344054] font-medium">
              Codes
            </label>
            <textarea
              id="codes"
              value={codesInput}
              onChange={(e) => setCodesInput(e.target.value)}
              disabled={isLoading}
              className="text-[#667085] px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D] disabled:bg-gray-100 disabled:cursor-not-allowed min-h-[100px]"
              placeholder="Enter up to 5 codes, one per line"
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
              disabled={isLoading || !codesInput.trim()}
              size="small"
            >
              {isLoading ? "Redeeming..." : "Redeem Codes"}
            </Button>
          </div>
        </form>
        {results && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Redemption Results:</h4>
            <ul className="text-sm space-y-1">
              {results.map((r) => (
                <li
                  key={r.code}
                  className={
                    r.status === "success" ? "text-green-600" : "text-red-600"
                  }
                >
                  {r.code}: {r.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
