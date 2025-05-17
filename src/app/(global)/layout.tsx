"use client";

import Button from "@/src/components/Button";
import PostModal from "@/src/components/PostModal";
import Toaster from "@/src/components/ui/Toaster";
import { hasPermission } from "@/src/lib/permissions";
import { Role } from "@prisma/client";
import {
  Calendar,
  Settings,
  Image,
  Upload,
  PlusIcon,
  ChevronsUpDownIcon,
  Grid2x2,
  Sparkles,
  SquarePen,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

interface UserOrganisation {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  role: string;
}

const TABS = [
  { title: "Dashboard", path: "/dashboard", icon: Grid2x2 },
  { title: "Calendar", path: "/calendar", icon: Calendar },
  { title: "Drafts", path: "/drafts", icon: SquarePen },
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
  const [postModalOpen, setPostModalOpen] = useState(false);
  const { data: session, update: updateSession } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [userOrganisations, setUserOrganisations] = useState<
    UserOrganisation[]
  >([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);

  useEffect(() => {
    const fetchUserOrganisations = async () => {
      setIsLoadingOrgs(true);
      try {
        const response = await fetch("/api/organisations");
        if (!response.ok) throw new Error("Failed to fetch organisations");
        const data = await response.json();
        setUserOrganisations(data.organisations);
      } catch (error) {
        console.error("Error fetching organisations:", error);
        toast.error("Failed to load organisations");
      } finally {
        setIsLoadingOrgs(false);
      }
    };

    fetchUserOrganisations();
  }, []);

  const switchOrganisation = async (orgId: string) => {
    try {
      const response = await fetch("/api/organisations/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organisationId: orgId }),
      });

      if (!response.ok) throw new Error("Failed to switch organisation");

      const data = await response.json();

      // Update the session with new organization data
      await updateSession({
        ...session,
        organisation: data.organisation,
        organisationRole: data.organisationRole,
      });

      setDropdownOpen(false);
      toast.success("Successfully switched organisation");

      // Use router.refresh() instead of window.location.reload()
      router.refresh();
      router.push(pathname);
    } catch (error) {
      console.error("Error switching organisation:", error);
      toast.error("Failed to switch organisation");
    }
  };

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

  const canManagePosts = hasPermission(
    session?.organisationRole?.role as Role,
    "manage_posts"
  );

  return (
    <div className="h-screen flex">
      <aside className="w-[240px] border-r border-[#EAECF0] rounded-2xl flex flex-col">
        <div className="pt-6 px-4">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="hover:bg-[#FAFAFA] border border-[#ECECED] w-full flex items-center justify-between rounded-lg p-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                  {session?.organisation?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.organisation.image}
                      alt={session.organisation.name}
                      className="w-8 h-8 object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      {session?.organisation?.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="truncate">{session?.organisation?.name}</span>
              </div>
              <div className="border border-[#ECECED] rounded-md hover:bg-gray-100 shadow-sm p-1 flex-shrink-0">
                <ChevronsUpDownIcon size={16} color="#61646C" />
              </div>
            </button>
            {dropdownOpen && (
              <div className="w-full flex flex-col gap-4 p-4 rounded-lg shadow-[0px_1px_2px_0px_#1018280D,0px_-2px_0px_0px_#1018280D_inset,0px_0px_0px_1px_#1018282E_inset] absolute mt-2 bg-white border border-gray-200 rounded shadow-lg z-50">
                <div className="flex items-center gap-2">
                  <div className="relative w-10 h-10 flex-shrink-0 rounded-full overflow-hidden bg-gray-100">
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
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {session?.user?.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {session?.user?.email}
                    </p>
                  </div>
                </div>

                {isLoadingOrgs ? (
                  <div className="text-sm text-gray-500">
                    Loading organisations...
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto">
                    <div className="text-xs font-medium text-gray-500 mb-2">
                      Your organisations
                    </div>
                    {userOrganisations.map((org) => (
                      <button
                        key={org.id}
                        onClick={() => switchOrganisation(org.id)}
                        className={`w-full flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 ${
                          session?.organisation?.id === org.id
                            ? "bg-gray-50"
                            : ""
                        }`}
                      >
                        <div className="w-6 h-6 flex-shrink-0 rounded-full overflow-hidden bg-gray-100">
                          {org.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={org.image}
                              alt={org.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              {org.name[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block truncate text-sm text-left">
                            {org.name}
                          </span>
                          <span className="block truncate text-xs text-gray-500 text-left">
                            {org.role}
                          </span>
                        </div>
                        {session?.organisation?.id === org.id && (
                          <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

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
        <div className="px-4 py-6">
          {canManagePosts && (
            <Button
              size="small"
              className="w-full"
              onClick={() => setPostModalOpen((prev) => !prev)}
            >
              <PlusIcon />
              Write Post
            </Button>
          )}
        </div>
        <nav className="flex-1 pt-0 p-4">
          {TABS.map((tab) => (
            <div key={tab.path}>
              <div
                className={`absolute ${
                  pathname.startsWith(tab.path) ? "bg-[#444CE7]" : "bg-none"
                } w-1 h-9 rounded-r-lg left-0`}
              ></div>
              <button
                className={`w-full flex items-center gap-3 text-sm font-medium text-left p-2 rounded-lg hover:bg-gray-100 mb-2 ${
                  pathname.startsWith(tab.path)
                    ? "bg-[#F5F5F6] text-[#0C111D]"
                    : "text-[#85888E]"
                }`}
                onClick={() => router.push(tab.path)}
              >
                <tab.icon
                  size={16}
                  color={pathname.startsWith(tab.path) ? "#444CE7" : "#85888E"}
                  className="flex-shrink-0"
                />
                <span className="truncate">{tab.title}</span>
              </button>
            </div>
          ))}
        </nav>
        <div className="flex flex-col items-center gap-2 p-4">
          <Button
            className="w-full bg-[#444CE7] dark:bg-[#444CE7] text-white border"
            onClick={() => router.push("/settings/billing")}
          >
            <Sparkles size={16} />
            Upgrade Plan
          </Button>
          <a href="mailto:adarsh@schedowl.com">
            <Button variant="secondary">adarsh@schedowl.com</Button>
          </a>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
          <Toaster />
          {postModalOpen && <PostModal setPostModalOpen={setPostModalOpen} />}
        </div>
      </main>
    </div>
  );
}
