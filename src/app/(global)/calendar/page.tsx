"use client";

import { useEffect, useState, useCallback } from "react";
import { PostStatus } from "@prisma/client";
import { toast } from "react-toastify";
import axios from "axios";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import { hasPermission } from "@/src/lib/permissions";
import CalendarMonthView from "@/src/components/CalendarMonthView";
import CalendarWeekView from "@/src/components/CalendarWeekView";
import CalendarDayView from "@/src/components/CalendarDayView";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

// Initialize dayjs plugins
dayjs.extend(weekOfYear);

type CalendarViewType = "month" | "week" | "day";

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
    metadata: {
      picture: string | null;
    };
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
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [viewType, setViewType] = useState<CalendarViewType>("month");
  const router = useRouter();

  // Calculate date range based on view type
  const getDateRange = useCallback(() => {
    if (viewType === "month") {
      return {
        startDate: currentDate.startOf("month").toISOString(),
        endDate: currentDate.endOf("month").toISOString(),
      };
    } else if (viewType === "week") {
      return {
        startDate: currentDate.startOf("week").toISOString(),
        endDate: currentDate.endOf("week").toISOString(),
      };
    } else {
      // Day view - extend the range slightly to ensure we get all posts
      return {
        startDate: currentDate.startOf("day").toISOString(),
        endDate: currentDate.endOf("day").toISOString(),
      };
    }
  }, [currentDate, viewType]);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();

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
  }, [getDateRange]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleCancelPost = async (postId: string) => {
    try {
      await axios.post(`/api/posts/${postId}/cancel`);
      toast.success("Post cancelled successfully");
      fetchPosts();
    } catch {
      toast.error("Failed to cancel post");
    }
  };

  const handleApprovePost = async (postId: string) => {
    try {
      await axios.post(`/api/posts/${postId}/approve`);
      toast.success("Post approved successfully");
      fetchPosts();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Failed to approve post");
      } else {
        toast.error("Failed to approve post");
      }
    }
  };

  const handleEditPost = (postId: string) => {
    router.push(`/posts/${postId}/edit`);
  };

  const handleDateChange = (newDate: dayjs.Dayjs) => {
    setCurrentDate(newDate);
  };

  const handleNavigatePrev = () => {
    if (viewType === "month") {
      setCurrentDate(currentDate.subtract(1, "month"));
    } else if (viewType === "week") {
      setCurrentDate(currentDate.subtract(1, "week"));
    } else {
      setCurrentDate(currentDate.subtract(1, "day"));
    }
  };

  const handleNavigateNext = () => {
    if (viewType === "month") {
      setCurrentDate(currentDate.add(1, "month"));
    } else if (viewType === "week") {
      setCurrentDate(currentDate.add(1, "week"));
    } else {
      setCurrentDate(currentDate.add(1, "day"));
    }
  };

  const handleNavigateToday = () => {
    setCurrentDate(dayjs());
  };

  const handleViewTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setViewType(e.target.value as CalendarViewType);
  };

  const handleSetSelectedDateTime = (dateTime: string) => {
    // Function to handle when user selects a time slot to create a new post
    router.push(`/posts/new?scheduledFor=${dateTime}`);
  };

  const canApprovePosts = hasPermission(
    session?.organisationRole?.role as Role,
    "approve_posts"
  );

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

  // Helper to format the date header based on view type
  const getHeaderText = () => {
    if (viewType === "month") {
      return (
        <h2 className="text-lg font-semibold">
          {currentDate.format("MMMM YYYY")}
        </h2>
      );
    } else if (viewType === "week") {
      const startOfWeek = currentDate.startOf("week");
      const endOfWeek = currentDate.endOf("week");
      return (
        <h2 className="text-lg font-semibold">
          {currentDate.format("MMMM YYYY")} ·{" "}
          <span className="text-[#85888E] font-normal">
            {startOfWeek.format("MMM D, YYYY")} -{" "}
            {endOfWeek.format("MMM D, YYYY")} · Week {currentDate.week()}
          </span>
        </h2>
      );
    } else {
      return (
        <h2 className="text-lg font-semibold">
          {currentDate.format("MMMM D, YYYY")} ·{" "}
          <span className="text-[#85888E] font-normal">
            {currentDate.format("dddd")}
          </span>
        </h2>
      );
    }
  };

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
      </div>

      <div className="flex justify-between items-center mb-4">
        {getHeaderText()}

        <div className="flex gap-4">
          <div className="flex">
            <button
              className="w-8 h-8 inline-flex items-center justify-center border-y border-l rounded-l-lg"
              onClick={handleNavigatePrev}
            >
              <ArrowLeftIcon size={16} />
            </button>
            <button
              className="w-8 h-8 inline-flex items-center justify-center border"
              onClick={handleNavigateToday}
            >
              <span className="block w-2 h-2 bg-black rounded-full"></span>
            </button>
            <button
              className="w-8 h-8 inline-flex items-center justify-center border-y border-r rounded-r-lg"
              onClick={handleNavigateNext}
            >
              <ArrowRightIcon size={16} />
            </button>
          </div>
          <div className="text-[#61646C] font-medium border rounded-lg px-1.5 py-1 text-sm">
            <select
              name="view"
              id="view"
              value={viewType}
              onChange={handleViewTypeChange}
            >
              <option value="month">Month View</option>
              <option value="week">Week View</option>
              <option value="day">Day View</option>
            </select>
          </div>
        </div>
      </div>

      {viewType === "month" && (
        <CalendarMonthView
          posts={mappedPosts}
          onCancelPost={handleCancelPost}
          onEditPost={handleEditPost}
          onApprovePost={canApprovePosts ? handleApprovePost : undefined}
          currentMonth={currentDate}
          setSelectedDateTime={handleSetSelectedDateTime}
        />
      )}

      {viewType === "week" && (
        <CalendarWeekView
          posts={mappedPosts}
          onCancelPost={handleCancelPost}
          onEditPost={handleEditPost}
          onApprovePost={canApprovePosts ? handleApprovePost : undefined}
          currentWeek={currentDate}
          setSelectedDateTime={handleSetSelectedDateTime}
        />
      )}

      {viewType === "day" && (
        <CalendarDayView
          posts={mappedPosts}
          onCancelPost={handleCancelPost}
          onEditPost={handleEditPost}
          onApprovePost={canApprovePosts ? handleApprovePost : undefined}
          currentDay={currentDate}
          onDayChange={handleDateChange}
          setSelectedDateTime={handleSetSelectedDateTime}
        />
      )}
    </section>
  );
}
