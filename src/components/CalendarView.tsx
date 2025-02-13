"use client";

import React, { useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/src/components/Button";

interface Post {
  id: string;
  type: string;
  content: string;
  scheduledFor: string;
  status: string;
  createdById: string;
}

interface CalendarViewProps {
  setSelectedDateTime: (datetime: string) => void;
  posts: Post[];
}

const CalendarView: React.FC<CalendarViewProps> = ({
  setSelectedDateTime,
  posts,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(
    dayjs().startOf("month")
  );
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const daysInMonth = currentMonth.daysInMonth();
  const startDay = currentMonth.startOf("month").day();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Calculate previous and next month's days
  const prevMonthDays = Array.from(
    { length: startDay },
    (_, i) => dayjs().subtract(1, "month").daysInMonth() - startDay + i + 1
  );

  // Calculate next month's days
  const totalCells = 42; // 6 rows × 7 days
  const remainingDays = totalCells - (startDay + daysInMonth);
  const nextMonthDays = Array.from({ length: remainingDays }, (_, i) => i + 1);

  const goToPrevMonth = () =>
    setCurrentMonth((prev) => prev.subtract(1, "month"));
  const goToNextMonth = () => setCurrentMonth((prev) => prev.add(1, "month"));

  const handleDateClick = (day: number, isCurrentMonth: boolean = true) => {
    if (!isCurrentMonth) return;
    const selectedDate = currentMonth.date(day).format("YYYY-MM-DDTHH:mm");
    setSelectedDateTime(selectedDate);
  };

  const handlePostClick = (e: React.MouseEvent, post: Post) => {
    e.stopPropagation();
    setSelectedPost(post);
  };

  const getPostsForDate = (day: number): Post[] => {
    const date = currentMonth.date(day).format("YYYY-MM-DD");
    return posts.filter(
      (post) => dayjs(post.scheduledFor).format("YYYY-MM-DD") === date
    );
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
                    className="text-xs bg-blue-100 text-blue-700 p-1 rounded"
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
      </div>

      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-md">
            <h3 className="text-lg font-semibold mb-2">{selectedPost.type}</h3>
            <p className="text-gray-600 mb-4">{selectedPost.scheduledFor}</p>
            <p className="mb-4">{selectedPost.content}</p>
            <p className="mb-4">
              <span className="border border-[#D0D5DD] text-xs font-medium px-1.5 py-0.5 rounded-md shadow-[0px_1px_2px_0px_#1018280D]">
                {selectedPost.status}
              </span>
            </p>
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
