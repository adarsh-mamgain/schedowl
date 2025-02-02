"use client";

import React, { useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/src/components/Button";

interface Post {
  id: number;
  title: string;
  time: string;
  content: string;
}

interface CalendarViewProps {
  setShowPostForm: (show: boolean) => void;
  setSelectedDateTime: (datetime: string) => void;
}

// Sample scheduled posts data
const SAMPLE_POSTS: Record<string, Post[]> = {
  "2025-02-01": [
    {
      id: 1,
      title: "Post Title 2025",
      time: "9:00 AM",
      content: "This is a sample post about business growth strategies",
    },
    {
      id: 2,
      title: "Post Title 2025",
      time: "11:00 AM",
      content: "Another interesting post about industry trends",
    },
  ],
  "2025-02-03": [
    {
      id: 3,
      title: "Post Title 2025",
      time: "9:00 AM",
      content: "Discussing the future of AI in business",
    },
    {
      id: 4,
      title: "Post Title 2025",
      time: "11:00 AM",
      content: "Tips for improving workplace productivity",
    },
  ],
  "2025-02-07": [
    {
      id: 5,
      title: "Post Title 2025",
      time: "9:00 AM",
      content: "Latest market analysis and insights",
    },
    {
      id: 6,
      title: "Post Title 2025",
      time: "11:00 AM",
      content: "Leadership strategies for the modern workplace",
    },
  ],
};

const CalendarView: React.FC<CalendarViewProps> = ({
  setShowPostForm,
  setSelectedDateTime,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(
    dayjs().startOf("month")
  );
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const daysInMonth = currentMonth.daysInMonth();
  const startDay = currentMonth.startOf("month").day();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Calculate previous month's days
  const prevMonth = currentMonth.subtract(1, "month");
  const daysInPrevMonth = prevMonth.daysInMonth();
  const prevMonthDays = Array.from(
    { length: startDay },
    (_, i) => daysInPrevMonth - startDay + i + 1
  );

  // Calculate next month's days
  const totalCells = 42; // 6 rows × 7 days
  const remainingDays = totalCells - (startDay + daysInMonth);
  const nextMonthDays = Array.from({ length: remainingDays }, (_, i) => i + 1);

  const goToPrevMonth = () => {
    setCurrentMonth((prev) => prev.subtract(1, "month"));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => prev.add(1, "month"));
  };

  const handleDateClick = (day: number, isCurrentMonth: boolean = true) => {
    if (!isCurrentMonth) return;
    const selectedDate = currentMonth.date(day).format("YYYY-MM-DDTHH:mm");
    setSelectedDateTime(selectedDate);
    setShowPostForm(true);
  };

  const handlePostClick = (e: React.MouseEvent, post: Post) => {
    e.stopPropagation();
    setSelectedPost(post);
  };

  const getPostsForDate = (day: number): Post[] => {
    const date = currentMonth.date(day).format("YYYY-MM-DD");
    return SAMPLE_POSTS[date] || [];
  };

  return (
    <div className="w-full h-full flex flex-col items-center">
      <div className="w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {currentMonth.format("MMMM YYYY")}
          </h2>
          <div className="flex gap-2">
            <Button variant="secondary" size="small" onClick={goToPrevMonth}>
              <ChevronLeft size={20} />
            </Button>
            <Button variant="secondary" size="small" onClick={goToNextMonth}>
              <ChevronRight size={20} />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 border border-[#EAECF0] rounded-lg">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-xs font-medium text-gray-600 p-2 border-b border-r border-[#EAECF0] last:border-r-0"
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
              className="h-32 bg-white p-2 hover:bg-gray-50 cursor-pointer border-b border-r border-[#EAECF0] last:border-r-0"
            >
              <div className="text-sm font-semibold mb-1">{day}</div>
              <div className="space-y-1">
                {getPostsForDate(day).map((post) => (
                  <div
                    key={post.id}
                    onClick={(e) => handlePostClick(e, post)}
                    className={`text-xs p-1 rounded cursor-pointer ${
                      post.time === "9:00 AM"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {post.title} {post.time}
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
      </div>

      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <h3 className="text-lg font-semibold mb-2">{selectedPost.title}</h3>
            <p className="text-gray-600 mb-4">{selectedPost.time}</p>
            <p className="mb-4">{selectedPost.content}</p>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setSelectedPost(null)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
