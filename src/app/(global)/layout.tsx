"use client";

import Button from "@/src/components/Button";
import Toaster from "@/src/components/ui/Toaster";
import { Organisation, User } from "@prisma/client";
import axios from "axios";
import {
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronUp,
  Settings,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const TABS = [
  { title: "Dashboard", path: "/dashboard", icon: BarChart3 },
  { title: "Calendar", path: "/calendar", icon: Calendar },
  { title: "Settings", path: "/settings", icon: Settings },
];

type UserMe = {
  user: User;
  organisation: Organisation;
};

export default function GlobalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [me, setMe] = useState<UserMe>();

  useEffect(() => {
    const getUserAndOrgDetails = async () => {
      try {
        const response = await axios.get("/api/user");
        setMe(response.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          toast.error(error.response?.data?.error || "Failed to fetch user");
        } else {
          toast.error("An unexpected error occurred.");
        }
      }
    };
    getUserAndOrgDetails();
  }, []);

  const signOut = async () => {
    await axios.post("/api/auth/logout");
    router.push("/signin");
  };

  return (
    <div className="w-screen h-screen grid grid-cols-12">
      <aside className="h-full col-span-2 border-r border-[#EAECF0] pt-6 p-4">
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="w-full flex items-center justify-between"
          >
            <span>{me?.organisation.name}</span>
            {dropdownOpen ? (
              <ChevronUp color="#344054" />
            ) : (
              <ChevronDown color="#344054" />
            )}
          </button>
          {dropdownOpen && (
            <div className="w-full flex flex-col gap-1 p-2 rounded-lg shadow-[0px_1px_2px_0px_#1018280D,0px_-2px_0px_0px_#1018280D_inset,0px_0px_0px_1px_#1018282E_inset] absolute mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg">
              <Button variant="secondary" size="small" onClick={signOut}>
                Sign out
              </Button>
            </div>
          )}
        </div>
        <div className="mt-4">
          {TABS.map((tab) => (
            <button
              key={tab.path}
              className={`w-full flex items-center gap-3 text-sm font-medium text-left p-2 rounded-lg hover:bg-gray-100 mb-2 ${
                pathname.startsWith(tab.path)
                  ? "bg-gray-200 text-[#182230]"
                  : "text-[#344054]"
              }`}
              onClick={() => router.push(tab.path)}
            >
              <tab.icon size={16} color={"#344054"} />
              {tab.title}
            </button>
          ))}
        </div>
      </aside>

      <main className="col-span-10 h-full p-6">
        {children}
        <Toaster />
      </main>
    </div>
  );
}
