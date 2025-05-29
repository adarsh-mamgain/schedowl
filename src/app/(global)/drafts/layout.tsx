"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";

export default function DraftsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [postCounts, setPostCounts] = useState({
    draft: 0,
    scheduled: 0,
    published: 0,
  });

  useEffect(() => {
    const fetchPostCounts = async () => {
      try {
        const [draftRes, scheduledRes, publishedRes] = await Promise.all([
          axios.get("/api/posts/by-status?status=DRAFT"),
          axios.get("/api/posts/by-status?status=SCHEDULED"),
          axios.get("/api/posts/by-status?status=PUBLISHED"),
        ]);

        setPostCounts({
          draft: draftRes.data.posts.length,
          scheduled: scheduledRes.data.posts.length,
          published: publishedRes.data.posts.length,
        });
      } catch {
        toast.error("Failed to fetch post counts");
      }
    };

    fetchPostCounts();
  }, []);

  const tabs = [
    {
      name: "Drafts",
      href: "/drafts/draft",
      count: postCounts.draft,
    },
    {
      name: "Scheduled",
      href: "/drafts/scheduled",
      count: postCounts.scheduled,
    },
    {
      name: "Published",
      href: "/drafts/published",
      count: postCounts.published,
    },
  ];

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-semibold text-[#101828]">Drafts</h1>
          <p className="text-sm text-[#475467]">
            Manage your social media posts here.
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-3 border-b mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.href}
            className={`text-sm font-semibold text-left px-1 py-2 ${
              pathname === tab.href
                ? "text-[#444CE7] border-b-2 border-b-[#444CE7]"
                : "text-[#667085]"
            }`}
            onClick={() => router.push(tab.href)}
          >
            {tab.name}
            <span
              className={`text-xs ml-1 rounded-full px-2 py-1 ${
                pathname === tab.href
                  ? "bg-[#F5F8FF] text-[#444CE7]"
                  : "bg-[#F5F5F6] text-[#667085]"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div>{children}</div>
    </section>
  );
}
