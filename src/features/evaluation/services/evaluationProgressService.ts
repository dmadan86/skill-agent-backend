// src/features/evaluation/services/evaluationProgressService.ts
import mongoose from "mongoose";

import { Evaluation } from "../../../shared/models/Evaluation";

import {
  EvaluationNotFoundError,
  AssigneeNotFoundError,
  EvaluationAnalysisError,
} from "../../../shared/errors/EvaluationErrors";
import { AnalysisResult, analyzeEvaluationTranscript } from "./evaluationAnalysisService";
import {
  EvaluationProgress,
  IEvaluationProgress,
  IEvaluationSummary,
} from "../../../shared/models/EvaluationProgress";
import { updateEvaluationProgress } from "./evaluationService";
import { getCallDetails } from "../../../shared/services/retellAgentService";
import { AppError } from "../../../shared/errors/AppError";

interface CreateEvaluationProgressData {
  evaluationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
}

interface UpdateProgressData {
  evaluationId: string;
  userId: mongoose.Types.ObjectId;
  callId: string;
}

interface SubmitEvaluationData {
  evaluationId: string;
  userId: mongoose.Types.ObjectId;
  score: number;
  feedback: string;
}

/**
 * Start or continue an evaluation for a user
 */
export const createEvaluationProgress = async (
  data: CreateEvaluationProgressData
): Promise<IEvaluationProgress> => {
  const { evaluationId, userId, createdBy } = data;

  let progress = await EvaluationProgress.findOne({ evaluationId, userId });

  if (progress) return progress;

  progress = new EvaluationProgress({
    evaluationId,
    userId,
    createdBy,
    summaries: [],
    progress: 0,
    status: "Not Started",
    assignedBy: createdBy,
    timeSpent: 0,
  });

  return await progress.save();
};

/**
 * Update evaluation progress after a session
 */
export const updateProgress = async (
  data: UpdateProgressData
): Promise<IEvaluationProgress> => {
  const { evaluationId, userId, callId } = data;

  const evaluation = await Evaluation.findById(evaluationId).populate(
    "agentId"
  );
  const { transcript, timeSpent } = await getCallDetails(callId);

  if (!evaluation) {
    throw new EvaluationNotFoundError();
  }

  const isAssignee = evaluation.assignees.some((a) => a.userId.equals(userId));

  if (!isAssignee) {
    throw new AssigneeNotFoundError();
  }

  // Get evaluation progress record
  let progress = await EvaluationProgress.findOne({ evaluationId, userId });

  if (!progress) {
    throw new AppError(
      "Evaluation progress not found",
      "EVALUATION_PROGRESS_NOT_FOUND",
      404
    );
  }

  // Get previous summary if available
  let previousSummary = "";
  if (progress.summaries.length > 0) {
    previousSummary = progress.summaries[progress.summaries.length - 1].content;
  }

  try {
    // Analyze the transcript to generate summary and calculate progress
    const agent = evaluation.agentId as any;
    const analysisResult : AnalysisResult = await analyzeEvaluationTranscript(
      transcript,
      agent.content,
      previousSummary,
      [],
      progress.progress
    );

    // Create new summary
    const newSummary: IEvaluationSummary = {
      content: analysisResult.summary,
      timestamp: new Date(),
      transcript: transcript,
      callId,
    };

    progress.summaries.push(newSummary);
    progress.progress = analysisResult.progressPercentage;
    progress.timeSpent += timeSpent;
    progress.lastAccessDate = new Date();

    // Update topics covered and concepts understood
    if (analysisResult.improvementAreas) {
      progress.improvementAreas = analysisResult.improvementAreas;
    }

    if (analysisResult.strengths) {
      progress.strengths = analysisResult.strengths;
    }

    if (analysisResult.recommendation) {
      progress.recommendation = analysisResult.recommendation;
    }

    if (analysisResult.nextSteps) {
      progress.nextSteps = analysisResult.nextSteps;
    }

    // Update status based on progress
    if (progress.progress >= 100) {
      progress.status = "Completed";
    } else {
      progress.status = "In Progress";
    }

    await progress.save();

    // Update assignee progress in the evaluation
    await updateEvaluationProgress(
      evaluationId,
      userId,
      progress.progress,
      timeSpent,
      progress.overallScore ?? 0,
    );

    return progress;
  } catch (error) {
    throw new EvaluationAnalysisError(
      "Failed to analyze evaluation transcript: " + (error as Error).message
    );
  }
};

/**
 * Get evaluation progress for a specific evaluation and user
 */
export const getEvaluationProgress = async (
  evaluationId: string,
  userId: mongoose.Types.ObjectId
): Promise<IEvaluationProgress> => {
  const progress = await EvaluationProgress.findOne({ evaluationId, userId }).populate([
    {
      path: "userId",
      select: "firstName lastName email position department",
    },
    {
    path: "evaluationId",
    select: "-assignees",
    populate: [
      {
        path: "agentId",
      },
      {
        path: "createdBy",
        select: "firstName lastName email",
      },
    ],
  }]);

  if (!progress) {
    throw new EvaluationNotFoundError();
  }

  return progress;
};

export const getIndividualUserEvaluationProgress = async (
  userId: mongoose.Types.ObjectId,
  evaluationId: mongoose.Types.ObjectId
): Promise<IEvaluationProgress[]> => {

  const session = await Evaluation.findOne({ "assignees.userId": userId, "agentId": evaluationId }).populate('assignees')

  const progressId = session?.assignees.find((t) => t.userId.equals(userId))?.progressId

  return EvaluationProgress.find({ _id: progressId })
    .sort({ updatedAt: -1 })
    .populate({
      path: "evaluationId",
      select: "-assignees ",
      populate: [
        {
          path: "agentId",
          select: "name type industry",
        },
        {
          path: "createdBy",
          select: "firstName lastName email",
        },
      ],
    });
};

/**
 * Get evaluation progress for a specific progressId
 */
export const getEvaluationProgressByProgressId = async (
  progressId: string
): Promise<IEvaluationProgress> => {
  const progress = await EvaluationProgress.findById(progressId).populate([
    {
      path: "userId",
      select: "firstName lastName email position department",
    },
    {
    path: "evaluationId",
    select: "-assignees",
    populate: [
      {
        path: "agentId",
      },
      {
        path: "createdBy",
        select: "firstName lastName email",
      },
    ],
  }]);

  if (!progress) {
    throw new EvaluationNotFoundError();
  }

  return progress;
};


/**
 * List all evaluation progress records for a user
 */
export const listUserEvaluationProgress = async (
  userId: mongoose.Types.ObjectId
): Promise<IEvaluationProgress[]> => {
  return EvaluationProgress.find({ userId })
    .sort({ updatedAt: -1 })
    .populate({
      path: "evaluationId",
      select: "-assignees ",
      populate: [
        {
          path: "agentId",
          select: "name type industry",
        },
        {
          path: "createdBy",
          select: "firstName lastName email",
        },
      ],
    });
};
