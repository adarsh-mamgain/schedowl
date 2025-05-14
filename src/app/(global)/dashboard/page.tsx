"use client";

import { SocialPlatform } from "@/src/enums/social-platoform";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  LinkIcon,
  FileTextIcon,
  TrendingUpIcon,
  UsersIcon,
  MessageCircleIcon,
  HeartIcon,
  RepeatIcon,
  SearchIcon,
} from "lucide-react";
import Button from "@/src/components/Button";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
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
  message: string;
  data: LinkedInPost[];
  metadata?: {
    source: "cache" | "api";
    username?: string;
    isDefault?: boolean;
  };
}

const COLORS = {
  primary: "#444CE7",
  secondary: "#7F56D9",
  success: "#12B76A",
  warning: "#F79009",
  error: "#F04438",
  gray: "#475467",
  lightGray: "#EAECF0",
  darkGray: "#101828",
};

const CHART_COLORS = {
  line: "#444CE7",
  area: "rgba(68, 76, 231, 0.1)",
  bar: "#7F56D9",
  pie: ["#444CE7", "#7F56D9", "#12B76A", "#F79009", "#F04438"],
};

export default function DashboardPage() {
  const [linkedInConnected, setLinkedInConnected] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<LinkedInResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [searchUsername, setSearchUsername] = useState("");

  useEffect(() => {
    setMounted(true);
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

    const fetchDefaultAnalytics = async () => {
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

    checkLinkedInIntegration();
    fetchDefaultAnalytics();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/analytics/linkedin?username=${encodeURIComponent(searchUsername)}`
      );
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

  const handleGetStarted = async () => {
    try {
      const response = await axios.get("/api/integrations/linkedin");
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Failed to connect LinkedIn:", error);
    }
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#444CE7]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-[#F04438]">
        Error: {error}
      </div>
    );
  }

  if (!analyticsData?.data) return null;

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
      total:
        (post.likeCount || 0) +
        (post.commentsCount || 0) +
        (post.repostsCount || 0),
    }));

  const reactionDistribution = [
    { name: "Likes", value: totalLikes, icon: HeartIcon },
    { name: "Comments", value: totalComments, icon: MessageCircleIcon },
    { name: "Reposts", value: totalReposts, icon: RepeatIcon },
    {
      name: "Empathy",
      value: posts.reduce((sum, post) => sum + (post.empathyCount || 0), 0),
      icon: TrendingUpIcon,
    },
    {
      name: "Praise",
      value: posts.reduce((sum, post) => sum + (post.praiseCount || 0), 0),
      icon: UsersIcon,
    },
  ];

  const topPerformingPosts = posts
    .map((post) => ({
      text: post.text.slice(0, 50) + "...",
      engagement:
        (post.likeCount || 0) +
        (post.commentsCount || 0) +
        (post.repostsCount || 0),
      date: format(new Date(post.postedDate), "MMM d, yyyy"),
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
          {analyticsData?.metadata && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-[#475467]">
                Showing data for:{" "}
                <span className="font-medium text-[#101828]">
                  {analyticsData.metadata.username}
                </span>
              </span>
              <span className="px-2 py-1 text-xs rounded-full bg-[#F9F5FF] text-[#7F56D9]">
                {analyticsData.metadata.isDefault
                  ? "Default Data"
                  : "Live Data"}
              </span>
              {analyticsData.metadata.source === "cache" && (
                <span className="px-2 py-1 text-xs rounded-full bg-[#ECFDF3] text-[#12B76A]">
                  From Cache
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-[#475467]" />
            </div>
            <input
              type="text"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              placeholder="Search by LinkedIn username"
              className="block w-full pl-10 pr-3 py-2 border border-[#EAECF0] rounded-lg text-sm text-[#101828] placeholder-[#475467] focus:outline-none focus:ring-2 focus:ring-[#444CE7] focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#444CE7] text-white rounded-lg text-sm font-medium hover:bg-[#3730A3] focus:outline-none focus:ring-2 focus:ring-[#444CE7] focus:ring-offset-2"
          >
            Search
          </button>
        </div>
      </form>

      {!analyticsData?.success && (
        <div className="mb-6 p-4 border border-[#F04438] rounded-lg bg-[#FEF3F2]">
          <p className="text-sm text-[#F04438]">
            {analyticsData?.message || "Failed to load analytics data"}
          </p>
        </div>
      )}

      {!linkedInConnected && (
        <div className="flex flex-col gap-2 border border-[#EAECF0] rounded-[16px] p-4 text-sm mb-6">
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 flex items-center justify-center border border-[#EAECF0] rounded-full shadow">
              <LinkIcon size={16} color={"#444CE7"} />
            </div>
            <div className="flex flex-col">
              <h2 className="font-semibold text-[#101828]">
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
              <h2 className="font-semibold text-[#475467]">
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

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="rounded-xl border border-[#EAECF0] p-6 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F9F5FF]">
              <FileTextIcon size={20} color={COLORS.secondary} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#475467]">
                Total Posts
              </h3>
              <p className="text-2xl font-semibold text-[#101828]">
                {totalPosts}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[#EAECF0] p-6 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#ECFDF3]">
              <HeartIcon size={20} color={COLORS.success} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#475467]">
                Total Likes
              </h3>
              <p className="text-2xl font-semibold text-[#101828]">
                {totalLikes}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[#EAECF0] p-6 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FEF3F2]">
              <MessageCircleIcon size={20} color={COLORS.error} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#475467]">
                Total Comments
              </h3>
              <p className="text-2xl font-semibold text-[#101828]">
                {totalComments}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[#EAECF0] p-6 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FDF2FA]">
              <TrendingUpIcon size={20} color={COLORS.primary} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#475467]">
                Engagement Rate
              </h3>
              <p className="text-2xl font-semibold text-[#101828]">
                {engagementRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Over Time - Full Width */}
      <div className="rounded-xl border border-[#EAECF0] p-6 bg-white mb-8">
        <h2 className="text-sm font-medium text-[#475467] mb-4">
          Engagement Over Time
        </h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={engagementOverTime}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={CHART_COLORS.line}
                    stopOpacity={0.1}
                  />
                  <stop
                    offset="95%"
                    stopColor={CHART_COLORS.line}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.lightGray} />
              <XAxis dataKey="date" stroke={COLORS.gray} />
              <YAxis stroke={COLORS.gray} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: `1px solid ${COLORS.lightGray}`,
                  borderRadius: "8px",
                  boxShadow: "0px 4px 6px -2px rgba(16, 24, 40, 0.03)",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="total"
                stroke={CHART_COLORS.line}
                fillOpacity={1}
                fill="url(#colorTotal)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reaction Distribution and Top Companies - Split Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Reaction Distribution */}
        <div className="rounded-xl border border-[#EAECF0] p-6 bg-white">
          <h2 className="text-sm font-medium text-[#475467] mb-4">
            Reaction Distribution
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reactionDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill={CHART_COLORS.line}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {reactionDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS.pie[index % CHART_COLORS.pie.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: `1px solid ${COLORS.lightGray}`,
                    borderRadius: "8px",
                    boxShadow: "0px 4px 6px -2px rgba(16, 24, 40, 0.03)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Companies */}
        <div className="rounded-xl border border-[#EAECF0] p-6 bg-white">
          <h2 className="text-sm font-medium text-[#475467] mb-4">
            Top Mentioned Companies
          </h2>
          <div className="space-y-4">
            {topCompanies.length > 0 ? (
              topCompanies.map(([company, count], index) => (
                <div
                  key={company}
                  className="flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F9F5FF] text-[#7F56D9] font-medium">
                      {index + 1}
                    </div>
                    <span className="font-medium text-[#101828]">
                      {company}
                    </span>
                  </div>
                  <span className="text-[#475467]">{count} mentions</span>
                </div>
              ))
            ) : (
              <p className="text-[#475467]">No company mentions found</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Performing Posts - Full Width Table */}
      <div className="rounded-xl border border-[#EAECF0] bg-white mb-8">
        <div className="p-6 border-b border-[#EAECF0]">
          <h2 className="text-sm font-medium text-[#475467]">
            Top Performing Posts
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#EAECF0]">
                <th className="px-6 py-3 text-left text-xs font-medium text-[#475467] uppercase tracking-wider">
                  Post
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#475467] uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#475467] uppercase tracking-wider">
                  Engagement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#475467] uppercase tracking-wider">
                  Likes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#475467] uppercase tracking-wider">
                  Comments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#475467] uppercase tracking-wider">
                  Reposts
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0]">
              {topPerformingPosts.map((post, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#101828] max-w-md truncate">
                    {post.text}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475467]">
                    {post.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475467]">
                    {post.engagement}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475467]">
                    <div className="flex items-center gap-1">
                      <HeartIcon size={16} />
                      {post.engagement}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475467]">
                    <div className="flex items-center gap-1">
                      <MessageCircleIcon size={16} />
                      {post.engagement}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475467]">
                    <div className="flex items-center gap-1">
                      <RepeatIcon size={16} />
                      {post.engagement}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Posts - Full Width Table */}
      <div className="rounded-xl border border-[#EAECF0] bg-white">
        <div className="p-6 border-b border-[#EAECF0]">
          <h2 className="text-sm font-medium text-[#475467]">Recent Posts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#EAECF0]">
                <th className="px-6 py-3 text-left text-xs font-medium text-[#475467] uppercase tracking-wider">
                  Post
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#475467] uppercase tracking-wider">
                  Posted At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#475467] uppercase tracking-wider">
                  Likes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#475467] uppercase tracking-wider">
                  Comments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#475467] uppercase tracking-wider">
                  Reposts
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0]">
              {posts.slice(0, 5).map((post, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-[#101828] max-w-md truncate">
                    {post.text}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475467]">
                    {post.postedAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475467]">
                    <div className="flex items-center gap-1">
                      <HeartIcon size={16} />
                      {post.likeCount || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475467]">
                    <div className="flex items-center gap-1">
                      <MessageCircleIcon size={16} />
                      {post.commentsCount || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475467]">
                    <div className="flex items-center gap-1">
                      <RepeatIcon size={16} />
                      {post.repostsCount || 0}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
