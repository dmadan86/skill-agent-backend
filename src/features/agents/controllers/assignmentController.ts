import { Response, NextFunction } from "express";
import * as assignmentService from "../services/assignmentService";
import { sendSuccess } from "../../../shared/utils/response.utils";
import { AuthenticatedRequest } from "../../../shared/middleware/authenticate";
import { AppError } from "../../../shared/errors/AppError";
import mongoose from "mongoose";

/**
 * Assign users to both training and evaluation sessions for an agent
 */
export const assignUsersToAgent = async (
  req: AuthenticatedRequest<
    { agentId: string },
    {},
    { userIds?: string[]; departmentIds?: string[] }
  >,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { agentId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const results = await assignmentService.assignUsersToAgent(
      agentId,
      userId,
      req.body,
    );

    sendSuccess(res, {
      message:
        "Users assigned successfully to both training and evaluation sessions",
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove users from both training and evaluation sessions for an agent
 */
export const removeUsersFromAgent = async (
  req: AuthenticatedRequest<{ agentId: string; userId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { agentId, userId: userToRemove } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const results = await assignmentService.removeUsersFromAgent(
      agentId,
      userId,
      userToRemove,
    );

    sendSuccess(res, {
      message:
        "User removed successfully from both training and evaluation sessions",
      data: results,
    });
  } catch (error) {
    next(error);
  }
};
