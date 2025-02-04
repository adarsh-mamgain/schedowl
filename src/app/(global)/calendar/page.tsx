"use client";

import Button from "@/src/components/Button";
import PostForm from "@/src/components/PostForm";
import dynamic from "next/dynamic";
import { useState } from "react";

const CalendarView = dynamic(() => import("@/src/components/CalendarView"), {
  ssr: false,
});

export default function CalendarPage() {
  const [showPostForm, setShowPostForm] = useState(false);
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
          <Button size="small" onClick={() => setShowPostForm((prev) => !prev)}>
            Write Post
          </Button>
        </div>
      </div>
      <CalendarView
      // setShowPostForm={false}
      // setSelectedDateTime={() => {
      //   new Date(datetime);
      // }}
      />
      {showPostForm && <PostForm setShowPostForm={setShowPostForm} />}
    </section>
  );
}
