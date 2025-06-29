// src/features/evaluation/controllers/evaluationController.ts
import { Response, NextFunction } from "express";
import mongoose from "mongoose";
import * as evaluationService from "../services/evaluationService";
import * as evaluationProgressService from "../services/evaluationProgressService";
import { sendSuccess } from "../../../shared/utils/response.utils";
import { AuthenticatedRequest } from "../../../shared/middleware/authenticate";
import { AppError } from "../../../shared/errors/AppError";
import {
  CreateEvaluationInput,
  UpdateEvaluationInput,
  AssignUsersInput,
} from "../validation/evaluationSchema";
import * as reportGenerationService from "../services/reportGenerationService";
import User from "../../../shared/models/User";

/**
 * Create a new evaluation
 */
export const createEvaluation = async (
  req: AuthenticatedRequest<{}, {}, CreateEvaluationInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const evaluation = await evaluationService.createEvaluation({
      ...req.body,
      createdBy: userId,
    });

    sendSuccess(
      res,
      {
        message: "Evaluation created successfully",
        data: evaluation,
      },
      201,
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing evaluation
 */
export const updateEvaluation = async (
  req: AuthenticatedRequest<{ id: string }, {}, UpdateEvaluationInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const evaluation = await evaluationService.updateEvaluation(
      id,
      userId,
      req.body,
    );

    sendSuccess(res, {
      message: "Evaluation updated successfully",
      data: evaluation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get an evaluation by ID
 */
export const getEvaluation = async (
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

    const evaluation = await evaluationService.getEvaluationById(id, userId);

    sendSuccess(res, {
      data: evaluation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an evaluation
 */
export const deleteEvaluation = async (
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

    await evaluationService.deleteEvaluation(id, userId);

    sendSuccess(res, {
      message: "Evaluation deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign users to an evaluation
 */
export const assignUsers = async (
  req: AuthenticatedRequest<{ id: string }, {}, AssignUsersInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const evaluation = await evaluationService.assignUsers(
      id,
      userId,
      req.body,
    );

    sendSuccess(res, {
      message: "Users assigned successfully",
      data: evaluation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove an assignee from an evaluation
 */
export const removeAssignee = async (
  req: AuthenticatedRequest<{ evaluationId: string; userId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { evaluationId, userId: assigneeId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const evaluation = await evaluationService.removeAssignee(
      evaluationId,
      assigneeId,
      userId,
    );

    sendSuccess(res, {
      message: "Assignee removed successfully",
      data: evaluation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List evaluations with filtering
 */
export const listEvaluations = async (
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

    const result = await evaluationService.listEvaluations(options);

    sendSuccess(res, {
      data: result.evaluations,
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
 * Generate and download evaluation report
 */
export const downloadEvaluationReport = async (
  req: AuthenticatedRequest<{ evaluationId: string; userId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { evaluationId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    // Get the evaluation with all populated fields
    const evaluation = await evaluationService.getEvaluationById(
      evaluationId,
      userId,
    );

    // Find the assignee
    const evaluationProgress =
      await evaluationProgressService.getEvaluationProgress(
        evaluationId,
        userId,
      );

    if (!evaluationProgress) {
      throw new AppError(
        "Evaluation progress not found",
        "EVALUATION_PROGRESS_NOT_FOUND",
        404,
      );
    }

    // Extract user data from assignee
    const userData = await User.findById(evaluationProgress.userId);

    if (!userData) {
      throw new AppError("User not found", "USER_NOT_FOUND", 404);
    }

    // Extract agent data
    const agentData = evaluation.agentId;

    // Generate the PDF report
    const pdfBuffer = await reportGenerationService.generateEvaluationReport(
      evaluationProgress,
      evaluation,
      userData,
      agentData,
    );

    // Set up filename for download
    const fileName = `${evaluation.title}_${userData.firstName}_${userData.lastName}_${new Date().toISOString().split("T")[0]}.pdf`;

    // Send the PDF file
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
