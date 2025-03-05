"use client";

import Button from "@/src/components/Button";
import Toaster from "@/src/components/ui/Toaster";
import {
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronUp,
  Settings,
  Image,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const TABS = [
  { title: "Dashboard", path: "/dashboard", icon: BarChart3 },
  { title: "Calendar", path: "/calendar", icon: Calendar },
  { title: "Media", path: "/media", icon: Image },
  { title: "Settings", path: "/settings", icon: Settings },
];

export default function GlobalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <div className="h-screen flex">
      <aside className="w-[240px] border-r border-[#EAECF0] flex flex-col">
        <div className="pt-6 px-4">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="w-full flex items-center justify-between"
            >
              <span>{session?.organisation.name}</span>
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
        </div>
        <nav className="flex-1 p-4">
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
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
          <Toaster />
        </div>
      </main>
    </div>
  );
}
