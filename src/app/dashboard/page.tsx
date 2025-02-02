"use client";

import { IntegrationType } from "@/src/enums/integrations";
import axios from "axios";
import React from "react";
import { useEffect, useState } from "react";
import PostForm from "@/src/app/components/PostForm";
import { Link, FileText, Gift, ChevronDown, ChevronUp } from "lucide-react";
import Button from "@/src/app/components/Button";
import { authClient } from "@/src/lib/auth-client";
import { useRouter } from "next/navigation";

const TODOS = [
  {
    title: "Connect your LinkedIn account",
    description: "Connect your LinkedIn account to start using the app",
    icon: "Link",
    done: true,
  },
  {
    title: "Publish your first post",
    description:
      "Use the magic of AI and your imagination to create and publish your first post.",
    icon: "FileText",
    done: false,
  },
  {
    title: "Unlock your gift",
    description:
      "We have something special for you. complete the above steps and claim your special gift.",
    icon: "Gift",
    done: false,
  },
];

export default function DashboardPage() {
  const router = useRouter(); // ✅ Get the router instance
  const { data: session } = authClient.useSession();
  const [linkedInConnected, setLinkedInConnected] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);

  useEffect(() => {
    const checkLinkedInIntegration = async () => {
      if (session?.user) {
        try {
          const response = await axios.get(
            `/api/integrations?organisationId=${session.user.id}&provider=${IntegrationType.LINKEDIN}`
          );
          setLinkedInConnected(response.data.connected);
        } catch {
          console.error("Failed to check LinkedIn integration");
        }
      }
    };
    checkLinkedInIntegration();
  }, [session]);

  const handleGetStarted = async () => {
    try {
      const response = await axios.get("/api/integrations/linkedin");
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Failed to connect LinkedIn:", error);
    }
  };

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const signOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/signin"); // redirect to login page
        },
      },
    });
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

  return !session ? (
    <div className="w-screen h-screen flex flex-col items-center justify-center">
      <div className="border-t-4 border-[#1570EF] rounded-full w-16 h-16 animate-spin mb-3"></div>
      <div className="text-[#101828]">Redirecting...</div>
    </div>
  ) : (
    <div className="w-screen h-screen grid grid-cols-12">
      <aside className="h-full col-span-2 border-r border-[#EAECF0] p-4">
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="w-full flex items-center justify-between"
          >
            <span>Company</span>
            {dropdownOpen ? (
              <ChevronUp color="#344054" />
            ) : (
              <ChevronDown color="#344054" />
            )}
          </button>
          {dropdownOpen && (
            <div className="w-full flex flex-col p-2 rounded-lg shadow-[0px_1px_2px_0px_#1018280D,0px_-2px_0px_0px_#1018280D_inset,0px_0px_0px_1px_#1018282E_inset] absolute mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg">
              <Button variant="secondary" size="small" onClick={signOut}>
                Sign out
              </Button>
            </div>
          )}
        </div>
      </aside>

      <main className="col-span-10 h-full p-6">
        <section className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-semibold text-[#101828]">Your Dashboard</h1>
            <p className="text-sm text-[#475467]">
              Manage your team members and their account permissions here.
            </p>
          </div>
          <div>
            <Button
              size="small"
              onClick={() => setShowPostForm((prev) => !prev)}
            >
              Write Post
            </Button>
            {showPostForm && <PostForm setShowPostForm={setShowPostForm} />}
          </div>
        </section>
        <section className="flex flex-col gap-4 border border-[#EAECF0] rounded-[16px] p-6 text-sm mb-6">
          {TODOS.map((todo) => (
            <div key={todo.title} className="flex gap-3 items-center">
              <div className="w-10 h-10 flex items-center justify-center border border-[#EAECF0] rounded shadow-[0px_1px_2px_0px_#1018280D]">
                {React.createElement(
                  todo.icon === "Link"
                    ? Link
                    : todo.icon === "FileText"
                    ? FileText
                    : Gift,
                  { size: 16, color: "#344054" }
                )}
              </div>
              {/* {index < TODOS.length - 1 && (
                <div className="h-2 border-l-2 border-[#EAECF0] ml-5 mt-2"></div>
              )} */}
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
              <Button
                variant="secondary"
                size="small"
                onClick={handleGetStarted}
              >
                Get Started
              </Button>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4 border border-[#EAECF0] rounded-[16px] p-6 text-sm"></section>
      </main>
    </div>
  );
}
