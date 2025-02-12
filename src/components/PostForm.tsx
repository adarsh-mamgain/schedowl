"use client";

import { Monitor, Tablet } from "lucide-react";
import LexicalEditor from "@/src/components/LexicalEditor";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Button from "@/src/components/Button";

export default function PostForm() {
  const [postContent, setPostContent] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [scheduleTime, setScheduleTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

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

  const handlePost = async (isScheduled = false) => {
    if (!postContent.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }

    if (selectedAccounts.length === 0) {
      toast.error("Please select at least one LinkedIn account");
      return;
    }

    if (isScheduled && !scheduleTime) {
      toast.error("Please select a schedule time");
      return;
    }

    try {
      const endpoint = isScheduled
        ? "/api/posts/schedule"
        : "/api/posts/publish";
      const payload = {
        content: postContent,
        linkedInAccountIds: selectedAccounts,
        ...(isScheduled && { scheduledFor: scheduleTime }),
      };

      await axios.post(endpoint, payload);
      toast.success(
        isScheduled
          ? "Post scheduled successfully!"
          : "Post published successfully!"
      );
      setPostContent("");
      setSelectedAccounts([]);
      setScheduleTime("");
    } catch {
      toast.error(
        isScheduled ? "Failed to schedule post" : "Failed to publish post"
      );
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-7">
        <LexicalEditor
          accounts={accounts}
          selectedAccounts={selectedAccounts}
          onChange={setPostContent}
          onAccountsChange={setSelectedAccounts}
        />
        <div className="mt-4 flex items-center justify-between">
          <div>
            {isScheduling && (
              <input
                type="datetime-local"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="border p-2 rounded"
              />
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setIsScheduling(!isScheduling);
                if (!isScheduling) {
                  handlePost(true);
                }
              }}
            >
              {isScheduling ? "Schedule" : "Schedule Post"}
            </Button>
            <Button onClick={() => handlePost(false)}>Publish Now</Button>
          </div>
        </div>
      </div>
      <div className="bg-[#FCFCFD] col-span-5 border border-[#EAECF0] rounded-lg">
        <div className="bg-white flex justify-end p-1 border-b border-[#EAECF0] rounded-t-lg">
          <button className="p-2">
            <Tablet size={16} color="#475467" />
          </button>
          <button className="p-2">
            <Monitor size={16} color="#475467" />
          </button>
        </div>
        <div className="p-4">
          <div className="flex flex-col bg-white p-6 shadow rounded-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              <div className="flex flex-col">
                <span className="font-semibold text-[#101828]">John Doe</span>
                <span className="text-sm text-[#667085]">Now </span>
              </div>
            </div>
            <div className="mb-6 text-[#475467]">
              {postContent || "Write something..."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
