import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../../shared/middleware/authenticate";
import { sendSuccess } from "../../../shared/utils/response.utils";
import { getSuperAdminAnalytics } from "../services/superAdminAnalyticsService";
import { AppError } from "../../../shared/errors/AppError";
import { getUserActivities } from "../services/userActivitiesService";

export const getAnalytics = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    if (req.user.role !== "superadmin") {
      throw new AppError("Unauthorized access", "UNAUTHORIZED", 403);
    }

    const analytics = await getSuperAdminAnalytics();
    sendSuccess(res, {
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

export const getActivities = async (
  req: AuthenticatedRequest<{}, {}, {}, { page: number; limit: number }>,
  res: Response,
) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const activities = await getUserActivities(page, limit);
    sendSuccess(res, {
      data: activities,
    });
  } catch (error) {
    console.error("Error in getUserActivities controller:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch user activities",
        code: "GET_USER_ACTIVITIES_FAILED",
      },
    });
  }
};
