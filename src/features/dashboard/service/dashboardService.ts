import mongoose from "mongoose";
import User from "../../../shared/models/User";
import { IActivity } from "../../../shared/models/Activity";
import {
  getActivityRecords,
  IActivityRecords,
} from "../../../shared/services/activityService";
import { AppError } from "../../../shared/errors/AppError";
import { TrainingProgress } from "../../../shared/models/TrainingProgress";
import { EvaluationProgress } from "../../../shared/models/EvaluationProgress";
import logger from "../../../shared/utils/logger";

interface RecentActivitiesOptions {
  userId: mongoose.Types.ObjectId;
  limit?: number;
  page?: number;
}

interface DashboardDataOptions {
  userId: mongoose.Types.ObjectId;
}

interface DashboardData {
  totalTrainingSessions: number;
  activeTrainingSessions: number;
  completedEvaluations: number;
  pendingEvaluations: number;
}

/**
 * Get dashboard data for a manager or user
 */
export const getDashboardData = async (
  options: DashboardDataOptions,
): Promise<DashboardData> => {
  const { userId } = options;

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", "USER_NOT_FOUND", 404);
  }
  let totalTrainingSessions = 0;
  let activeTrainingSessions = 0;
  let completedEvaluations = 0;
  let pendingEvaluations = 0;
  console.log("user.role", user.role);
  if (
    user.role.toLowerCase() === "manager" ||
    user.role.toLowerCase() === "admin"
  ) {
    totalTrainingSessions = await TrainingProgress.countDocuments({
      assignedBy: userId,
    });
    activeTrainingSessions = await TrainingProgress.countDocuments({
      assignedBy: userId,
      status: "In Progress",
    });
    completedEvaluations = await EvaluationProgress.countDocuments({
      assignedBy: userId,
      status: "Completed",
    });
    pendingEvaluations = await EvaluationProgress.countDocuments({
      assignedBy: userId,
      status: { $in: ["Not Started", "In Progress"] },
    });
  } else {
    totalTrainingSessions = await TrainingProgress.countDocuments({
      userId: userId,
    });
    activeTrainingSessions = await TrainingProgress.countDocuments({
      userId: userId,
      status: "In Progress",
    });
    completedEvaluations = await EvaluationProgress.countDocuments({
      userId: userId,
      status: "Completed",
    });
    pendingEvaluations = await EvaluationProgress.countDocuments({
      userId: userId,
      status: { $in: ["Not Started", "In Progress"] },
    });
  }

  logger.debug("dashboardData", {
    totalTrainingSessions,
    activeTrainingSessions,
    completedEvaluations,
    pendingEvaluations,
  });

  return {
    totalTrainingSessions,
    activeTrainingSessions,
    completedEvaluations,
    pendingEvaluations,
  };
};

/**
 * Get recent activities for a team or user
 */
export const getRecentActivities = async (
  options: RecentActivitiesOptions,
): Promise<{
  activities: IActivity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const { userId, page = 1, limit = 10 } = options;

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", "USER_NOT_FOUND", 404);
  }

  const paginatedActivities: IActivityRecords = await getActivityRecords(
    userId.toString(),
    limit,
    page,
  );

  return {
    activities: paginatedActivities.activities,
    total: paginatedActivities.total,
    page,
    limit,
    totalPages: paginatedActivities.totalPages,
  };
};
