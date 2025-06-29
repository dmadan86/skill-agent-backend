// src/features/training/services/trainingProgressService.ts
import mongoose from "mongoose";
import {
  TrainingProgress,
  ITrainingProgress,
  ISessionSummary,
  IEvaluation,
} from "../../../shared/models/TrainingProgress";
import { TrainingSession } from "../../../shared/models/TrainingSession";
import { getCallDetails } from "../../../shared/services/retellAgentService";
import {
  TrainingSessionNotFoundError,
  TraineeNotAssignedError,
  TrainingProgressNotFoundError,
  AnalysisServiceError,
} from "../../../shared/errors/TrainingErrors";
import { updateTraineeProgress } from "./trainingSessionService";
import {
  AnalysisResult,
  analyzeTrainingTranscript,
} from "./trainingAnalysisService";
import logger from "../../../shared/utils/logger";

interface CreateTrainingProgressData {
  sessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
}

interface UpdateProgressData {
  sessionId: string;
  userId: mongoose.Types.ObjectId;
  callId: string;
}

interface SubmitEvaluationData {
  sessionId: string;
  userId: mongoose.Types.ObjectId;
  score: number;
  feedback: string;
}

/**
 * Start or continue a training session for a user
 */
export const createTrainingProgress = async (
  data: CreateTrainingProgressData,
): Promise<ITrainingProgress> => {
  const { sessionId, userId, createdBy } = data;

  let progress = await TrainingProgress.findOne({ sessionId, userId });

  // If exists, return it
  if (progress) return progress;

  // If not, create new progress
  progress = new TrainingProgress({
    sessionId,
    userId,
    summaries: [],
    progress: 0,
    status: "Not Started",
    assignedBy: createdBy,
    timeSpent: 0,
  });

  return await progress.save();
};

/**
 * Update training progress after a session
 */
export const updateProgress = async (
  data: UpdateProgressData,
): Promise<ITrainingProgress> => {
  const { sessionId, userId, callId } = data;

  logger.debug(
    `Updating progress for sessionId: ${sessionId}, userId: ${userId}, callId: ${callId}`,
  );

  const session = await TrainingSession.findById(sessionId).populate("agentId");
  const { transcript, timeSpent } = await getCallDetails(callId);

  logger.debug(
    `Retrieved transcript length: ${transcript.length}, timeSpent: ${timeSpent}`,
  );

  if (!session) {
    throw new TrainingSessionNotFoundError();
  }

  const isTrainee = session.trainees.some((t) => t.userId.equals(userId));

  if (!isTrainee) {
    throw new TraineeNotAssignedError();
  }

  let progress = await TrainingProgress.findOne({ sessionId, userId });

  if (!progress) {
    throw new TrainingProgressNotFoundError();
  }

  let previousSummary = "";
  if (progress.summaries.length > 0) {
    previousSummary = progress.summaries[progress.summaries.length - 1].content;
  }

  const progressPercentage = progress.progress;

  try {
    const agent = session.agentId as any;
    const analysisResult: AnalysisResult = await analyzeTrainingTranscript(
      transcript,
      agent.content,
      previousSummary,
      progressPercentage,
    );

    // Ensure transcript is never undefined or null
    const sanitizedTranscript = transcript || "";

    const newSummary: ISessionSummary = {
      content: analysisResult.summary,
      timestamp: new Date(),
      transcript: sanitizedTranscript,
      callId,
    };

    logger.debug(
      `Creating new summary with transcript length: ${sanitizedTranscript.length}`,
    );

    progress.summaries.push(newSummary);
    progress.progress = analysisResult.progressPercentage;
    progress.timeSpent += timeSpent;
    progress.lastAccessDate = new Date();

    if (analysisResult.topicsCovered) {
      progress.topicsCovered = analysisResult.topicsCovered;
    }

    if (analysisResult.conceptsUnderstood) {
      progress.conceptsUnderstood = analysisResult.conceptsUnderstood;
    }

    // Update status based on progress
    if (progress.progress >= 100) {
      progress.status = "Completed";
    } else {
      progress.status = "In Progress";
    }

    await progress.save();

    // Update trainee progress in the session
    await updateTraineeProgress(
      sessionId,
      userId,
      progress.progress,
      timeSpent,
    );

    return progress;
  } catch (error) {
    logger.error("Error in updateProgress:", error);
    throw new AnalysisServiceError(
      "Failed to analyze training transcript: " + (error as Error).message,
    );
  }
};

/**
 * Submit an evaluation for a training session
 */
export const submitEvaluation = async (
  data: SubmitEvaluationData,
): Promise<ITrainingProgress> => {
  const { sessionId, userId, score, feedback } = data;

  // Verify training session exists and user is assigned to it
  const session = await TrainingSession.findById(sessionId);

  if (!session) {
    throw new TrainingSessionNotFoundError();
  }

  // Check if user is assigned as a trainee
  const isTrainee = session.trainees.some((t) => t.userId.equals(userId));

  if (!isTrainee) {
    throw new TraineeNotAssignedError();
  }

  // Get training progress record
  let progress = await TrainingProgress.findOne({ sessionId, userId });

  if (!progress) {
    throw new TrainingProgressNotFoundError();
  }

  // Add the evaluation
  const evaluation: IEvaluation = {
    score,
    feedback,
    evaluatedAt: new Date(),
  };

  progress.evaluations.push(evaluation);
  await progress.save();

  return progress;
};

/**
 * Get training progress for a specific session and user
 */
export const getTrainingProgress = async (
  sessionId: string,
  userId: mongoose.Types.ObjectId,
): Promise<ITrainingProgress> => {
  const progress = await TrainingProgress.findOne({
    sessionId,
    userId,
  }).populate([
    {
      path: "userId",
      select: "firstName lastName email position department",
    },
    {
      path: "sessionId",
      select: "-trainees",
      populate: [
        {
          path: "agentId",
        },
        {
          path: "createdBy",
          select: "firstName lastName email",
        },
      ],
    },
  ]);

  if (!progress) {
    throw new TrainingProgressNotFoundError();
  }

  return progress;
};

/**
 * Get training progress for a specific progressId
 */
export const getTrainingProgressByProgressId = async (
  progressId: string,
): Promise<ITrainingProgress> => {
  const progress = await TrainingProgress.findById(progressId).populate([
    {
      path: "userId",
      select: "firstName lastName email position department",
    },
    {
      path: "sessionId",
      select: "-trainees",
      populate: [
        {
          path: "agentId",
        },
        {
          path: "createdBy",
          select: "firstName lastName email",
        },
      ],
    },
  ]);

  if (!progress) {
    throw new TrainingProgressNotFoundError();
  }

  return progress;
};

/**
 * List all training progress records for a user
 */
export const listUserTrainingProgress = async (
  userId: mongoose.Types.ObjectId,
): Promise<ITrainingProgress[]> => {
  return TrainingProgress.find({ userId })
    .sort({ updatedAt: -1 })
    .populate({
      path: "sessionId",
      select: "-trainees ",
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

export const getIndividualUserTrainingProgress = async (
  userId: mongoose.Types.ObjectId,
  agentId: mongoose.Types.ObjectId,
): Promise<ITrainingProgress[]> => {
  const session = await TrainingSession.findOne({
    "trainees.userId": userId,
    agentId: agentId,
  }).populate("trainees");

  const progressId = session?.trainees.find((t) =>
    t.userId.equals(userId),
  )?.progressId;

  return TrainingProgress.find({ _id: progressId })
    .sort({ updatedAt: -1 })
    .populate({
      path: "sessionId",
      select: "-trainees ",
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
 * Get training progress for a specific createdBy
 */
export const getTrainingProgressByCreatedBy = async (
  createdBy: mongoose.Types.ObjectId,
): Promise<ITrainingProgress[]> => {
  return TrainingProgress.find({ createdBy })
    .sort({ updatedAt: -1 })
    .populate({
      path: "sessionId",
      select: "-trainees",
      populate: [
        {
          path: "agentId",
          select: "name type industry",
        },
      ],
    });
};

export const resetProgress = async (
  sessionId: string,
  userId: mongoose.Types.ObjectId,
): Promise<ITrainingProgress> => {
  const progress = await TrainingProgress.findOneAndUpdate(
    { sessionId, userId },
    {
      $set: {
        progress: 0,
        status: "Not Started",
        summaries: [],
        evaluations: [],
        timeSpent: 0,
        lastAccessDate: new Date(),
        topicsCovered: [],
        conceptsUnderstood: [],
      },
    },
    { new: true },
  );

  if (!progress) {
    throw new TrainingProgressNotFoundError();
  }

  return progress;
};
