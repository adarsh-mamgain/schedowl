import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import { PostStatus, SubscriptionStatus } from "@prisma/client";

interface DailyStats {
  date: Date;
  count: number;
}

interface ChurnRateResult {
  churned: number;
  total: number;
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

  try {
    // Fetch all data in a single query
    const [
      totalStats,
      recentUsers,
      recentPosts,
      growthData,
      subscriptionData,
      timeStats,
    ] = await Promise.all([
      // Total counts
      prisma.$transaction([
        prisma.user.count(),
        prisma.organisation.count(),
        prisma.post.count(),
        prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
      ]),
      // Recent users
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
      // Recent posts
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
      // Growth data
      prisma.$transaction([
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
      ]),
      // Subscription data
      prisma.$transaction([
        prisma.subscription.count({
          where: { subscriptionStatus: SubscriptionStatus.ACTIVE },
        }),
        prisma.$queryRaw<ChurnRateResult[]>`
          SELECT
            COUNT(*) FILTER (WHERE status = 'CANCELLED' AND "updatedAt" >= ${last30Days}) as churned,
            COUNT(*) as total
          FROM "payments"
        `,
      ]),
      // Time-based stats
      prisma.$transaction([
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
      ]),
    ]);

    // Format data for charts
    const userGrowthData = (growthData[0] as DailyStats[]).map((stat) => ({
      date: new Date(stat.date).toLocaleDateString(),
      count: Number(stat.count),
    }));

    const postGrowthData = (growthData[1] as DailyStats[]).map((stat) => ({
      date: new Date(stat.date).toLocaleDateString(),
      count: Number(stat.count),
    }));

    // Calculate derived metrics
    const churnRateValue =
      subscriptionData[1][0]?.total > 0
        ? Number(subscriptionData[1][0]?.churned || 0) /
          Number(subscriptionData[1][0]?.total)
        : 0;

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
                {totalStats[0] || 0}
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-500">
                  Last 24h: {timeStats[0] || 0}
                </p>
                <p className="text-sm text-gray-500">
                  Last 7d: {timeStats[2] || 0}
                </p>
                <p className="text-sm text-gray-500">
                  Last 30d: {timeStats[4] || 0}
                </p>
              </div>
            </div>

            {/* Total Organisations */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">
                Total Organisations
              </h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalStats[1] || 0}
              </p>
            </div>

            {/* Total Posts */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Total Posts</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalStats[2] || 0}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Published: {totalStats[3] || 0}
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-500">
                  Last 24h: {timeStats[1] || 0}
                </p>
                <p className="text-sm text-gray-500">
                  Last 7d: {timeStats[3] || 0}
                </p>
                <p className="text-sm text-gray-500">
                  Last 30d: {timeStats[5] || 0}
                </p>
              </div>
            </div>

            {/* Active Subscriptions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">
                Active Subscriptions
              </h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {subscriptionData[0] || 0}
              </p>
              <p className="text-sm text-gray-500">
                Churn Rate: {(churnRateValue * 100).toFixed(1)}%
              </p>
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
                  {userGrowthData.length > 0 ? (
                    userGrowthData.map((data) => (
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
                    ))
                  ) : (
                    <div className="w-full text-center text-gray-500">
                      No data available
                    </div>
                  )}
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
                  {postGrowthData.length > 0 ? (
                    postGrowthData.map((data) => (
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
                    ))
                  ) : (
                    <div className="w-full text-center text-gray-500">
                      No data available
                    </div>
                  )}
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
                {recentUsers.length > 0 ? (
                  recentUsers.map((user) => (
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
                  ))
                ) : (
                  <div className="text-center text-gray-500">
                    No recent users
                  </div>
                )}
              </div>
            </div>

            {/* Recent Posts */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Recent Posts
              </h3>
              <div className="space-y-4">
                {recentPosts.length > 0 ? (
                  recentPosts.map((post) => (
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
                  ))
                ) : (
                  <div className="text-center text-gray-500">
                    No recent posts
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Admin Dashboard
          </h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Error Loading Dashboard
            </h2>
            <p className="text-red-600">
              There was an error loading the dashboard data. Please try again
              later.
            </p>
          </div>
        </div>
      </div>
    );
  }
}
