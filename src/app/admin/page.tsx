import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import { PostStatus, SubscriptionStatus } from "@prisma/client";

interface DailyStats {
  date: Date;
  count: number;
}

interface MrrResult {
  total_mrr: number;
}

interface ChurnRateResult {
  churned: number;
  total: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

interface Post {
  id: string;
  type: string;
  content: string;
  scheduledFor: Date;
  status: PostStatus;
  publishedAt: Date | null;
  errorMessage: string | null;
  metadata: any;
  jobId: string | null;
  retryCount: number;
  lastRetryAt: Date | null;
  socialAccountId: string;
  createdById: string;
  organisationId: string;
  organisation: {
    name: string;
  };
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (
    !session?.user?.email ||
    session.user.email !== "work.mamgain@gmail.com"
  ) {
    redirect("/");
  }

  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Fetch all necessary statistics
  const [
    totalUsers,
    totalOrganisations,
    totalPosts,
    publishedPosts,
    recentUsers,
    recentPosts,
    usersLast24Hours,
    postsLast24Hours,
    usersLast7Days,
    postsLast7Days,
    usersLast30Days,
    postsLast30Days,
    dailyUserStats,
    dailyPostStats,
    activeSubscriptions,
    // mrr,
    // churnRate,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.organisation.count(),
    prisma.post.count(),
    prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    }),
    prisma.post.findMany({
      orderBy: { scheduledFor: "desc" },
      take: 5,
      include: {
        organisation: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.user.count({
      where: { createdAt: { gte: last24Hours, lte: now } },
    }),
    prisma.post.count({
      where: { scheduledFor: { gte: last24Hours, lte: now } },
    }),
    prisma.user.count({
      where: { createdAt: { gte: last7Days, lte: now } },
    }),
    prisma.post.count({
      where: { scheduledFor: { gte: last7Days, lte: now } },
    }),
    prisma.user.count({
      where: { createdAt: { gte: last30Days, lte: now } },
    }),
    prisma.post.count({
      where: { scheduledFor: { gte: last30Days, lte: now } },
    }),
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(*) as count
      FROM "users"
      WHERE "createdAt" >= ${last30Days}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    `,
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "scheduledFor") as date,
        COUNT(*) as count
      FROM "posts"
      WHERE "scheduledFor" >= ${last30Days}
      GROUP BY DATE_TRUNC('day', "scheduledFor")
      ORDER BY date ASC
    `,
    prisma.subscription.count({
      where: { subscriptionStatus: SubscriptionStatus.ACTIVE },
    }),
    // prisma.$queryRaw<MrrResult[]>`
    //   SELECT SUM(amount) as total_mrr
    //   FROM "subscriptions"
    //   WHERE subscriptionStatus = 'ACTIVE'
    //   OR subscriptionStatus = 'RENEWED'
    // `,
    // prisma.$queryRaw<ChurnRateResult[]>`
    //   SELECT
    //     COUNT(*) FILTER (WHERE subscriptionStatus = 'CANCELLED' AND "updatedAt" >= ${last30Days}) as churned,
    //     COUNT(*) as total
    //   FROM "subscriptions"
    // `,
  ]);

  // Format data for charts
  const userGrowthData = (dailyUserStats as DailyStats[]).map((stat) => ({
    date: new Date(stat.date).toLocaleDateString(),
    count: Number(stat.count),
  }));

  const postGrowthData = (dailyPostStats as DailyStats[]).map((stat) => ({
    date: new Date(stat.date).toLocaleDateString(),
    count: Number(stat.count),
  }));

  // Calculate derived metrics
  //   const mrrValue = mrr[0]?.total_mrr || 0;
  // const churnRateValue = churnRate[0]?.churned / churnRate[0]?.total || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Admin Dashboard
        </h1>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Users</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {totalUsers}
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-500">
                Last 24h: {usersLast24Hours}
              </p>
              <p className="text-sm text-gray-500">Last 7d: {usersLast7Days}</p>
              <p className="text-sm text-gray-500">
                Last 30d: {usersLast30Days}
              </p>
            </div>
          </div>

          {/* Total Organisations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">
              Total Organisations
            </h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {totalOrganisations}
            </p>
          </div>

          {/* Total Posts */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Posts</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {totalPosts}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Published: {publishedPosts}
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-500">
                Last 24h: {postsLast24Hours}
              </p>
              <p className="text-sm text-gray-500">Last 7d: {postsLast7Days}</p>
              <p className="text-sm text-gray-500">
                Last 30d: {postsLast30Days}
              </p>
            </div>
          </div>

          {/* Active Subscriptions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">
              Active Subscriptions
            </h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {activeSubscriptions}
            </p>
            {/* <p className="text-sm text-gray-500 mt-2">
              MRR: ${mrrValue.toFixed(2)}
            </p> */}
            {/* <p className="text-sm text-gray-500">
              Churn Rate: {(churnRateValue * 100).toFixed(1)}%
            </p> */}
          </div>
        </div>

        {/* Growth Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Growth */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              User Growth
            </h3>
            <div className="h-64">
              <div className="flex items-end h-full space-x-2">
                {userGrowthData.map((data) => (
                  <div
                    key={data.date}
                    className="flex-1 bg-blue-500 rounded-t"
                    style={{
                      height: `${
                        (data.count /
                          Math.max(...userGrowthData.map((d) => d.count))) *
                        100
                      }%`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Post Growth */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Post Growth
            </h3>
            <div className="h-64">
              <div className="flex items-end h-full space-x-2">
                {postGrowthData.map((data) => (
                  <div
                    key={data.date}
                    className="flex-1 bg-green-500 rounded-t"
                    style={{
                      height: `${
                        (data.count /
                          Math.max(...postGrowthData.map((d) => d.count))) *
                        100
                      }%`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Recent Users
            </h3>
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatTimeAgo(user.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Posts */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Recent Posts
            </h3>
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {post.organisation.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {post.content.substring(0, 50)}...
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatTimeAgo(post.scheduledFor)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
