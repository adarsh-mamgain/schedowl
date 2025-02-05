"use client";

import { SocialPlatform } from "@/src/enums/social-platoform";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, FileText, Gift, Tablet, Monitor } from "lucide-react";
import Button from "@/src/components/Button";
import { toast } from "react-toastify";
import LexicalEditor from "@/src/components/LexicalEditor";

const TODOS = [
  {
    title: "Connect your LinkedIn account",
    description: "Connect your LinkedIn account to start using the app",
    icon: Link,
    done: true,
  },
  {
    title: "Publish your first post",
    description:
      "Use the magic of AI and your imagination to create and publish your first post.",
    icon: FileText,
    done: false,
  },
  {
    title: "Unlock your gift",
    description:
      "We have something special for you. complete the above steps and claim your special gift.",
    icon: Gift,
    done: false,
  },
];

export default function DashboardPage() {
  const [linkedInConnected, setLinkedInConnected] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);

  useEffect(() => {
    const checkLinkedInIntegration = async () => {
      try {
        const response = await axios.get(
          `/api/integrations?platform=${SocialPlatform.LINKEDIN}`
        );
        setLinkedInConnected(response.data.connected);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error("API error response:", error.response?.data);
          toast.error(error.response?.data?.error || "Signup failed.");
        } else {
          console.error("Unexpected error:", error);
          toast.error("An unexpected error occurred.");
        }
      }
    };
    checkLinkedInIntegration();
  }, []);

  const handleGetStarted = async () => {
    try {
      const response = await axios.get("/api/integrations/linkedin");
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Failed to connect LinkedIn:", error);
    }
  };

  // Add this function to your DashboardPage component
  // const postToLinkedIn = async (text: string) => {
  //   try {
  //     const response = await axios.post(
  //       "/api/integrations/linkedin/post",
  //       { text },
  //       {
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );

  //     if (response.status !== 200) throw new Error("Failed to post");
  //     // Handle success
  //   } catch (error) {
  //     // Handle error
  //     console.error("Error posting to LinkedIn:", error);
  //   }
  // };

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-semibold text-[#101828]">Your Dashboard</h1>
          <p className="text-sm text-[#475467]">
            Manage your team members and their account permissions here.
          </p>
        </div>
        <div>
          <Button size="small" onClick={() => setShowPostForm((prev) => !prev)}>
            Write Post
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-4 border border-[#EAECF0] rounded-[16px] p-6 text-sm mb-6">
        {TODOS.map((todo) => (
          <div key={todo.title} className="flex gap-3 items-center">
            <div className="w-10 h-10 flex items-center justify-center border border-[#EAECF0] rounded shadow">
              <todo.icon size={16} color={"#344054"} />
            </div>
            <div className="flex flex-col">
              <h2
                className={`font-semibold ${
                  todo.done ? "text-[#101828]" : "text-[#475467]"
                }`}
              >
                {todo.title}
              </h2>
              <p className="text-[#475467]">{todo.description}</p>
            </div>
          </div>
        ))}
        {!linkedInConnected && (
          <div>
            <Button variant="secondary" size="small" onClick={handleGetStarted}>
              Get Started
            </Button>
          </div>
        )}
      </div>
      {showPostForm && (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-7">
            <LexicalEditor />
          </div>

          <div className="col-span-5 border border-[#EAECF0] rounded-lg">
            <div className="flex justify-end p-1 border-b border-[#EAECF0]">
              <button className="p-2">
                <Tablet size={16} color="#475467" />
              </button>
              <button className="p-2">
                <Monitor size={16} color="#475467" />
              </button>
            </div>

            <div className="h-full flex justify-center items-center bg-[#FCFCFD]">
              <div className="w-96 h-96 bg-white shadow-[0px_2px_4px_-3px_#1018280D,0px_4px_8px_-2px_#1018280D] rounded-lg">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry. Lorem Ipsum has been the industry&apos;s standard
                dummy text ever since the 1500s, when an unknown printer took a
                galley of type and scrambled it
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
