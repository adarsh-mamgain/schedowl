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

interface CalendarWeeklyViewProps {
  setSelectedDateTime?: (datetime: string) => void;
  posts: Post[];
  onCancelPost: (postId: string) => Promise<void>;
  onEditPost: (postId: string) => void;
  onApprovePost?: (postId: string) => Promise<void>;
  currentWeek: Dayjs;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 9); // 9 AM to 11 PM

const CalendarWeeklyView: React.FC<CalendarWeeklyViewProps> = ({
  setSelectedDateTime,
  posts,
  onCancelPost,
  onEditPost,
  onApprovePost,
  currentWeek,
}) => {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Get the days of the current week
  const weekDays = useMemo(() => {
    const startOfWeek = currentWeek.startOf("week");
    return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, "day"));
  }, [currentWeek]);

  const getPostsForDateAndHour = useMemo(
    () =>
      (date: Dayjs, hour: number): Post[] => {
        const dateString = date.format("YYYY-MM-DD");
        return posts.filter((post) => {
          const postDate = dayjs(post.scheduledFor);
          return (
            postDate.format("YYYY-MM-DD") === dateString &&
            postDate.hour() === hour
          );
        });
      },
    [posts]
  );

  const handlePostClick = (e: React.MouseEvent, post: Post) => {
    e.stopPropagation();
    setSelectedPost(post);
  };

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

  const handleCellClick = (date: Dayjs, hour: number) => {
    const selectedDate = date.hour(hour).minute(0).format("YYYY-MM-DDTHH:mm");
    setSelectedDateTime?.(selectedDate);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-8 border border-[#EAECF0] rounded-lg overflow-hidden">
        {/* Time column */}
        <div className="border-r border-[#EAECF0]">
          <div className="h-8 border-b border-[#EAECF0]"></div>
          {HOURS.map((hour) => (
            <div
              key={`hour-${hour}`}
              className="h-16 border-b border-[#EAECF0] flex items-center justify-end pr-2"
            >
              <span className="text-sm text-gray-500">
                {hour === 12
                  ? "12 PM"
                  : hour > 12
                  ? `${hour - 12} PM`
                  : `${hour} AM`}
              </span>
            </div>
          ))}
        </div>

        {/* Days columns */}
        {weekDays.map((day) => (
          <div
            key={day.format("YYYY-MM-DD")}
            className="border-r border-[#EAECF0] last:border-r-0"
          >
            {/* Header */}
            <div className="border-b border-[#EAECF0] text-xs font-medium text-[#85888E] flex items-center justify-center py-2">
              <span>
                {day.format("ddd")} {day.format("D")}
              </span>
            </div>

            {/* Hours cells */}
            {HOURS.map((hour) => {
              const cellPosts = getPostsForDateAndHour(day, hour);
              return (
                <div
                  key={`${day.format("YYYY-MM-DD")}-${hour}`}
                  className="h-16 border-b border-[#EAECF0] p-1 hover:bg-gray-50 cursor-pointer relative"
                  onClick={() => handleCellClick(day, hour)}
                >
                  {cellPosts.length > 0 && (
                    <div className="space-y-1">
                      {cellPosts.map((post) => (
                        <div
                          key={post.id}
                          onClick={(e) => handlePostClick(e, post)}
                          className={`text-xs ${getStatusColor(
                            post.status
                          )} p-1 rounded truncate cursor-pointer hover:opacity-80`}
                        >
                          <div className="font-semibold">{post.content}</div>
                          <div className="text-xs">
                            {dayjs(post.scheduledFor).format("h:mm A")}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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

export default CalendarWeeklyView;
