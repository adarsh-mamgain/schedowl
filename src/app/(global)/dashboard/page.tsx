"use client";

import { SocialPlatform } from "@/src/enums/social-platoform";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { LinkIcon, FileTextIcon } from "lucide-react";
import Button from "@/src/components/Button";
import AnalyticsLineChart from "@/src/components/AnalyticsLineChart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { format } from "date-fns";

interface LinkedInPost {
  text: string;
  totalReactionCount: number;
  likeCount: number;
  empathyCount: number;
  praiseCount: number;
  commentsCount: number;
  repostsCount: number;
  postedAt: string;
  postedDate: string;
  postedDateTimestamp: number;
  mentions: Array<{
    firstName: string;
    lastName: string;
  }>;
  companyMentions?: Array<{
    name: string;
  }>;
}

interface LinkedInResponse {
  success: boolean;
  data: LinkedInPost[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

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

  const [analyticsData, setAnalyticsData] = useState<LinkedInResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const response = await fetch("/api/analytics/linkedin");
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        const data = await response.json();
        setAnalyticsData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Don't render anything until client-side hydration is complete
  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        Error: {error}
      </div>
    );
  }

  if (!analyticsData?.data) {
    return null;
  }

  const posts = analyticsData.data;

  // Calculate analytics
  const totalPosts = posts.length;
  const totalLikes = posts.reduce(
    (sum, post) => sum + (post.likeCount || 0),
    0
  );
  const totalComments = posts.reduce(
    (sum, post) => sum + (post.commentsCount || 0),
    0
  );
  const totalReposts = posts.reduce(
    (sum, post) => sum + (post.repostsCount || 0),
    0
  );
  const totalReactions = posts.reduce(
    (sum, post) => sum + (post.totalReactionCount || 0),
    0
  );

  // Calculate engagement rate (reactions + comments) / total posts
  const engagementRate =
    totalPosts > 0
      ? ((totalReactions + totalComments) / totalPosts).toFixed(2)
      : "0.00";

  // Get most mentioned companies
  const companyMentions = posts
    .flatMap((post) => post.companyMentions || [])
    .filter((company) => company && company.name);

  const companyMentionCounts = companyMentions.reduce((acc, company) => {
    if (company && company.name) {
      acc[company.name] = (acc[company.name] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topCompanies = Object.entries(companyMentionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Prepare data for charts
  const engagementOverTime = posts
    .sort(
      (a, b) =>
        new Date(a.postedDate).getTime() - new Date(b.postedDate).getTime()
    )
    .map((post) => ({
      date: format(new Date(post.postedDate), "MMM d"),
      likes: post.likeCount || 0,
      comments: post.commentsCount || 0,
      reposts: post.repostsCount || 0,
    }));

  const reactionDistribution = [
    { name: "Likes", value: totalLikes },
    { name: "Comments", value: totalComments },
    { name: "Reposts", value: totalReposts },
    {
      name: "Empathy",
      value: posts.reduce((sum, post) => sum + (post.empathyCount || 0), 0),
    },
    {
      name: "Praise",
      value: posts.reduce((sum, post) => sum + (post.praiseCount || 0), 0),
    },
  ];

  const topPerformingPosts = posts
    .map((post) => ({
      text: post.text.slice(0, 50) + "...",
      engagement:
        (post.likeCount || 0) +
        (post.commentsCount || 0) +
        (post.repostsCount || 0),
    }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 5);

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-semibold text-[#101828]">Your Dashboard</h1>
          <p className="text-sm text-[#475467]">
            Track your top-performing content and optimize your social strategy
          </p>
        </div>
      </div>

      {!linkedInConnected && (
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
      )}

      <div className="space-y-6">
        <div className="rounded-2xl border p-6">
          <h3 className="text-sm font-medium text-[#475467] mb-1">
            Followers Growth
          </h3>
          <AnalyticsLineChart />
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="text-sm font-medium text-[#475467] mb-1">
            Reactions Growth
          </h3>
          <AnalyticsLineChart />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Total Posts</h3>
          <p className="text-3xl font-bold">{totalPosts}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Total Likes</h3>
          <p className="text-3xl font-bold">{totalLikes}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Total Comments</h3>
          <p className="text-3xl font-bold">{totalComments}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Engagement Rate</h3>
          <p className="text-3xl font-bold">{engagementRate}%</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Engagement Over Time */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Engagement Over Time</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={engagementOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="likes" stroke="#8884d8" />
                <Line type="monotone" dataKey="comments" stroke="#82ca9d" />
                <Line type="monotone" dataKey="reposts" stroke="#ffc658" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reaction Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Reaction Distribution</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reactionDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {reactionDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Companies and Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Companies */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Top Mentioned Companies
          </h2>
          <div className="space-y-4">
            {topCompanies.length > 0 ? (
              topCompanies.map(([company, count]) => (
                <div
                  key={company}
                  className="flex justify-between items-center"
                >
                  <span className="font-medium">{company}</span>
                  <span className="text-gray-500">{count} mentions</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No company mentions found</p>
            )}
          </div>
        </div>

        {/* Top Performing Posts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Top Performing Posts</h2>
          <div className="space-y-4">
            {topPerformingPosts.map((post, index) => (
              <div key={index} className="border-b pb-4 last:border-b-0">
                <p className="text-sm mb-2">{post.text}</p>
                <p className="text-gray-500 text-sm">
                  Engagement: {post.engagement}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Posts */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Posts</h2>
        <div className="space-y-6">
          {posts.slice(0, 5).map((post, index) => (
            <div key={index} className="border-b pb-4 last:border-b-0">
              <p className="text-gray-500 text-sm mb-2">{post.postedAt}</p>
              <p className="mb-4 line-clamp-3">{post.text}</p>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>❤️ {post.likeCount || 0} likes</span>
                <span>💬 {post.commentsCount || 0} comments</span>
                <span>🔄 {post.repostsCount || 0} reposts</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
