"use client";

import { useState, useEffect } from "react";
import Button from "@/src/components/Button";
import { toast } from "react-toastify";

interface AppSumoCode {
  id: string;
  code: string;
  status: "ACTIVE" | "REDEEMED" | "REVOKED";
  userId: string | null;
  redeemedAt: string | null;
  createdAt: string;
}

export default function AppSumoAdmin() {
  const [codes, setCodes] = useState<AppSumoCode[]>([]);
  const [newCodes, setNewCodes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchCodes = async () => {
    try {
      const response = await fetch("/api/admin/appsumo");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setCodes(data);
    } catch {
      toast.error("Failed to fetch codes");
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleCreateCodes = async () => {
    if (!newCodes.trim()) {
      toast.error("Please enter codes");
      return;
    }

    setIsLoading(true);
    try {
      const codeList = newCodes
        .split("\n")
        .map((code) => code.trim())
        .filter(Boolean);

      const response = await fetch("/api/admin/appsumo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ codes: codeList }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success(`Created ${data.count} codes successfully`);
      setNewCodes("");
      fetchCodes();
    } catch {
      toast.error("Failed to create codes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (
    code: string,
    status: "ACTIVE" | "REDEEMED" | "REVOKED"
  ) => {
    try {
      const response = await fetch("/api/admin/appsumo", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, status }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success("Code status updated successfully");
      fetchCodes();
    } catch {
      toast.error("Failed to update code status");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: "bg-green-500",
      REDEEMED: "bg-gray-400",
      REVOKED: "bg-red-500",
    } as const;

    return (
      <div className="w-max flex items-center gap-1 border border-[#D0D5DD] text-xs font-medium px-1.5 py-0.5 rounded-md shadow-[0px_1px_2px_0px_#1018280D]">
        <span
          className={`w-2 h-2 rounded-full ${
            variants[status as keyof typeof variants]
          }`}
        ></span>
        <span>{status}</span>
      </div>
    );
  };

  const handleDeleteCodes = async () => {
    try {
      const response = await fetch("/api/admin/appsumo", {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete codes");
      toast.success("All codes deleted successfully");
      fetchCodes();
    } catch {
      toast.error("Failed to delete codes");
    }
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[#101828] text-sm font-semibold">
              AppSumo Code Management
            </h2>
            <span className="bg-white text-[#344054] text-xs font-medium rounded px-1.5 py-0.5 border">
              {codes.length}
            </span>
          </div>
          <p className="text-sm text-[#475467]">
            Manage your AppSumo codes and their status here.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="codes" className="text-[#344054] font-medium">
              Create new codes
            </label>
            <textarea
              id="codes"
              placeholder="Enter codes (one per line)"
              value={newCodes}
              onChange={(e) => setNewCodes(e.target.value)}
              className="text-[#667085] px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D] min-h-[100px]"
            />
          </div>
          <Button size="small" onClick={handleCreateCodes} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Codes"}
          </Button>
        </div>

        <div className="flex justify-between items-center">
          <h2 className="font-medium">Existing Codes</h2>
          <Button variant="danger" size="small" onClick={handleDeleteCodes}>
            Delete All Codes
          </Button>
        </div>

        <div className="bg-white border border-[#E4E7EC] rounded-lg shadow-[0px_1px_2px_0px_#1018280D]">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-b-[#E4E7EC] text-xs">
                <th className="px-6 py-3 font-medium text-[#475467]">Code</th>
                <th className="px-6 py-3 font-medium text-[#475467]">Status</th>
                <th className="px-6 py-3 font-medium text-[#475467]">
                  Created At
                </th>
                <th className="px-6 py-3 font-medium text-[#475467]">
                  Redeemed At
                </th>
                <th className="px-6 py-3 font-medium text-[#475467]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {codes.map((code) => (
                <tr
                  key={code.id}
                  className="border-b border-b-[#E4E7EC] hover:bg-gray-50"
                >
                  <td className="px-6 py-3 text-[#344054] font-mono">
                    {code.code}
                  </td>
                  <td className="px-6 py-3 text-[#344054]">
                    {getStatusBadge(code.status)}
                  </td>
                  <td className="px-6 py-3 text-[#344054]">
                    {new Date(code.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3 text-[#344054]">
                    {code.redeemedAt
                      ? new Date(code.redeemedAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-6 py-3 text-[#344054]">
                    {code.status === "ACTIVE" && (
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => handleUpdateStatus(code.code, "REVOKED")}
                      >
                        Revoke
                      </Button>
                    )}
                    {code.status === "REVOKED" && (
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleUpdateStatus(code.code, "ACTIVE")}
                      >
                        Reactivate
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
