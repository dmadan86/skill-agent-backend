// src/features/training/controllers/trainingSessionController.ts
import { Response, NextFunction } from "express";
import mongoose from "mongoose";
import * as trainingSessionService from "../services/trainingSessionService";
import { sendSuccess } from "../../../shared/utils/response.utils";
import { AuthenticatedRequest } from "../../../shared/middleware/authenticate";
import { AppError } from "../../../shared/errors/AppError";
import {
  CreateTrainingSessionInput,
  UpdateTrainingSessionInput,
  AssignTraineesInput,
} from "../validation/trainingSchema";
import { sendMemberReminder as sendMemberReminderService } from "../services/trainingSessionService";

/**
 * Create a new training session
 */
export const createTrainingSession = async (
  req: AuthenticatedRequest<{}, {}, CreateTrainingSessionInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const sessionData = req.body;

    const session = await trainingSessionService.createTrainingSession({
      ...sessionData,
      createdBy: userId,
    });

    sendSuccess(
      res,
      {
        message: "Training session created successfully",
        data: session,
      },
      201,
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing training session
 */
export const updateTrainingSession = async (
  req: AuthenticatedRequest<{ id: string }, {}, UpdateTrainingSessionInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const session = await trainingSessionService.updateTrainingSession(
      id,
      userId,
      req.body,
    );

    sendSuccess(res, {
      message: "Training session updated successfully",
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a training session by ID
 */
export const getTrainingSession = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const session = await trainingSessionService.getTrainingSessionById(
      id,
      userId,
    );

    sendSuccess(res, {
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a training session
 */
export const deleteTrainingSession = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    await trainingSessionService.deleteTrainingSession(id, userId);

    sendSuccess(res, {
      message: "Training session deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign trainees to a training session
 */
export const assignTrainees = async (
  req: AuthenticatedRequest<{ id: string }, {}, AssignTraineesInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const session = await trainingSessionService.assignTrainees(
      id,
      userId,
      req.body,
    );

    sendSuccess(res, {
      message: "Trainees assigned successfully",
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a trainee from a training session
 */
export const removeTrainee = async (
  req: AuthenticatedRequest<{ sessionId: string; userId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { sessionId, userId: traineeId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const session = await trainingSessionService.removeTrainee(
      sessionId,
      traineeId,
      userId,
    );

    sendSuccess(res, {
      message: "Trainee removed successfully",
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List training sessions with pagination and filtering
 */
export const listTrainingSessions = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const options = {
      ...req.query,
      userId: userId.toString(),
    };

    const result = await trainingSessionService.listTrainingSessions(options);

    sendSuccess(res, {
      data: result.sessions,
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

/**
 * List training sessions assigned to the current user
 */
export const listAssignedTrainingSessions = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const options = {
      ...req.query,
      userId: userId.toString(),
    };

    const result = await trainingSessionService.listTrainingSessions(options);

    sendSuccess(res, {
      data: result.sessions,
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

/**
 * Send a member reminder for a training session
 */
export const sendMemberReminder = async (
  req: AuthenticatedRequest<{ userId: string; sessionId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { userId } = req.params;

    await sendMemberReminderService(userId, req.user.userId);

    sendSuccess(res, {
      message: "Training reminder sent successfully",
      success: true,
    });
  } catch (error) {
    next(error);
  }
};
