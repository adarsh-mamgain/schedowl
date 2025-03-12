"use client";

import { useEffect, useState } from "react";
import { PostStatus } from "@prisma/client";
import CalendarView from "@/src/components/CalendarView";
import { toast } from "react-toastify";
import axios from "axios";
import Button from "@/src/components/Button";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

interface Post {
  id: string;
  content: string;
  scheduledFor: string;
  status: PostStatus;
  publishedAt: string | null;
  errorMessage: string | null;
  retryCount: number;
  lastRetryAt: string | null;
  type: string;
  socialAccount: {
    id: string;
    name: string;
    type: string;
    profileUrl: string | null;
  };
  createdBy: {
    id: string;
    name: string;
    image: string | null;
  };
  media: Array<{
    media: {
      id: string;
      type: string;
      url: string;
      filename: string;
    };
  }>;
}

export default function CalendarPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateTime, setSelectedDateTime] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf("month"));
  const router = useRouter();

  useEffect(() => {
    fetchPosts();
  }, [currentMonth]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const startDate = currentMonth.startOf("month").toISOString();
      const endDate = currentMonth.endOf("month").toISOString();

      const result = await axios.get("/api/posts", {
        params: {
          startDate,
          endDate,
        },
      });

      // Ensure we're setting an array of posts
      const postsData = Array.isArray(result.data)
        ? result.data
        : result.data.posts || [];
      setPosts(postsData);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to fetch posts");
      setPosts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPost = async (postId: string) => {
    try {
      await axios.post(`/api/posts/${postId}/cancel`);
      toast.success("Post cancelled successfully");
      fetchPosts();
    } catch (error) {
      toast.error("Failed to cancel post");
    }
  };

  const handleEditPost = (postId: string) => {
    router.push(`/posts/${postId}/edit`);
  };

  const handleCreatePost = () => {
    router.push("/dashboard");
  };

  const handleMonthChange = (newMonth: dayjs.Dayjs) => {
    setCurrentMonth(newMonth);
  };

  const mappedPosts = posts.map((post) => ({
    id: post.id,
    type: post.socialAccount.type,
    content: post.content,
    scheduledFor: post.scheduledFor,
    status: post.status,
    createdById: post.createdBy.id,
    mediaIds: post.media.map((m) => m.media.id),
    socialAccount: post.socialAccount,
    createdBy: post.createdBy,
    errorMessage: post.errorMessage,
    retryCount: post.retryCount,
  }));

  if (loading) {
    return (
      <section>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-semibold text-[#101828]">Calendar</h1>
            <p className="text-sm text-[#475467]">
              Manage your content calendar from here.
            </p>
          </div>
          <div>
            <Button size="small" onClick={handleCreatePost}>
              Write Post
            </Button>
          </div>
        </div>
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-gray-500">Loading posts...</div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-semibold text-[#101828]">Calendar</h1>
          <p className="text-sm text-[#475467]">
            Manage your content calendar from here.
          </p>
        </div>
        <div>
          <Button size="small" onClick={handleCreatePost}>
            Write Post
          </Button>
        </div>
      </div>
      <CalendarView
        setSelectedDateTime={setSelectedDateTime}
        posts={mappedPosts}
        onCancelPost={handleCancelPost}
        onEditPost={handleEditPost}
        currentMonth={currentMonth}
        onMonthChange={handleMonthChange}
      />
    </section>
  );
}
