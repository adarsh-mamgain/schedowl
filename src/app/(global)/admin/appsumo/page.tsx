"use client";

import { useState, useEffect } from "react";
import Button from "@/src/components/Button";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import axios from "axios";

interface AppSumoCode {
  id: string;
  code: string;
  status: "ACTIVE" | "REDEEMED" | "REVOKED";
  userId: string | null;
  redeemedAt: string | null;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  name: string;
}

export default function AppSumoAdmin() {
  const { data: session } = useSession();

  if (
    !session?.user?.email ||
    (session.user.email !== "work.mamgain@gmail.com" &&
      session.user.email !== "mrakshayvm@gmail.com")
  ) {
    redirect("/");
  }
  const [codes, setCodes] = useState<AppSumoCode[]>([]);
  const [newCodes, setNewCodes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [manualRedeemCodes, setManualRedeemCodes] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

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

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setUsers(data);
    } catch {
      toast.error("Failed to fetch users");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchCodes();
    fetchUsers();
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

  const handleManualRedeem = async () => {
    if (!selectedUser) {
      toast.error("Please select a user");
      return;
    }

    if (!manualRedeemCodes.trim()) {
      toast.error("Please enter codes");
      return;
    }

    setIsRedeeming(true);
    try {
      const codeList = manualRedeemCodes
        .split("\n")
        .map((code) => code.trim())
        .filter(Boolean);

      const response = await fetch("/api/admin/appsumo/manual-redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: selectedUser.email,
          codes: codeList,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success(`Redeemed ${data.results.length} codes successfully`);
      setSelectedUser(null);
      setManualRedeemCodes("");
      fetchCodes();
    } catch {
      toast.error("Failed to redeem codes");
    } finally {
      setIsRedeeming(false);
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

        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="manualRedeem"
              className="text-[#344054] font-medium"
            >
              Manually Redeem Codes
            </label>
            <div className="relative">
              <select
                id="manualRedeemUser"
                value={selectedUser?.id || ""}
                onChange={(e) => {
                  const user = users.find((u) => u.id === e.target.value);
                  setSelectedUser(user || null);
                }}
                className="w-full text-[#667085] px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D] appearance-none bg-white"
                disabled={isLoadingUsers}
              >
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              {isLoadingUsers && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                </div>
              )}
            </div>
            <textarea
              id="manualRedeemCodes"
              placeholder="Enter codes to redeem (one per line)"
              value={manualRedeemCodes}
              onChange={(e) => setManualRedeemCodes(e.target.value)}
              className="text-[#667085] px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D] min-h-[100px]"
            />
          </div>
          <Button
            size="small"
            onClick={handleManualRedeem}
            disabled={isRedeeming || !selectedUser}
          >
            {isRedeeming ? "Redeeming..." : "Redeem Codes"}
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
