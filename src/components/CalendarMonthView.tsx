"use client";

import React, { useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { X, Edit2, Trash2, Check } from "lucide-react";
import Button from "@/src/components/Button";
import { PostStatus } from "@prisma/client";

interface Post {
  id: string;
  type: string;
  content: string;
  scheduledFor: string;
  status: PostStatus;
  createdById: string;
  mediaIds?: string[];
  socialAccount: {
    id: string;
    name: string;
    type: string;
  };
  createdBy: {
    id: string;
    name: string;
    image: string | null;
  };
  errorMessage?: string | null;
  retryCount?: number;
  media?: Array<{
    media: {
      id: string;
      type: string;
      url: string;
      filename: string;
    };
  }>;
}

interface CalendarMonthViewProps {
  setSelectedDateTime?: (datetime: string) => void;
  posts: Post[];
  onCancelPost: (postId: string) => Promise<void>;
  onEditPost: (postId: string) => void;
  onApprovePost?: (postId: string) => Promise<void>;
  currentMonth: Dayjs;
}

const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  setSelectedDateTime,
  posts,
  onCancelPost,
  onEditPost,
  onApprovePost,
  currentMonth,
}) => {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const daysInMonth = currentMonth.daysInMonth();
  const startDay = currentMonth.startOf("month").day();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Calculate previous and next month's days
  const prevMonthDays = Array.from(
    { length: startDay },
    (_, i) => currentMonth.subtract(1, "month").daysInMonth() - startDay + i + 1
  );

  // Calculate next month's days
  const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;
  const remainingDays = totalCells - (startDay + daysInMonth);
  const nextMonthDays = Array.from({ length: remainingDays }, (_, i) => i + 1);

  const handleDateClick = (day: number, isCurrentMonth: boolean = true) => {
    if (!isCurrentMonth) return;
    const selectedDate = currentMonth.date(day).format("YYYY-MM-DDTHH:mm");
    setSelectedDateTime?.(selectedDate);
  };

  const handlePostClick = (e: React.MouseEvent, post: Post) => {
    e.stopPropagation();
    setSelectedPost(post);
  };

  const getPostsForDate = useMemo(
    () =>
      (day: number): Post[] => {
        const date = currentMonth.date(day).format("YYYY-MM-DD");
        return posts.filter(
          (post) => dayjs(post.scheduledFor).format("YYYY-MM-DD") === date
        );
      },
    [currentMonth, posts]
  );

  const getStatusColor = (status: PostStatus) => {
    switch (status) {
      case PostStatus.PUBLISHED:
        return "bg-green-100 text-green-800";
      case PostStatus.SCHEDULED:
        return "bg-blue-100 text-blue-800";
      case PostStatus.DRAFT:
        return "bg-gray-100 text-gray-800";
      case PostStatus.FAILED:
        return "bg-red-100 text-red-800";
      case PostStatus.RETRYING:
        return "bg-yellow-100 text-yellow-800";
      case PostStatus.CANCELLED:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // const handleUpdatePost = async (postId: string, content: string) => {
  //   try {
  //     await axios.patch(`/api/posts/${postId}`, { content });
  //     toast.success("Post updated successfully");
  //   } catch (error) {
  //     toast.error("Failed to update post");
  //     throw error;
  //   }
  // };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 border border-[#EAECF0] rounded-lg">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-xs font-medium text-gray-600 p-2 border-b border-r border-[#EAECF0]"
          >
            {day}
          </div>
        ))}

        {/* Previous month days */}
        {prevMonthDays.map((day) => (
          <div
            key={`prev-${day}`}
            className="h-32 bg-[#FCFCFD] p-2 border-b border-r border-[#EAECF0] last:border-r-0"
          >
            <div className="text-sm font-medium text-[#667085]">{day}</div>
          </div>
        ))}

        {/* Current month days */}
        {days.map((day) => (
          <div
            key={`current-${day}`}
            onClick={() => handleDateClick(day)}
            className="h-32 bg-white p-2 hover:bg-gray-50 cursor-pointer border-b border-r border-[#EAECF0]"
          >
            <div className="text-sm font-semibold mb-1">{day}</div>
            <div className="space-y-1">
              {getPostsForDate(day).map((post) => (
                <div
                  key={post.id}
                  onClick={(e) => handlePostClick(e, post)}
                  className={`text-xs ${getStatusColor(
                    post.status
                  )} p-1 rounded truncate cursor-pointer hover:opacity-80`}
                >
                  {post.content}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Next month days */}
        {nextMonthDays.map((day) => (
          <div
            key={`next-${day}`}
            className="h-32 bg-[#FCFCFD] p-2 border-b border-r border-[#EAECF0] last:border-r-0"
          >
            <div className="text-sm font-medium text-[#667085]">{day}</div>
          </div>
        ))}
      </div>

      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-md w-full">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedPost.type}</h3>
                <p className="text-sm text-gray-600">
                  {selectedPost.socialAccount.name}
                </p>
              </div>
              <div className="flex gap-2">
                {selectedPost.status === "SCHEDULED" && (
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => onCancelPost(selectedPost.id)}
                  >
                    <Trash2 size={16} />
                    Cancel
                  </Button>
                )}
                {selectedPost.status === "DRAFT" && onApprovePost && (
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => onApprovePost(selectedPost.id)}
                  >
                    <Check size={16} />
                    Approve
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => onEditPost(selectedPost.id)}
                >
                  <Edit2 size={16} />
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setSelectedPost(null)}
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Scheduled for</p>
                <p className="text-sm font-medium">
                  {dayjs(selectedPost.scheduledFor).format(
                    "MMMM D, YYYY h:mm A"
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Content</p>
                <p className="text-sm">{selectedPost.content}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span
                  className={`inline-block text-xs font-medium px-2 py-1 rounded-md ${getStatusColor(
                    selectedPost.status
                  )}`}
                >
                  {selectedPost.status}
                </span>
              </div>
              {selectedPost.mediaIds && selectedPost.mediaIds.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Media</p>
                  <p className="text-sm">
                    {selectedPost.mediaIds.length} attachments
                  </p>
                </div>
              )}
              {selectedPost.errorMessage && (
                <div>
                  <p className="text-sm text-gray-600">Error</p>
                  <p className="text-sm text-red-600">
                    {selectedPost.errorMessage}
                  </p>
                </div>
              )}
              {selectedPost.retryCount && selectedPost.retryCount > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Retry Count</p>
                  <p className="text-sm">{selectedPost.retryCount}/5</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarMonthView;
