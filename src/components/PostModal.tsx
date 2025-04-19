"use client";

import { Monitor, Tablet, XIcon } from "lucide-react";
import LexicalEditor from "@/src/components/LexicalEditor";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import { hasPermission } from "@/src/lib/permissions";
import Image from "next/image";
import useCalendarStore from "@/src/store/calendarStore";

interface PostPayload {
  content: string;
  linkedInAccountIds: string[];
  scheduledFor?: string;
  mediaIds?: string[];
}

interface PostModalProps {
  setPostModalOpen: (value: boolean) => void;
  postId?: string;
  initialContent?: string;
  initialAccounts?: string[];
}

export default function PostModal({
  setPostModalOpen,
  postId,
  initialContent,
  initialAccounts,
}: PostModalProps) {
  const { data: session } = useSession();
  const [postContent, setPostContent] = useState(initialContent || "");
  const [accounts, setAccounts] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(
    initialAccounts || []
  );
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">(
    "desktop"
  );
  const { isEditing, setIsEditing, resetState } = useCalendarStore();

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

      if (isEditing && postId) {
        // Update existing post
        const response = await axios.put(`/api/posts/${postId}`, payload);
        if (response.data) {
          toast.success("Post updated successfully!");
          resetState();
          setPostModalOpen(false);
        }
      } else {
        // Create new post
        const response = await axios.post(endpoint, payload);
        if (response.data) {
          // Clear all form state
          setPostContent("");
          setSelectedAccounts([]);

          // Show success message
          if (post.status === "DRAFT") {
            toast.success("Post saved as draft and pending approval");
          } else if (post.status === "SCHEDULED") {
            toast.success("Post scheduled successfully!");
          } else {
            toast.success("Post published successfully!");
          }
          setPostModalOpen(false);
        }
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
          You don&apos;t have permission to create or manage posts.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-6xl w-full overflow-y-auto p-4">
        <div className="flex justify-between mb-4">
          <h1 className="text-[#161B26] font-medium">
            {isEditing ? "Edit Post" : "Write Post"}
          </h1>
          <button
            className="border border-[#ECECED] rounded-md hover:bg-gray-100 shadow-sm p-1"
            onClick={() => {
              resetState();
              setPostModalOpen(false);
            }}
          >
            <XIcon size={16} color="#61646C" />
          </button>
        </div>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-7">
            <LexicalEditor
              accounts={accounts}
              selectedAccounts={selectedAccounts}
              onChange={setPostContent}
              onAccountsChange={setSelectedAccounts}
              onPost={handlePost}
              requireApproval={!canApprovePosts}
              initialContent={initialContent}
            />
          </div>
          <div className="bg-[#FAFAFA] col-span-5 border border-[#EAECF0] rounded-xl">
            <div className="bg-white flex justify-end p-1 border-b border-[#EAECF0] rounded-t-xl">
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
                className={`flex flex-col gap-4 bg-white p-4 shadow rounded-2xl overflow-hidden ${
                  previewMode === "mobile" ? "max-w-[375px] mx-auto" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <Image
                    width={48}
                    height={48}
                    src="/john-doe.png"
                    alt="john-doe"
                    className="w-12 h-12 bg-gray-100 border rounded-full"
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#101828]">
                      John Doe
                    </span>
                    <span className="text-12 text-[#667085]">Now </span>
                  </div>
                </div>
                <div className="text-sm text-[#161B26] whitespace-pre-wrap">
                  {postContent || "Write something..."}
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Image
                      width={60}
                      height={20}
                      src={"/post-reactions.svg"}
                      alt="post-reactions"
                    />
                    <span className="text-xs text-[#667085] ml-2">136</span>
                  </div>
                  <div className="flex">
                    <span className="text-xs text-[#667085] ml-2">
                      4 comments · 1 repost
                    </span>
                  </div>
                </div>
                <div className="h-0.5 bg-[#ECECED]"></div>
                <div className="flex justify-between text-sm text-[#61646C] font-semibold">
                  <div className="flex gap-1 items-center">
                    <Image
                      width={16}
                      height={16}
                      src={"/like.svg"}
                      alt="like"
                    />
                    <span>Like</span>
                  </div>
                  <div className="flex gap-1 items-center">
                    <Image
                      width={16}
                      height={16}
                      src={"/comment.svg"}
                      alt="like"
                    />
                    <span>Comment</span>
                  </div>
                  <div className="flex gap-1 items-center">
                    <Image
                      width={16}
                      height={16}
                      src={"/repost.svg"}
                      alt="like"
                    />
                    <span>Repost</span>
                  </div>
                  <div className="flex gap-1 items-center">
                    <Image
                      width={16}
                      height={16}
                      src={"/send.svg"}
                      alt="like"
                    />
                    <span>Send</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
