import { UpdateQuickPrepUsageSchema } from "../validation/quickPrepSchema";
import { AuthenticatedRequest } from "../../../shared/middleware/authenticate";
import { AppError } from "../../../shared/errors/AppError";
import { Response, NextFunction } from "express";
import mongoose from "mongoose";
import { sendSuccess } from "../../../shared/utils/response.utils";

export const updateUsage = async (
  req: AuthenticatedRequest<{}, {}, UpdateQuickPrepUsageSchema>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { callId } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    //   await quickPrepService.updateUsage(userId, callId);

    sendSuccess(res, {
      message: "Quick Prep usage updated successfully",
    });
  } catch (error) {
    next(error);
  }
};
