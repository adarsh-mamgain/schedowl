"use client";

import axios from "axios";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const CalendarView = dynamic(() => import("@/src/components/CalendarView"), {
  ssr: false,
});

export default function CalendarPage() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const getPosts = async () => {
      try {
        const result = await axios.get("/api/posts");
        setPosts(result.data);
      } catch {
        toast.error("Error fetching posts");
      }
    };

    getPosts();
  }, []);

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-semibold text-[#101828]">Calendar</h1>
          <p className="text-sm text-[#475467]">
            Manage your content calendar from here.
          </p>
        </div>
        {/* <div>
          <Button size="small" onClick={() => setShowPostForm((prev) => !prev)}>
            Write Post
          </Button>
        </div> */}
      </div>
      <CalendarView
        setSelectedDateTime={(datetime) => {
          console.log("Selected DateTime:", datetime);
        }}
        posts={posts}
      />
    </section>
  );
}
