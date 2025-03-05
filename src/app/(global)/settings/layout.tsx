"use client";

import { usePathname, useRouter } from "next/navigation";

const TABS = [
  { title: "Profile", path: "/settings/profile" },
  { title: "Members", path: "/settings/members" },
  { title: "Billing", path: "/settings/billing" },
  { title: "Integrations", path: "/settings/integrations" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-semibold text-[#101828]">Settings</h1>
          <p className="text-sm text-[#475467]">
            Manage your account settings from here.
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-3 border-b mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.path}
            className={`text-sm font-semibold text-left px-1 py-2 ${
              pathname === tab.path
                ? "text-[#1570EF] border-b-2 border-b-[#1570EF]"
                : "text-[#667085]"
            }`}
            onClick={() => router.push(tab.path)}
          >
            {tab.title}
          </button>
        ))}
      </div>

      <div>{children}</div>
    </section>
  );
}
