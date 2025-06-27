// src/features/evaluation/controllers/evalutionProgressController.ts
import { Response, NextFunction } from "express";
import mongoose from 'mongoose';
import * as evaluationProgressService from "../services/evaluationProgressService";
import { sendSuccess } from "../../../shared/utils/response.utils";
import { AuthenticatedRequest } from "../../../shared/middleware/authenticate";
import { AppError } from "../../../shared/errors/AppError";
import { UpdateEvaluationProgressInput } from "../validation/evaluationSchema";
import { EvaluationProgress } from "../../../shared/models/EvaluationProgress";


/**
 * Update evaluation progress after a session
 */
export const updateProgress = async (
  req: AuthenticatedRequest<{ evaluationId: string }, {}, UpdateEvaluationProgressInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { evaluationId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const {callId } = req.body;
    
    const progress = await evaluationProgressService.updateProgress({
      evaluationId,
      userId,
      callId,
    });
    
    sendSuccess(res, {
      message: "Evaluation progress updated successfully",
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get evaluation progress for a specific session
 */
export const getEvaluationProgress = async (
  req: AuthenticatedRequest<{ evaluationId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { evaluationId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    const progress = await evaluationProgressService.getEvaluationProgress(evaluationId, userId);
    
    sendSuccess(res, {
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get evaluation progress for a specific progressId
 */
export const getEvaluationProgressByProgressId = async (
  req: AuthenticatedRequest<{ progressId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { progressId } = req.params;

    const progress = await evaluationProgressService.getEvaluationProgressByProgressId(progressId);

    sendSuccess(res, {
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * List all evaluation progress for the current user
 */
export const listUserEvaluationProgress = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    const progressList = await evaluationProgressService.listUserEvaluationProgress(userId);
    
    sendSuccess(res, {
      data: progressList,
    });
  } catch (error) {
    next(error);
  }
};

export const resetProgress = async (
  req: AuthenticatedRequest<{ evaluationId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { evaluationId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const progress = await EvaluationProgress.findOneAndUpdate({ evaluationId, userId }, { $set: { progress: 0, status: "Not Started", summaries: [], evaluations: [], timeSpent: 0, lastAccessDate: new Date(), topicsCovered: [], conceptsUnderstood: []} }, { new: true });


    sendSuccess(res, {
      message: "Progress reset successfully",
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};