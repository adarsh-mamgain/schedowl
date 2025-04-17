"use client";

import { SocialPlatform } from "@/src/enums/social-platoform";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { LinkIcon, FileTextIcon } from "lucide-react";
import Button from "@/src/components/Button";
import { toast } from "react-toastify";
// import LinkedInAnalytics from "@/src/components/LinkedInAnalytics";

export default function DashboardPage() {
  const [linkedInConnected, setLinkedInConnected] = useState(false);

  useEffect(() => {
    const checkLinkedInIntegration = async () => {
      try {
        const response = await axios.get(
          `/api/integrations?platform=${SocialPlatform.LINKEDIN}`
        );
        setLinkedInConnected(response.data.connected);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error(
            error.response?.data?.error || "Failed to fetch integration"
          );
        } else {
          console.error("An unexpected error occurred.");
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

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-semibold text-[#101828]">Your Dashboard</h1>
          <p className="text-sm text-[#475467]">
            Schedule posts, view analytics and see account overview.
          </p>
        </div>
      </div>

      {!linkedInConnected ? (
        <div className="flex flex-col gap-2 border border-[#EAECF0] rounded-[16px] p-4 text-sm mb-6">
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 flex items-center justify-center border border-[#EAECF0] rounded-full shadow">
              <LinkIcon size={16} color={"#444CE7"} />
            </div>
            <div className="flex flex-col">
              <h2
                className={`font-semibold ${
                  true ? "text-[#101828]" : "text-[#475467]"
                }`}
              >
                Connect your LinkedIn account
              </h2>
              <p className="text-[#475467]">
                Connect your LinkedIn account to start using the app
              </p>
            </div>
          </div>
          <div className="w-0.5 h-4 bg-[#ECECED] top-10 ml-5"></div>
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 flex items-center justify-center border border-[#EAECF0] rounded-full shadow">
              <FileTextIcon size={16} color={"#444CE7"} />
            </div>
            <div className="flex flex-col">
              <h2
                className={`font-semibold ${
                  false ? "text-[#101828]" : "text-[#475467]"
                }`}
              >
                Publish your first post
              </h2>
              <p className="text-[#475467]">
                Create and publish with AI and imagination.
              </p>
            </div>
          </div>

          <div className="mt-2">
            <Button variant="secondary" size="small" onClick={handleGetStarted}>
              Get Started
            </Button>
          </div>
        </div>
      ) : (
        // <LinkedInAnalytics />
        <div>LinkedInAnalytics</div>
      )}
    </section>
  );
}
