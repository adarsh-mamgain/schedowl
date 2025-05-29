import React, { useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { Edit2, Trash2, Check, ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/src/components/Button";
import { PostStatus, Role } from "@prisma/client";
import useCalendarStore from "@/src/store/calendarStore";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/src/lib/permissions";
import { toast } from "react-toastify";

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

interface CalendarDayViewProps {
  setSelectedDateTime?: (datetime: string) => void;
  posts: Post[];
  onCancelPost: (postId: string) => Promise<void>;
  onEditPost: (postId: string) => void;
  onApprovePost?: (postId: string) => Promise<void>;
  currentDay: Dayjs;
  onDayChange: (day: Dayjs) => void;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 9); // 9 AM to 11 PM

const CalendarDayView: React.FC<CalendarDayViewProps> = ({
  setSelectedDateTime,
  posts,
  onCancelPost,
  onEditPost,
  onApprovePost,
  currentDay,
  onDayChange,
}) => {
  const { data: session } = useSession();
  const {
    selectedPost,
    setSelectedPost,
    isEditing,
    setIsEditing,
    isApproving,
    setIsApproving,
    isDeleting,
    setIsDeleting,
    resetState,
  } = useCalendarStore();

  const canManagePosts = hasPermission(
    session?.organisationRole?.role as Role,
    "manage_posts"
  );
  const canApprovePosts = hasPermission(
    session?.organisationRole?.role as Role,
    "approve_posts"
  );

  const [viewDate, setViewDate] = useState(currentDay.startOf("month"));

  // Get mini calendar weeks
  const calendarWeeks = useMemo(() => {
    const startOfMonth = viewDate.startOf("month");
    const endOfMonth = viewDate.endOf("month");
    const startDay = startOfMonth.day(); // 0 is Sunday, 1 is Monday, etc.
    const daysInMonth = endOfMonth.date();

    // Previous month days
    const prevMonthDays = Array.from({ length: startDay }, (_, i) => {
      const day = startOfMonth.subtract(startDay - i, "day");
      return {
        date: day,
        isCurrentMonth: false,
        isToday: day.isSame(dayjs(), "day"),
        isSelected: day.isSame(currentDay, "day"),
        hasEvents: posts.some(
          (post) =>
            dayjs(post.scheduledFor).format("YYYY-MM-DD") ===
            day.format("YYYY-MM-DD")
        ),
      };
    });

    // Current month days
    const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => {
      const day = startOfMonth.add(i, "day");
      return {
        date: day,
        isCurrentMonth: true,
        isToday: day.isSame(dayjs(), "day"),
        isSelected: day.isSame(currentDay, "day"),
        hasEvents: posts.some(
          (post) =>
            dayjs(post.scheduledFor).format("YYYY-MM-DD") ===
            day.format("YYYY-MM-DD")
        ),
      };
    });

    // Calculate how many days we need from the next month to complete our grid
    const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;
    const nextMonthDays = Array.from(
      { length: totalCells - (prevMonthDays.length + currentMonthDays.length) },
      (_, i) => {
        const day = endOfMonth.add(i + 1, "day");
        return {
          date: day,
          isCurrentMonth: false,
          isToday: day.isSame(dayjs(), "day"),
          isSelected: day.isSame(currentDay, "day"),
          hasEvents: posts.some(
            (post) =>
              dayjs(post.scheduledFor).format("YYYY-MM-DD") ===
              day.format("YYYY-MM-DD")
          ),
        };
      }
    );

    const allDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

    // Group into weeks
    const weeks = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weeks.push(allDays.slice(i, i + 7));
    }

    return weeks;
  }, [currentDay, posts, viewDate]);

  // Get posts for the selected day
  const postsForSelectedDay = useMemo(() => {
    return posts
      .filter(
        (post) =>
          dayjs(post.scheduledFor).format("YYYY-MM-DD") ===
          currentDay.format("YYYY-MM-DD")
      )
      .sort(
        (a, b) =>
          dayjs(a.scheduledFor).valueOf() - dayjs(b.scheduledFor).valueOf()
      );
  }, [currentDay, posts]);

  const getPostsForHour = (hour: number): Post[] => {
    return postsForSelectedDay.filter((post) => {
      const postHour = dayjs(post.scheduledFor).hour();
      return postHour === hour;
    });
  };

  const prevMonth = () => {
    setViewDate(viewDate.subtract(1, "month"));
  };

  const nextMonth = () => {
    setViewDate(viewDate.add(1, "month"));
  };

  const handleDayClick = (day: Dayjs) => {
    onDayChange(day);
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
  };

  const handleHourClick = (hour: number) => {
    if (setSelectedDateTime) {
      const selectedDate = currentDay
        .hour(hour)
        .minute(0)
        .format("YYYY-MM-DDTHH:mm");
      setSelectedDateTime(selectedDate);
    }
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

  const handleEditClick = (post: Post) => {
    setSelectedPost(post);
    setIsEditing(true);
    onEditPost(post.id);
  };

  const handleDeleteClick = async (post: Post) => {
    if (!canManagePosts) {
      toast.error("You don't have permission to delete posts");
      return;
    }

    try {
      setIsDeleting(true);
      await onCancelPost(post.id);
      toast.success("Post deleted successfully");
      resetState();
    } catch {
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApproveClick = async (post: Post) => {
    if (!canApprovePosts) {
      toast.error("You don't have permission to approve posts");
      return;
    }

    try {
      setIsApproving(true);
      await onApprovePost?.(post.id);
      toast.success("Post approved successfully");
      resetState();
    } catch {
      toast.error("Failed to approve post");
    } finally {
      setIsApproving(false);
    }
  };

  const renderPostActions = (post: Post) => {
    if (!canManagePosts) return null;

    return (
      <div className="flex items-center gap-2">
        {post.status === PostStatus.DRAFT && canApprovePosts && (
          <button
            onClick={() => handleApproveClick(post)}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={isApproving}
          >
            <Check size={16} className="text-green-600" />
          </button>
        )}
        <button
          onClick={() => handleEditClick(post)}
          className="p-1 hover:bg-gray-100 rounded"
          disabled={isEditing}
        >
          <Edit2 size={16} className="text-blue-600" />
        </button>
        <button
          onClick={() => handleDeleteClick(post)}
          className="p-1 hover:bg-gray-100 rounded"
          disabled={isDeleting}
        >
          <Trash2 size={16} className="text-red-600" />
        </button>
      </div>
    );
  };

  return (
    <div className="flex gap-4">
      {/* Main day view */}
      <div className="flex-1 border border-[#EAECF0] rounded-lg overflow-hidden">
        <div className="flex">
          {/* Time column */}
          <div className="w-20 border-r border-[#EAECF0]">
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

          {/* Day column */}
          <div className="flex-1">
            {HOURS.map((hour) => {
              const hourPosts = getPostsForHour(hour);
              return (
                <div
                  key={`day-${hour}`}
                  className="h-16 border-b border-[#EAECF0] p-2 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleHourClick(hour)}
                >
                  {hourPosts.length > 0 && (
                    <div className="space-y-1">
                      {hourPosts.map((post) => (
                        <div
                          key={post.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePostClick(post);
                          }}
                          className={`text-xs ${getStatusColor(
                            post.status
                          )} p-2 rounded cursor-pointer hover:opacity-80`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="font-semibold">{post.content}</div>
                            {renderPostActions(post)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {post.socialAccount.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right sidebar */}
      <div className="w-72 space-y-4">
        {/* Mini calendar */}
        <div className="border border-[#EAECF0] rounded-lg p-4 bg-white">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={prevMonth}
              className="p-1 rounded-md hover:bg-gray-100"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-sm font-medium">
              {viewDate.format("MMMM YYYY")}
            </div>
            <button
              onClick={nextMonth}
              className="p-1 rounded-md hover:bg-gray-100"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-xs mb-2">
            {["Mo", "Tu", "We", "Th", "Fr", "Sat", "Su"].map((day) => (
              <div key={day} className="text-gray-500 font-medium">
                {day}
              </div>
            ))}
          </div>

          {calendarWeeks.map((week, weekIndex) => (
            <div
              key={`week-${weekIndex}`}
              className="grid grid-cols-7 text-center"
            >
              {week.map((day) => (
                <div key={day.date.format("YYYY-MM-DD")} className="p-1">
                  <button
                    onClick={() => handleDayClick(day.date)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center relative
                      ${day.isToday ? "font-bold" : ""}
                      ${day.isSelected ? "bg-[#444CE7] text-white" : ""}
                      ${!day.isCurrentMonth ? "text-gray-400" : ""}
                      ${
                        !day.isSelected && day.isCurrentMonth
                          ? "hover:bg-gray-100"
                          : ""
                      }
                    `}
                  >
                    {day.date.date()}
                    {day.hasEvents && !day.isSelected && (
                      <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#444CE7] rounded-full"></span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Selected post details or default message */}
        {selectedPost ? (
          <div className="border border-[#EAECF0] rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-base font-semibold">
                  {selectedPost.socialAccount.type}
                </h3>
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
                  </Button>
                )}
                {selectedPost.status === "DRAFT" && onApprovePost && (
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => onApprovePost(selectedPost.id)}
                  >
                    <Check size={16} />
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => onEditPost(selectedPost.id)}
                >
                  <Edit2 size={16} />
                </Button>
              </div>
            </div>
            <div className="space-y-3">
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
                  <div className="flex gap-2 mt-1">
                    {Array(Math.min(3, selectedPost.mediaIds.length))
                      .fill(0)
                      .map((_, i) => (
                        <div
                          key={i}
                          className="w-16 h-16 bg-gray-100 rounded"
                        ></div>
                      ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 mt-2">
                {selectedPost.createdBy && (
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-[#EAECF0] rounded-lg p-4 bg-white">
            <div className="text-center py-6">
              <p className="text-gray-500">Select a post to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarDayView;
