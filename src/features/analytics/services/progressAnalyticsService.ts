// src/features/analytics/services/progressAnalyticsService.ts
import { Types } from "mongoose";
import { TrainingSession } from "../../../shared/models/TrainingSession";
import { TrainingProgress } from "../../../shared/models/TrainingProgress";
import { EvaluationProgress } from "../../../shared/models/EvaluationProgress";
import { Team } from "../../../shared/models/Team";
import User from "../../../shared/models/User";
import { Department } from "../../../shared/models/Department";
import { NotFoundError } from "../../../shared/errors/AppError";
import { verifyTeamAccess, getDateRange } from "./analyticsService";
import { getAggregatedAnalytics } from "./analyticsAggregationService";

interface TeamMemberProgress {
  userId: string;
  name: string;
  trainingProgress: number;
  evaluationScore: number;
  skillGrowth: number;
}

interface DepartmentPerformance {
  departmentId: string | null;
  name: string;
  averageScore: number;
  completionRate: number;
  memberCount: number;
}

/**
 * Calculate training progress for a team member
 */
export const calculateMemberTrainingProgress = async (
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<number> => {
  // Find all training sessions assigned to the user
  const trainingSessions = await TrainingSession.find({
    "trainees.userId": new Types.ObjectId(userId),
  });

  if (trainingSessions.length === 0) {
    return 0;
  }

  // Calculate overall progress
  let totalProgress = 0;
  let completedSessions = 0;

  for (const session of trainingSessions) {
    const trainee = session.trainees.find(
      (t) => t.userId.toString() === userId,
    );

    if (trainee) {
      totalProgress += trainee.progress;
      if (
        trainee.status === "Completed" &&
        trainee.completedDate &&
        trainee.completedDate >= startDate &&
        trainee.completedDate <= endDate
      ) {
        completedSessions++;
      }
    }
  }

  return trainingSessions.length > 0
    ? parseFloat((totalProgress / trainingSessions.length).toFixed(1))
    : 0;
};

/**
 * Calculate evaluation score for a team member
 */
export const calculateMemberEvaluationScore = async (
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<number> => {
  // Find all completed evaluations for the user
  const evaluations = await EvaluationProgress.find({
    userId: new Types.ObjectId(userId),
    status: "Completed",
    updatedAt: { $gte: startDate, $lte: endDate },
    overallScore: { $exists: true },
  });

  if (evaluations.length === 0) {
    return 0;
  }

  // Calculate average score
  const totalScore = evaluations.reduce(
    (sum, evaluation) => sum + (evaluation.overallScore || 0),
    0,
  );
  return parseFloat((totalScore / evaluations.length).toFixed(1));
};

/**
 * Calculate skill growth for a team member
 */
export const calculateMemberSkillGrowth = async (
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<number> => {
  // For skill growth, we need to compare evaluations from start and end periods
  const periodDuration = endDate.getTime() - startDate.getTime();
  const prevStartDate = new Date(startDate.getTime() - periodDuration);
  const prevEndDate = new Date(endDate.getTime() - periodDuration);

  // Get current period average score
  const currentScore = await calculateMemberEvaluationScore(
    userId,
    startDate,
    endDate,
  );

  // Get previous period average score
  const previousScore = await calculateMemberEvaluationScore(
    userId,
    prevStartDate,
    prevEndDate,
  );

  if (previousScore === 0) {
    return 0; // Can't calculate growth without previous data
  }

  // Calculate percentage growth
  return parseFloat(
    (((currentScore - previousScore) / previousScore) * 100).toFixed(1),
  );
};

/**
 * Calculate completion rate for a team member
 */
export const calculateMemberCompletionRate = async (
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<number> => {
  // Find all training sessions assigned to the user
  const trainingSessions = await TrainingSession.find({
    "trainees.userId": new Types.ObjectId(userId),
    createdAt: { $lte: endDate },
  });

  if (trainingSessions.length === 0) {
    return 0;
  }

  // Count total and completed
  let total = 0;
  let completed = 0;

  for (const session of trainingSessions) {
    const trainee = session.trainees.find(
      (t) => t.userId.toString() === userId,
    );

    if (trainee) {
      total++;
      if (
        trainee.status === "Completed" &&
        trainee.completedDate &&
        trainee.completedDate >= startDate &&
        trainee.completedDate <= endDate
      ) {
        completed++;
      }
    }
  }

  return total > 0 ? parseFloat(((completed / total) * 100).toFixed(1)) : 0;
};

/**
 * Get team member progress
 */
export const getTeamMemberProgress = async (
  teamId: string,
  timeRange: string | { startDate: string; endDate: string },
  userId: string,
): Promise<{
  members: TeamMemberProgress[];
}> => {
  await verifyTeamAccess(teamId, userId);

  // Check if we have aggregated data available
  if (typeof timeRange === "string") {
    const aggregatedData = await getAggregatedAnalytics(
      teamId,
      timeRange,
      "teamMemberProgress",
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

  // Get user details for all team members
  const users = await User.find({
    _id: { $in: uniqueMemberIds.map((id) => new Types.ObjectId(id)) },
  });

  const userMap = new Map();
  users.forEach((user) => {
    userMap.set(user._id.toString(), user);
  });

  // Calculate progress for each member
  const members: TeamMemberProgress[] = [];

  for (const memberId of uniqueMemberIds) {
    const user = userMap.get(memberId);
    if (!user) continue;

    const trainingProgress = await calculateMemberTrainingProgress(
      memberId,
      startDate,
      endDate,
    );
    const evaluationScore = await calculateMemberEvaluationScore(
      memberId,
      startDate,
      endDate,
    );
    const skillGrowth = await calculateMemberSkillGrowth(
      memberId,
      startDate,
      endDate,
    );

    members.push({
      userId: memberId,
      name: `${user.firstName} ${user.lastName}`,
      trainingProgress,
      evaluationScore,
      skillGrowth,
    });
  }

  // Sort by training progress (descending)
  members.sort((a, b) => b.trainingProgress - a.trainingProgress);

  return { members };
};

/**
 * Get department performance
 */
export const getDepartmentPerformance = async (
  teamId: string,
  timeRange: string | { startDate: string; endDate: string },
  userId: string,
): Promise<{
  departments: DepartmentPerformance[];
}> => {
  await verifyTeamAccess(teamId, userId);

  // Check if we have aggregated data available
  if (typeof timeRange === "string") {
    const aggregatedData = await getAggregatedAnalytics(
      teamId,
      timeRange,
      "departmentPerformance",
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

  // Get user details with department info
  const users = await User.find({
    _id: { $in: uniqueMemberIds.map((id) => new Types.ObjectId(id)) },
  }).populate("department");

  // Group users by department
  const departmentMap = new Map<
    string,
    {
      departmentId: string | null;
      name: string;
      members: string[];
      scores: number[];
      completionRates: number[];
    }
  >();

  // Include "No Department" category
  departmentMap.set("none", {
    departmentId: null,
    name: "No Department",
    members: [],
    scores: [],
    completionRates: [],
  });

  // Group users by department
  for (const user of users) {
    // Handle the case where department might be an ObjectId or populated document
    const departmentId = user.department
      ? typeof user.department === "object" && "name" in user.department
        ? user.department._id.toString()
        : user.department.toString()
      : "none";

    const departmentName =
      user.department &&
      typeof user.department === "object" &&
      "name" in user.department
        ? (user.department.name as string)
        : "No Department";

    if (!departmentMap.has(departmentId)) {
      departmentMap.set(departmentId, {
        departmentId: departmentId === "none" ? null : departmentId,
        name: departmentName,
        members: [],
        scores: [],
        completionRates: [],
      });
    }

    departmentMap.get(departmentId)!.members.push(user._id.toString());
  }

  // Calculate metrics for each department
  const departments: DepartmentPerformance[] = [];

  for (const [departmentId, data] of departmentMap.entries()) {
    if (data.members.length === 0) continue;

    for (const memberId of data.members) {
      const evalScore = await calculateMemberEvaluationScore(
        memberId,
        startDate,
        endDate,
      );
      const completionRate = await calculateMemberCompletionRate(
        memberId,
        startDate,
        endDate,
      );

      if (evalScore > 0) data.scores.push(evalScore);
      if (completionRate > 0) data.completionRates.push(completionRate);
    }

    const averageScore =
      data.scores.length > 0
        ? parseFloat(
            (
              data.scores.reduce((a, b) => a + b, 0) / data.scores.length
            ).toFixed(1),
          )
        : 0;

    const completionRate =
      data.completionRates.length > 0
        ? parseFloat(
            (
              data.completionRates.reduce((a, b) => a + b, 0) /
              data.completionRates.length
            ).toFixed(1),
          )
        : 0;

    departments.push({
      departmentId: data.departmentId,
      name: data.name,
      averageScore,
      completionRate,
      memberCount: data.members.length,
    });
  }

  // Sort by average score (descending)
  departments.sort((a, b) => b.averageScore - a.averageScore);

  return { departments };
};

/**
 * Calculate training score for a user
 */
export const calculateUserTrainingScore = async (
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<number> => {
  // Get all evaluation progress for the user
  const evaluations = await EvaluationProgress.find({
    userId: new Types.ObjectId(userId),
    updatedAt: { $gte: startDate, $lte: endDate },
    overallScore: { $exists: true },
  });

  if (evaluations.length === 0) {
    return 0;
  }

  // Calculate average score
  const totalScore = evaluations.reduce(
    (sum, evaluation) => sum + (evaluation.overallScore ?? 0),
    0,
  );
  return parseFloat((totalScore / evaluations.length).toFixed(1));
};

/**
 * Calculate training progress percentage for a user
 */
export const calculateUserTrainingProgress = async (
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<number> => {
  // Get all assigned training sessions for the user
  const trainingSessions = await TrainingSession.find({
    "trainees.userId": new Types.ObjectId(userId),
    createdAt: { $lte: endDate },
  });

  if (trainingSessions.length === 0) {
    return 0;
  }

  let totalAssigned = 0;
  let totalCompleted = 0;

  trainingSessions.forEach((session) => {
    const userTrainee = session.trainees.find(
      (trainee) => trainee.userId.toString() === userId,
    );

    if (userTrainee) {
      totalAssigned++;

      if (
        userTrainee.status === "Completed" &&
        userTrainee.completedDate &&
        userTrainee.completedDate >= startDate &&
        userTrainee.completedDate <= endDate
      ) {
        totalCompleted++;
      }
    }
  });

  return totalAssigned > 0
    ? parseFloat(((totalCompleted / totalAssigned) * 100).toFixed(1))
    : 0;
};

/**
 * Calculate average score for a department
 */
export const calculateDepartmentAvgScore = async (
  userIds: string[],
  startDate: Date,
  endDate: Date,
): Promise<number> => {
  if (userIds.length === 0) {
    return 0;
  }

  // Calculate average evaluation scores for department members
  const scores = await EvaluationProgress.aggregate([
    {
      $match: {
        userId: { $in: userIds.map((id) => new Types.ObjectId(id)) },
        updatedAt: { $gte: startDate, $lte: endDate },
        overallScore: { $exists: true },
      },
    },
    {
      $group: {
        _id: "$userId",
        avgScore: { $avg: "$overallScore" },
      },
    },
    {
      $group: {
        _id: null,
        departmentAvgScore: { $avg: "$avgScore" },
      },
    },
  ]);

  return scores.length > 0
    ? parseFloat(scores[0].departmentAvgScore.toFixed(1))
    : 0;
};

/**
 * Calculate training completion rate for a department
 */
export const calculateDepartmentCompletionRate = async (
  userIds: string[],
  startDate: Date,
  endDate: Date,
): Promise<number> => {
  if (userIds.length === 0) {
    return 0;
  }

  // Get all training sessions for department members
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
