"use client";

import { Monitor, Tablet } from "lucide-react";
import LexicalEditor from "@/src/components/LexicalEditor";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import { hasPermission } from "@/src/lib/permissions";

interface PostPayload {
  content: string;
  linkedInAccountIds: string[];
  scheduledFor?: string;
  mediaIds?: string[];
}

export default function PostForm() {
  const { data: session } = useSession();
  const [postContent, setPostContent] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">(
    "desktop"
  );

  useEffect(() => {
    fetchLinkedInAccounts();
  }, []);

  const fetchLinkedInAccounts = async () => {
    try {
      const response = await axios.get("/api/integrations/linkedin/accounts");
      setAccounts(response.data);
    } catch {
      toast.error("Failed to fetch LinkedIn accounts");
    }
  };

  const handlePost = async (post: {
    content: string;
    status: "DRAFT" | "SCHEDULED" | "PUBLISHED";
    scheduledFor?: string;
    mediaIds?: string[];
    socialAccountIds: string[];
  }) => {
    if (!post.content) {
      toast.error("Post content cannot be empty");
      return;
    }

    if (post.socialAccountIds.length === 0) {
      toast.error("Please select at least one LinkedIn account");
      return;
    }

    try {
      let endpoint = "/api/posts/publish";
      let payload: PostPayload = {
        content: post.content,
        linkedInAccountIds: post.socialAccountIds,
      };

      if (post.status === "SCHEDULED" && post.scheduledFor) {
        endpoint = "/api/posts/schedule";
        payload = {
          ...payload,
          scheduledFor: post.scheduledFor,
        };
      }

      if (post.mediaIds && post.mediaIds.length > 0) {
        payload = {
          ...payload,
          mediaIds: post.mediaIds,
        };
      }

      const response = await axios.post(endpoint, payload);

      if (response.data) {
        toast.success(
          post.status === "SCHEDULED"
            ? "Post scheduled successfully!"
            : "Post published successfully!"
        );
        setPostContent("");
        setSelectedAccounts([]);
      }
    } catch (error) {
      console.error("Post error:", error);
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Failed to publish post");
      } else {
        toast.error(
          post.status === "SCHEDULED"
            ? "Failed to schedule post"
            : "Failed to publish post"
        );
      }
    }
  };

  const canManagePosts = hasPermission(
    session?.organisationRole?.role as Role,
    "manage_posts"
  );
  const canApprovePosts = hasPermission(
    session?.organisationRole?.role as Role,
    "approve_posts"
  );

  // If user can't manage posts, show a message
  if (!canManagePosts) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">
          You don't have permission to create or manage posts.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-7">
        <LexicalEditor
          accounts={accounts}
          selectedAccounts={selectedAccounts}
          onChange={setPostContent}
          onAccountsChange={setSelectedAccounts}
          onPost={handlePost}
          requireApproval={!canApprovePosts}
        />
      </div>
      <div className="bg-[#FCFCFD] col-span-5 border border-[#EAECF0] rounded-lg">
        <div className="bg-white flex justify-end p-1 border-b border-[#EAECF0] rounded-t-lg">
          <button
            className={`p-2 ${
              previewMode === "mobile" ? "text-blue-600" : "text-[#475467]"
            }`}
            onClick={() => setPreviewMode("mobile")}
          >
            <Tablet size={16} />
          </button>
          <button
            className={`p-2 ${
              previewMode === "desktop" ? "text-blue-600" : "text-[#475467]"
            }`}
            onClick={() => setPreviewMode("desktop")}
          >
            <Monitor size={16} />
          </button>
        </div>
        <div className="p-4">
          <div
            className={`flex flex-col bg-white p-6 shadow rounded-lg ${
              previewMode === "mobile" ? "max-w-[375px] mx-auto" : ""
            }`}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              <div className="flex flex-col">
                <span className="font-semibold text-[#101828]">John Doe</span>
                <span className="text-sm text-[#667085]">Now </span>
              </div>
            </div>
            <div className="mb-6 text-[#475467] whitespace-pre-wrap">
              {postContent || "Write something..."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
