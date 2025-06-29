// src/features/training/controllers/trainingProgressController.ts
import { Response, NextFunction } from "express";
import mongoose from "mongoose";
import * as trainingProgressService from "../services/trainingProgressService";
import { sendSuccess } from "../../../shared/utils/response.utils";
import { AuthenticatedRequest } from "../../../shared/middleware/authenticate";
import { AppError } from "../../../shared/errors/AppError";
import {
  UpdateProgressInput,
  SubmitEvaluationInput,
} from "../validation/trainingSchema";

/**
 * Update training progress after a session
 */
export const updateProgress = async (
  req: AuthenticatedRequest<{ sessionId: string }, {}, UpdateProgressInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { sessionId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const { callId } = req.body;

    const progress = await trainingProgressService.updateProgress({
      sessionId,
      userId,
      callId,
    });

    sendSuccess(res, {
      message: "Training progress updated successfully",
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit an evaluation for a training session
 */
export const submitEvaluation = async (
  req: AuthenticatedRequest<{ sessionId: string }, {}, SubmitEvaluationInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { sessionId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const { score, feedback } = req.body;

    const progress = await trainingProgressService.submitEvaluation({
      sessionId,
      userId,
      score,
      feedback,
    });

    sendSuccess(res, {
      message: "Evaluation submitted successfully",
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get training progress for a specific session
 */
export const getTrainingProgress = async (
  req: AuthenticatedRequest<{ sessionId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { sessionId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const progress = await trainingProgressService.getTrainingProgress(
      sessionId,
      userId,
    );

    sendSuccess(res, {
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get training progress for a specific session and user
 */
export const getTrainingProgressByProgressId = async (
  req: AuthenticatedRequest<{ progressId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { progressId } = req.params;

    const progress =
      await trainingProgressService.getTrainingProgressByProgressId(progressId);

    sendSuccess(res, {
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all training progress for the current user
 */
export const listUserTrainingProgress = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const progressList =
      await trainingProgressService.listUserTrainingProgress(userId);

    sendSuccess(res, {
      data: progressList,
    });
  } catch (error) {
    next(error);
  }
};

export const resetProgress = async (
  req: AuthenticatedRequest<{ sessionId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { sessionId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const progress = await trainingProgressService.resetProgress(
      sessionId,
      userId,
    );

    sendSuccess(res, {
      message: "Progress reset successfully",
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};
