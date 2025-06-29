import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../../shared/middleware/authenticate";
import { sendSuccess } from "../../../shared/utils/response.utils";
import { AppError } from "../../../shared/errors/AppError";
import mongoose from "mongoose";
import {
  createPublicAgentsForUser,
  getPublicAgentsForUser,
} from "../services/publicAgentService";

export const createPublicAgents = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);

    // Create public agents for the user
    const agents = await createPublicAgentsForUser(userId);

    sendSuccess(res, {
      message: "Public agents created successfully",
      data: agents,
    });
  } catch (error) {
    next(error);
  }
};

// Add this interface to type the query parameters
interface PublicAgentQuery {
  page?: string;
  limit?: string;
  type?: string;
  industry?: string;
}

export const getPublicAgents = async (
  req: AuthenticatedRequest<{}, {}, {}, PublicAgentQuery>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);

    // Now TypeScript knows these properties exist on req.query
    const { page, limit, type, industry } = req.query;

    // Get public agents for the user with query parameters
    // This function DOESN'T create agents, it only retrieves them
    const agents = await getPublicAgentsForUser(userId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      type,
      industry,
    });

    sendSuccess(res, {
      data: agents.agents,
      meta: {
        total: agents.total,
        page: agents.page,
        limit: agents.limit,
        totalPages: agents.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};
