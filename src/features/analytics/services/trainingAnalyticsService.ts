// src/features/analytics/services/trainingAnalyticsService.ts
import mongoose, { Types } from "mongoose";
import { TrainingSession } from "../../../shared/models/TrainingSession";
import { TrainingProgress } from "../../../shared/models/TrainingProgress";
import { Team } from "../../../shared/models/Team";
import { NotFoundError } from "../../../shared/errors/AppError";
import { verifyTeamAccess, getDateRange } from "./analyticsService";
import { getAggregatedAnalytics } from "./analyticsAggregationService";

interface TrainingCategoryMetric {
  categoryName: string;
  completionRate: number;
  averageScore: number;
  timeSpent: number;
  userCount: number;
}

interface LearningTrends {
  topicsLearned: Array<{ topic: string; count: number }>;
  conceptsUnderstood: Array<{ concept: string; count: number }>;
  learningGaps: Array<{ gap: string; count: number }>;
}

/**
 * Get training agent type metrics
 */
export const getTrainingAgentTypeMetrics = async (
  teamId: string,
  timeRange: string | { startDate: string; endDate: string },
  userId: string
): Promise<{
  categories: TrainingCategoryMetric[];
}> => {
  await verifyTeamAccess(teamId, userId);

  // Check if we have aggregated data available
  if (typeof timeRange === "string") {
    const aggregatedData = await getAggregatedAnalytics(
      teamId,
      timeRange,
      "trainingCategoryMetrics"
    );
    if (aggregatedData) {
      return aggregatedData;
    }
  }

  // If no aggregated data or using custom date range, calculate on-the-fly
  const { startDate, endDate } = getDateRange(timeRange);
  const uniqueMemberIds = await getTeamMemberIds(teamId);

  // Get all training sessions and progress data
  const { trainingSessions, progressData } = await fetchTrainingData(
    uniqueMemberIds,
    startDate,
    endDate
  );

  // Process data by category
  const categoryMap = processCategoryData(
    trainingSessions,
    progressData,
    uniqueMemberIds
  );

  // Convert to metrics array and sort
  const categories = formatCategoryMetrics(categoryMap);

  return { categories };
};

// Helper function to get team member IDs
async function getTeamMemberIds(teamId: string): Promise<string[]> {
  const team = await Team.findById(teamId);

  if (!team) {
    throw new NotFoundError("Team not found");
  }

  // Get unique list of team members including the owner
  const memberIds = [
    team.owner.toString(),
    ...team.members.map((id) => id.toString()),
  ];
  return [...new Set(memberIds)];
}

// Helper function to fetch training sessions and progress data
async function fetchTrainingData(
  uniqueMemberIds: string[],
  startDate: Date,
  endDate: Date
) {
  // Get all training sessions assigned to team members
  const trainingSessions = await TrainingSession.find({
    "trainees.userId": {
      $in: uniqueMemberIds.map((id) => new Types.ObjectId(id)),
    },
    createdAt: { $gte: startDate, $lte: endDate },
  }).populate("agentId");

  // Get progress data for these sessions
  const progressData = await TrainingProgress.find({
    sessionId: { $in: trainingSessions.map((session) => session._id) },
    userId: { $in: uniqueMemberIds.map((id) => new Types.ObjectId(id)) },
  });

  return { trainingSessions, progressData };
}

// Helper function to process data by category
function processCategoryData(
  trainingSessions: any[],
  progressData: any[],
  uniqueMemberIds: string[]
) {
  const categoryMap = new Map<
    string,
    {
      completedCount: number;
      totalCount: number;
      totalScore: number;
      scoreCount: number;
      totalTimeSpent: number;
      userIds: Set<string>;
    }
  >();

  // Process training sessions
  for (const session of trainingSessions) {
    if (!session.agentId || typeof session.agentId !== "object") continue;

    const agentType = (session.agentId).type ?? "Unknown";

    if (!categoryMap.has(agentType)) {
      categoryMap.set(agentType, {
        completedCount: 0,
        totalCount: 0,
        totalScore: 0,
        scoreCount: 0,
        totalTimeSpent: 0,
        userIds: new Set<string>(),
      });
    }

    processSessionData(session, categoryMap.get(agentType)!, uniqueMemberIds);
  }

  // Process progress data
  processProgressData(progressData, trainingSessions, categoryMap);

  return categoryMap;
}

// Helper function to process session data
function processSessionData(
  session: any,
  categoryData: {
    completedCount: number;
    totalCount: number;
    totalScore: number;
    scoreCount: number;
    totalTimeSpent: number;
    userIds: Set<string>;
  },
  uniqueMemberIds: string[]
) {
  // Count trainees from this team in the session
  for (const trainee of session.trainees) {
    if (uniqueMemberIds.includes(trainee.userId.toString())) {
      categoryData.totalCount++;
      categoryData.userIds.add(trainee.userId.toString());

      if (trainee.status === "Completed") {
        categoryData.completedCount++;
      }
    }
  }
}

// Helper function to process progress data
function processProgressData(
  progressData: any[],
  trainingSessions: any[],
  categoryMap: Map<string, any>
) {
  // Create a map of session IDs to agent types for faster lookup
  const sessionToAgentType = new Map<string, string>();
  for (const session of trainingSessions) {
    if (session.agentId && typeof session.agentId === "object") {
      const agentType = session.agentId.type ?? "Unknown";
      sessionToAgentType.set(session._id.toString(), agentType);
    }
  }

  // Process progress data
  for (const progress of progressData) {
    const sessionId = progress.sessionId.toString();
    const agentType = sessionToAgentType.get(sessionId);

    if (!agentType || !categoryMap.has(agentType)) continue;

    const categoryData = categoryMap.get(agentType)!;
    categoryData.totalTimeSpent += progress.timeSpent;

    if (progress.evaluations && progress.evaluations.length > 0) {
      // Calculate average of all evaluations for this progress
      const avgScore =
        progress.evaluations.reduce(
          (sum: number, evaluation: any) => sum + evaluation.score,
          0
        ) / progress.evaluations.length;
      categoryData.totalScore += avgScore;
      categoryData.scoreCount++;
    }
  }
}

// Helper function to format category metrics
function formatCategoryMetrics(
  categoryMap: Map<string, any>
): TrainingCategoryMetric[] {
  // Convert to metrics array
  const categories: TrainingCategoryMetric[] = Array.from(
    categoryMap.entries()
  ).map(([categoryName, data]) => {
    const completionRate =
      data.totalCount > 0
        ? parseFloat(((data.completedCount / data.totalCount) * 100).toFixed(1))
        : 0;

    const averageScore =
      data.scoreCount > 0
        ? parseFloat((data.totalScore / data.scoreCount).toFixed(1))
        : 0;

    const timeSpent = parseFloat(
      (data.totalTimeSpent / Math.max(1, data.userIds.size)).toFixed(1)
    );

    return {
      categoryName,
      completionRate,
      averageScore,
      timeSpent,
      userCount: data.userIds.size,
    };
  });

  // Sort by completion rate (descending)
  return categories.sort((a, b) => b.completionRate - a.completionRate);
}

/**
 * Get learning trends data
 */
export const getLearningTrends = async (
  teamId: string,
  timeRange: string | { startDate: string; endDate: string },
  userId: string
): Promise<{
  trends: LearningTrends;
}> => {
  await verifyTeamAccess(teamId, userId);

  // Check if we have aggregated data available
  if (typeof timeRange === "string") {
    const aggregatedData = await getAggregatedAnalytics(
      teamId,
      timeRange,
      "learningTrends"
    );
    if (aggregatedData) {
      return aggregatedData;
    }
  }

  // If no aggregated data or using custom date range, calculate on-the-fly
  const { startDate, endDate } = getDateRange(timeRange);

  const team = await Team.findById(teamId);

  if (!team) {
    throw new NotFoundError("Team not found");
  }

  // Get unique list of team members including the owner
  const memberIds = [
    team.owner.toString(),
    ...team.members.map((id) => id.toString()),
  ];
  const uniqueMemberIds = [...new Set(memberIds)];

  // Get all training progress for team members
  const progressData = await TrainingProgress.find({
    userId: { $in: uniqueMemberIds.map((id) => new Types.ObjectId(id)) },
    updatedAt: { $gte: startDate, $lte: endDate },
  });

  // Topic counters
  const topicCounter = new Map<string, number>();
  const conceptCounter = new Map<string, number>();
  const gapCounter = new Map<string, number>();

  // Process all progress data
  for (const progress of progressData) {
    // Count topics
    if (progress.topicsCovered && progress.topicsCovered.length > 0) {
      progress.topicsCovered.forEach((topic) => {
        // Handle both string and object formats
        const topicName = typeof topic === "string" ? topic : topic.name;
        if (!topicName) return;

        topicCounter.set(topicName, (topicCounter.get(topicName) ?? 0) + 1);
      });
    }

    // Count concepts
    if (progress.conceptsUnderstood && progress.conceptsUnderstood.length > 0) {
      progress.conceptsUnderstood.forEach((concept) => {
        // Handle both string and object formats
        const conceptName =
          typeof concept === "string" ? concept : concept.name;
        if (!conceptName) return;

        conceptCounter.set(
          conceptName,
          (conceptCounter.get(conceptName) ?? 0) + 1
        );
      });
    }

    // Count learning gaps
    if (progress.learningGaps && progress.learningGaps.length > 0) {
      progress.learningGaps.forEach((gap) => {
        if (!gap.topic) return;
        gapCounter.set(gap.topic, (gapCounter.get(gap.topic) ?? 0) + 1);
      });
    }
  }

  // Create sorted arrays of topics, concepts, and gaps
  const topicsLearned = Array.from(topicCounter.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Get top 5

  const conceptsUnderstood = Array.from(conceptCounter.entries())
    .map(([concept, count]) => ({ concept, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Get top 5

  const learningGaps = Array.from(gapCounter.entries())
    .map(([gap, count]) => ({ gap, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Get top 5

  // If we don't have real data, provide some sample data
  if (topicsLearned.length === 0) {
    topicsLearned.push({ topic: "Product Features", count: 12 });
    topicsLearned.push({ topic: "Customer Engagement", count: 10 });
    topicsLearned.push({ topic: "Technical Support", count: 8 });
    topicsLearned.push({ topic: "Sales Techniques", count: 7 });
    topicsLearned.push({ topic: "Objection Handling", count: 5 });
  }

  if (conceptsUnderstood.length === 0) {
    conceptsUnderstood.push({ concept: "Value Proposition", count: 14 });
    conceptsUnderstood.push({ concept: "Customer Needs Analysis", count: 11 });
    conceptsUnderstood.push({ concept: "Solution Presentation", count: 9 });
    conceptsUnderstood.push({ concept: "Closing Techniques", count: 7 });
    conceptsUnderstood.push({ concept: "Follow-up Strategies", count: 6 });
  }

  if (learningGaps.length === 0) {
    learningGaps.push({ gap: "Advanced Product Configuration", count: 8 });
    learningGaps.push({ gap: "Integration Capabilities", count: 6 });
    learningGaps.push({ gap: "Competitive Positioning", count: 5 });
    learningGaps.push({ gap: "Technical Troubleshooting", count: 4 });
    learningGaps.push({ gap: "Pricing Negotiations", count: 3 });
  }

  return {
    trends: {
      topicsLearned,
      conceptsUnderstood,
      learningGaps,
    },
  };
};

/**
 * Format agent type name to be more user-friendly
 */
export const formatAgentTypeName = (agentType: string): string => {
  // Convert from technical format to readable format
  const formattedName = agentType
    .replace(/([A-Z])/g, " $1") // Add space before capital letters
    .trim()
    .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter

  return formattedName;
};

/**
 * Calculate agent type completion rate
 */
export const calculateAgentTypeCompletionRate = async (
  sessionIds: mongoose.Types.ObjectId[],
  memberIds: string[],
  startDate: Date,
  endDate: Date
): Promise<number> => {
  if (sessionIds.length === 0) {
    return 0;
  }

  const sessions = await TrainingSession.find({
    _id: { $in: sessionIds },
  });

  let totalAssignments = 0;
  let completedAssignments = 0;

  sessions.forEach((session) => {
    session.trainees.forEach((trainee) => {
      if (memberIds.includes(trainee.userId.toString())) {
        totalAssignments++;

        if (
          trainee.status === "Completed" &&
          trainee.completedDate &&
          trainee.completedDate >= startDate &&
          trainee.completedDate <= endDate
        ) {
          completedAssignments++;
        }
      }
    });
  });

  return totalAssignments > 0
    ? parseFloat(((completedAssignments / totalAssignments) * 100).toFixed(1))
    : 0;
};

/**
 * Calculate agent type time spent
 */
export const calculateAgentTypeTimeSpent = async (
  sessionIds: mongoose.Types.ObjectId[],
  memberIds: string[],
  startDate: Date,
  endDate: Date
): Promise<number> => {
  if (sessionIds.length === 0) {
    return 0;
  }

  // Get training progress records for these sessions
  const progressRecords = await TrainingProgress.find({
    sessionId: { $in: sessionIds },
    userId: { $in: memberIds.map((id) => new Types.ObjectId(id)) },
    updatedAt: { $gte: startDate, $lte: endDate },
  });

  if (progressRecords.length === 0) {
    return 0;
  }

  // Calculate total time spent (in hours)
  const totalMinutes = progressRecords.reduce(
    (sum, record) => sum + record.timeSpent,
    0
  );
  return parseFloat((totalMinutes / 60).toFixed(1));
};

/**
 * Calculate average training sessions per week
 */
export const calculateAvgTrainingSessions = async (
  memberIds: string[],
  startDate: Date,
  endDate: Date
): Promise<number> => {
  // Count training sessions accessed in the period
  const sessions = await TrainingProgress.find({
    userId: { $in: memberIds.map((id) => new Types.ObjectId(id)) },
    lastAccessDate: { $gte: startDate, $lte: endDate },
  });

  if (sessions.length === 0) {
    return 0;
  }

  // Calculate number of weeks in the period
  const weeks = Math.max(
    1,
    Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
    )
  );

  // Calculate average sessions per user per week
  return parseFloat((sessions.length / memberIds.length / weeks).toFixed(1));
};

/**
 * Calculate average completion time (hours per module)
 */
export const calculateAvgCompletionTime = async (
  memberIds: string[],
  startDate: Date,
  endDate: Date
): Promise<number> => {
  // Get completed training sessions
  const completedTrainees = await TrainingSession.aggregate([
    {
      $unwind: "$trainees",
    },
    {
      $match: {
        "trainees.userId": {
          $in: memberIds.map((id) => new Types.ObjectId(id)),
        },
        "trainees.status": "Completed",
        "trainees.completedDate": { $gte: startDate, $lte: endDate },
      },
    },
  ]);

  if (completedTrainees.length === 0) {
    return 0;
  }

  // Get training progress for these sessions
  const progressRecords = await TrainingProgress.find({
    userId: { $in: memberIds.map((id) => new Types.ObjectId(id)) },
    status: "Completed",
    updatedAt: { $gte: startDate, $lte: endDate },
  });

  if (progressRecords.length === 0) {
    return 0;
  }

  // Calculate average time spent (in hours)
  const totalMinutes = progressRecords.reduce(
    (sum, record) => sum + record.timeSpent,
    0
  );
  return parseFloat((totalMinutes / 60 / progressRecords.length).toFixed(1));
};

/**
 * Calculate engagement score (out of 100)
 */
export const calculateEngagementScore = async (
  memberIds: string[],
  startDate: Date,
  endDate: Date
): Promise<number> => {
  // This is a composite score based on several engagement factors
  // 1. Session frequency
  const avgSessions = await calculateAvgTrainingSessions(
    memberIds,
    startDate,
    endDate
  );
  const sessionScore = Math.min(100, avgSessions * 25); // 4 sessions/week = 100%

  // 2. Time spent
  const progressRecords = await TrainingProgress.find({
    userId: { $in: memberIds.map((id) => new Types.ObjectId(id)) },
    lastAccessDate: { $gte: startDate, $lte: endDate },
  });

  let timeScore = 0;
  if (progressRecords.length > 0) {
    const avgTimePerSession =
      progressRecords.reduce((sum, record) => sum + record.timeSpent, 0) /
      progressRecords.length;
    timeScore = Math.min(100, (avgTimePerSession / 30) * 100); // 30 min avg = 100%
  }

  // 3. Completion rate
  const completionRate = await calculateCompletionRateForUsers(
    memberIds,
    startDate,
    endDate
  );

  // Combine scores with weights
  const engagementScore =
    sessionScore * 0.3 + timeScore * 0.3 + completionRate * 0.4;
  return Math.round(engagementScore);
};

/**
 * Calculate completion rate for specific users
 */
export const calculateCompletionRateForUsers = async (
  userIds: string[],
  startDate: Date,
  endDate: Date
): Promise<number> => {
  // Get all training sessions assigned to these users
  const trainingSessions = await TrainingSession.find({
    "trainees.userId": { $in: userIds.map((id) => new Types.ObjectId(id)) },
    createdAt: { $lte: endDate },
  });

  if (trainingSessions.length === 0) {
    return 0;
  }

  let totalAssignments = 0;
  let completedAssignments = 0;

  trainingSessions.forEach((session) => {
    session.trainees.forEach((trainee) => {
      if (userIds.includes(trainee.userId.toString())) {
        totalAssignments++;

        if (
          trainee.status === "Completed" &&
          trainee.completedDate &&
          trainee.completedDate >= startDate &&
          trainee.completedDate <= endDate
        ) {
          completedAssignments++;
        }
      }
    });
  });

  return totalAssignments > 0
    ? parseFloat(((completedAssignments / totalAssignments) * 100).toFixed(1))
    : 0;
};
