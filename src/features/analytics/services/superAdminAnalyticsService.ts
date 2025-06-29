import User from "../../../shared/models/User";
import { TrainingProgress } from "../../../shared/models/TrainingProgress";
import { EvaluationProgress } from "../../../shared/models/EvaluationProgress";
import { ChatSession } from "../../../shared/models/ChatSession";
import Activity from "../../../shared/models/Activity";
import { UserMetricActivityService } from "../../../shared/services/userMetricActivityService";
import { SystemLogService } from "../../../shared/services/systemLogService";
import { ClickUpService } from "../../../shared/services/clickupService";

// Constants for time windows
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export const getSuperAdminAnalytics = async () => {
  try {
    // Get user statistics
    const userStats = await getUserStats();

    // Get feature usage statistics
    const featureUsage =
      await UserMetricActivityService.getFeatureUsageStats("week");

    // Get system metrics
    const systemMetrics = await getSystemMetrics();

    // Get support ticket statistics
    const supportTickets = await getSupportTicketStats();

    // Get training statistics using TrainingProgress
    const trainingStats = await TrainingProgress.aggregate([
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          activeSessions: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: [{ $toLower: "$status" }, "in progress"] },
                    {
                      $and: [
                        { $eq: [{ $toLower: "$status" }, "not started"] },
                        {
                          $gt: [
                            "$assignedDate",
                            new Date(Date.now() - THIRTY_DAYS_MS),
                          ],
                        },
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          averageProgress: { $avg: "$progress" },
          averageTimeSpent: { $avg: "$timeSpent" },
        },
      },
    ]);

    // Get evaluation statistics using EvaluationProgress
    const evaluationStats = await EvaluationProgress.aggregate([
      {
        $group: {
          _id: null,
          totalEvaluations: { $sum: 1 },
          completedEvaluations: {
            $sum: {
              $cond: [{ $eq: [{ $toLower: "$status" }, "completed"] }, 1, 0],
            },
          },
          averageScore: { $avg: "$overallScore" },
          averageTimeSpent: { $avg: "$timeSpent" },
        },
      },
    ]);

    // Get chat session statistics
    const chatSessionStats = await ChatSession.aggregate([
      {
        $group: {
          _id: "$sessionType",
          activeSessions: {
            $sum: {
              $cond: [{ $eq: [{ $toLower: "$status" }, "active"] }, 1, 0],
            },
          },
          totalSessions: { $sum: 1 },
          averageDuration: {
            $avg: {
              $subtract: [{ $ifNull: ["$endTime", new Date()] }, "$startTime"],
            },
          },
        },
      },
    ]);

    // Get failed login attempts
    const failedLogins = await User.aggregate([
      {
        $match: {
          $or: [
            { failedLoginAttempts: { $gt: 0 } },
            { loginAttempts: { $gt: 0 } },
          ],
          lastLogin: { $gte: new Date(Date.now() - TWENTY_FOUR_HOURS_MS) },
        },
      },
      {
        $group: {
          _id: null,
          totalFailedAttempts: {
            $sum: { $add: ["$failedLoginAttempts", "$loginAttempts"] },
          },
          uniqueUsers: { $sum: 1 },
        },
      },
    ]);

    // Calculate total active chat sessions across all types
    const totalActiveChatSessions = chatSessionStats.reduce(
      (acc, curr) => acc + curr.activeSessions,
      0,
    );

    // Get the most active chat session type
    const mostActiveChatType = chatSessionStats.reduce(
      (max, curr) => (curr.activeSessions > max.activeSessions ? curr : max),
      { _id: "NONE", activeSessions: 0 },
    );

    return {
      userStats,
      featureUsage: {
        topFeatures: featureUsage.map((feature) => ({
          feature: feature.feature,
          usageCount: feature.totalUsage,
          uniqueUsers: feature.totalUniqueUsers,
          activities: feature.activities,
        })),
        averageSessionsPerUser:
          featureUsage.reduce((acc, curr) => acc + curr.totalUsage, 0) /
          ((await User.countDocuments()) || 1),
      },
      systemMetrics,
      supportTickets,
      trainingStats: trainingStats[0] ?? {
        totalSessions: 0,
        activeSessions: 0,
        averageProgress: 0,
        averageTimeSpent: 0,
      },
      evaluationStats: evaluationStats[0] ?? {
        totalEvaluations: 0,
        completedEvaluations: 0,
        averageScore: 0,
        averageTimeSpent: 0,
      },
      chatSessionStats: chatSessionStats.reduce(
        (acc, curr) => ({
          ...acc,
          [curr._id]: {
            active: curr.activeSessions,
            total: curr.totalSessions,
            averageDuration: curr.averageDuration,
          },
        }),
        {},
      ),
      failedLogins24h: failedLogins[0]?.totalFailedAttempts ?? 0,
      uniqueUsersFailedLogins24h: failedLogins[0]?.uniqueUsers ?? 0,
      systemStatus: {
        totalActiveChatSessions,
        mostActiveChatType: mostActiveChatType._id,
        mostActiveChatCount: mostActiveChatType.activeSessions,
        failedLogins24h: failedLogins[0]?.totalFailedAttempts ?? 0,
        uniqueUsersFailedLogins24h: failedLogins[0]?.uniqueUsers ?? 0,
      },
    };
  } catch (error) {
    console.error("Error in getSuperAdminAnalytics:", error);
    throw error;
  }
};

async function getUserStats() {
  const totalUsers = await User.countDocuments();

  // Get active users based on last login times
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  // Get active users for different time periods
  const activeUsers30Days = await User.countDocuments({
    lastLogin: { $gte: thirtyDaysAgo },
    isActive: true,
  });

  const activeUsers7Days = await User.countDocuments({
    lastLogin: { $gte: sevenDaysAgo },
    isActive: true,
  });

  const activeUsers24Hours = await User.countDocuments({
    lastLogin: { $gte: twentyFourHoursAgo },
    isActive: true,
  });

  // Get user growth metrics
  const newUsersLast24Hours = await User.countDocuments({
    createdAt: { $gte: twentyFourHoursAgo },
  });

  const newUsersLast7Days = await User.countDocuments({
    createdAt: { $gte: sevenDaysAgo },
  });

  // Get daily signups for the last 7 days
  const dailySignups = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: sevenDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  // Fill in missing days with zero counts
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split("T")[0];
  }).reverse();

  const dailySignupsMap = dailySignups.reduce(
    (acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    },
    {} as Record<string, number>,
  );

  const formattedDailySignups = last7Days.map((date) => ({
    date,
    count: dailySignupsMap[date] || 0,
  }));

  return {
    total: totalUsers,
    active: activeUsers30Days, // Main active users count (30 days)
    growth: {
      dailySignups: newUsersLast24Hours,
      weeklySignups: newUsersLast7Days,
      activeLast7Days: activeUsers7Days,
      activeLast24Hours: activeUsers24Hours,
      activeLast30Days: activeUsers30Days,
      dailySignupsData: formattedDailySignups,
    },
  };
}

async function getSystemMetrics() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get system metrics from SystemLogService
  const systemMetrics = await SystemLogService.getSystemMetrics(
    thirtyDaysAgo,
    new Date(),
  );

  return {
    uptime: {
      percentage: systemMetrics.uptime.percentage,
      lastChecked: systemMetrics.uptime.lastChecked,
    },
    errorLogs: {
      total: systemMetrics.errorLogs.total,
      byType: systemMetrics.errorLogs.byType,
    },
    crashCount: systemMetrics.crashCount,
  };
}

function groupErrorsByType(logs: any[]) {
  return logs.reduce((acc, log) => {
    acc[log.type] = (acc[log.type] || 0) + 1;
    return acc;
  }, {});
}

async function getSupportTicketStats() {
  try {
    const clickupService = new ClickUpService({
      apiKey: process.env.CLICKUP_API_KEY ?? "",
      listId: process.env.CLICKUP_LIST_ID ?? "",
    });

    const { stats, tasks } = await clickupService.getTaskDetails();

    // Update recent activity with feedback and issues
    const recentActivity = [
      ...tasks.slice(0, 5).map((item) => ({
        ...item,
      })),
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return {
      open: stats.open,
      closed: stats.closed,
      recentActivities: recentActivity,
    };
  } catch (error) {
    console.error("Error fetching support ticket stats:", error);
    return {
      stats: {
        open: 0,
        closed: 0,
        total: 0,
      },
      recentActivity: [],
    };
  }
}
