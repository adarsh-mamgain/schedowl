"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Button from "@/src/components/Button";
import { toast } from "react-toastify";
import { SocialAccount } from "@prisma/client";
import Image from "next/image";
import axios from "axios";

export default function IntegrationsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const addLinkedInIntegration = async () => {
    try {
      const response = await axios.get("/api/integrations/linkedin");
      window.location.href = response.data.url;
    } catch {
      toast.error("Failed to connect LinkedIn");
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/integrations/linkedin/accounts");
      const data = await response.json();
      setAccounts(data); // Remove .accounts since the API returns the array directly
    } catch {
      toast.error("Failed to fetch connected accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      const response = await fetch(`/api/social-accounts/${accountId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to disconnect account");
      }

      toast.success("Account disconnected successfully");
      fetchAccounts();
    } catch {
      toast.error("Failed to disconnect account");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[#101828] text-sm font-semibold">
              Connected apps
            </h2>
          </div>
          <p className="text-sm text-[#475467]">
            Supercharge your workflow and connect the tool you use every day.
          </p>
        </div>
      </div>

      {/* Integrations Table */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="flex items-center justify-between border border-[#EAECF0] rounded-lg p-4">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-10 h-10 flex items-center justify-center p-1 border border-[#EAECF0] rounded shadow-[0px_1px_2px_0px_#1018280D]">
              <Image
                src="/linkedin.svg"
                alt="linkedin"
                width={40}
                height={40}
              />
            </div>
            <div>
              <h3 className="text-[#101828] font-semibold">LinkedIn</h3>
              <p className="text-[#475467]">
                A business and employment-focused online professional platform.
              </p>
            </div>
          </div>
          <div className="grow-1">
            <Button size="small" onClick={addLinkedInIntegration}>
              <Plus size={20} />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between border border-[#EAECF0] rounded-lg p-4 opacity-50 cursor-not-allowed">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-10 h-10 flex items-center justify-center p-1 border border-[#EAECF0] rounded shadow-[0px_1px_2px_0px_#1018280D]">
              <Image src="/x.svg" alt="x" width={40} height={40} />
            </div>
            <div>
              <h3 className="text-[#101828] font-semibold">X</h3>
              <p className="text-[#475467]">
                World&apos;s largest social media platforms
              </p>
            </div>
          </div>
          <div className="grow-1">
            <Button size="small" disabled={true}>
              <Plus size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* Connected Accounts Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Account
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Connected
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Last Sync
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accounts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No connected accounts found
                  </td>
                </tr>
              ) : (
                accounts.map((account) => (
                  <tr key={account.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {account &&
                          account.metadata &&
                          typeof account.metadata === "object" &&
                          "picture" in account.metadata &&
                          typeof account.metadata.picture === "string" && (
                            <div className="relative h-10 w-10">
                              <Image
                                className="rounded-full"
                                src={account.metadata.picture}
                                alt={account.name || "Profile picture"}
                                fill
                              />
                            </div>
                          )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {account.name}
                          </div>
                          {account.email && (
                            <div className="text-sm text-gray-500">
                              {account.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">
                        {account.type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(account.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {account.updatedAt
                          ? new Date(account.updatedAt).toLocaleDateString()
                          : "Never"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => handleDisconnect(account.id)}
                        className="inline-flex items-center"
                      >
                        <Trash2 className="h-4 w-4" />
                        Disconnect
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
