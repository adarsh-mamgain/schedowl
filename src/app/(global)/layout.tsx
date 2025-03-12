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
  Upload,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

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
  const { data: session, update: updateSession } = useSession();
  const [isUploading, setIsUploading] = useState(false);

  const handleProfileImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/profile/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload profile image");
      }

      const data = await response.json();
      await updateSession({ image: data.url });
      toast.success("Profile image updated successfully");
    } catch (error) {
      console.error("Error uploading profile image:", error);
      toast.error("Failed to upload profile image");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="h-screen flex">
      <aside className="w-[240px] border-r border-[#EAECF0] flex flex-col">
        <div className="pt-6 px-4">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100">
                  {session?.organisation?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.organisation.image}
                      alt={session.organisation.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      {session?.organisation?.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <span>{session?.organisation?.name}</span>
              </div>
              {dropdownOpen ? (
                <ChevronUp color="#344054" />
              ) : (
                <ChevronDown color="#344054" />
              )}
            </button>
            {dropdownOpen && (
              <div className="w-full flex flex-col gap-4 p-4 rounded-lg shadow-[0px_1px_2px_0px_#1018280D,0px_-2px_0px_0px_#1018280D_inset,0px_0px_0px_1px_#1018282E_inset] absolute mt-2 bg-white border border-gray-200 rounded shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                    {session?.user?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={session.user.image}
                        alt={session.user.name || ""}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        {session?.user?.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 w-4 h-4 bg-white rounded-full cursor-pointer flex items-center justify-center">
                      <Upload className="w-3 h-3" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                  <div>
                    <p className="font-medium">{session?.user?.name}</p>
                    <p className="text-sm text-gray-500">
                      {session?.user?.email}
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => signOut()}
                >
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
