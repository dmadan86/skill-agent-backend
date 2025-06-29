import { Response, NextFunction } from "express";
import mongoose from "mongoose";
import * as dashboardService from "../service/dashboardService";
import { sendSuccess } from "../../../shared/utils/response.utils";
import { AuthenticatedRequest } from "../../../shared/middleware/authenticate";
import { AppError } from "../../../shared/errors/AppError";
import { ParsedQs } from "qs";
import logger from "../../../shared/utils/logger";

interface RecentActivitiesQuery extends ParsedQs {
  limit?: string;
  page?: string;
}

/**
 * Get dashboard data for a manager or user
 */
export const getDashboardData = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const result = await dashboardService.getDashboardData({ userId });
    console.log("result", result);
    logger.debug("result", {
      result,
    });
    sendSuccess(res, {
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent activities for a team or user
 */
export const getRecentActivities = async (
  req: AuthenticatedRequest & { query: RecentActivitiesQuery },
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;

    const result = await dashboardService.getRecentActivities({
      userId,
      limit,
      page,
    });

    sendSuccess(res, {
      data: result,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};
