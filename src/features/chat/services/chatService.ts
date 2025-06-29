import mongoose from "mongoose";
import { AppError } from "../../../shared/errors/AppError";
import { Agent, IAgent } from "../../../shared/models/Agent";
import User, { IUser } from "../../../shared/models/User";
import * as openaiService from "../../../shared/services/openaiService";
import { analyzeTrainingTranscript } from "../../../features/training/services/trainingAnalysisService";
import {
  EvaluationProgress,
  IEvaluationProgress,
} from "../../../shared/models/EvaluationProgress";
import { analyzeEvaluationTranscript } from "../../../features/evaluation/services/evaluationAnalysisService";
import {
  ITrainingProgress,
  TrainingProgress,
} from "../../../shared/models/TrainingProgress";
import { updateEvaluationProgress } from "../../../features/evaluation/services/evaluationService";
import { updateTraineeProgress } from "../../../features/training/services/trainingSessionService";
import {
  ChatSession,
  IChatMessage,
  IChatSession,
} from "../../../shared/models/ChatSession";
import logger from "../../../shared/utils/logger";
import { getTrainingProgress } from "../../../features/training/services/trainingProgressService";
import { getEvaluationProgress } from "../../../features/evaluation/services/evaluationProgressService";

/**
 * Create a new chat session
 */
export const createChatSession = async (
  userId: mongoose.Types.ObjectId,
  agentId: string,
  sessionType: "TRAINING" | "EVALUATION" | "QUICK_PREP",
  sessionId?: string,
): Promise<IChatSession> => {
  try {
    const agent = await Agent.findById(agentId);
    if (!agent) {
      throw new AppError(
        `Agent not found with id: ${agentId}`,
        "AGENT_NOT_FOUND",
        404,
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(
        `User not found with id: ${userId}`,
        "USER_NOT_FOUND",
        404,
      );
    }

    // Create session
    const session = new ChatSession({
      userId,
      agentId: new mongoose.Types.ObjectId(agentId),
      sessionType,
      sessionId: sessionId,
      status: "active",
      startTime: new Date(),
      messages: [],
    });

    const savedChatSession = await session.save();

    // if (sessionType.toUpperCase() === "TRAINING") {
    //   const trainingProgress = TrainingProgress.updateOne({
    //     userId: userId,
    //     sessionId: sessionId,
    //   }, {

    //   });
    // }

    return savedChatSession;
  } catch (error) {
    console.error(`Error creating chat session: ${error}`);
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Failed to create chat session",
      "CHAT_SESSION_ERROR",
      500,
    );
  }
};

/**
 * Get initial greeting message for a chat session
 */
export const getInitialGreeting = async (
  sessionId: string,
  userId: mongoose.Types.ObjectId,
  userName: string,
  userPosition: string,
  userDepartment: string,
): Promise<{ messageId: string; content: string; stream?: any }> => {
  try {
    const session = await ChatSession.findById(sessionId);
    console.log("session", session);
    if (!session) {
      throw new AppError(
        `Session not found with id: ${sessionId}`,
        "SESSION_NOT_FOUND",
        404,
      );
    }

    const user = await User.findById(userId).populate("department");
    if (!user) {
      throw new AppError(
        `User not found with id: ${userId}`,
        "USER_NOT_FOUND",
        404,
      );
    }

    const agent = await Agent.findById(session.agentId);
    if (!agent) {
      throw new AppError(
        `Agent not found with id: ${session.agentId}`,
        "AGENT_NOT_FOUND",
        404,
      );
    }

    const systemPrompt = await getSystemPrompt(agent, session, user);

    const systemMessage: IChatMessage = {
      role: "system",
      content: systemPrompt,
      timestamp: new Date(),
    };

    const messages = [{ role: "system", content: systemPrompt }];

    // Save the system message to the session
    session.messages.push(systemMessage);
    await session.save();

    // Get streaming response for greeting
    const completion = await openaiService.getChatCompletion(messages, true);

    // Return just the streaming object and message ID
    return {
      messageId: String(session.messages.length),
      content: "", // Will be populated during streaming
      stream: completion,
    };
  } catch (error) {
    console.error("Error getting initial greeting:", error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to get initial greeting", "GREETING_ERROR", 500);
  }
};

export const getSystemPrompt = async (
  agent: IAgent,
  session: IChatSession,
  user: IUser,
): Promise<string> => {
  try {
    const sessionType = session.sessionType.toUpperCase();
    const sessionId = session.sessionId;
    console.log("sessionId", sessionId, sessionType, user._id);

    if (
      (sessionType === "TRAINING" || sessionType === "EVALUATION") &&
      !sessionId
    ) {
      throw new AppError("Session id not found", "SESSION_NOT_FOUND", 404);
    }

    let systemPrompt = "";
    if (sessionType.toUpperCase() === "TRAINING") {
      if (!sessionId) {
        throw new AppError("Session id not found", "SESSION_NOT_FOUND", 404);
      }
      const progress = await getTrainingProgress(
        sessionId,
        new mongoose.Types.ObjectId(user._id.toString()),
      );
      console.log("progress", progress);
      const length = progress?.summaries.length;
      let lastSummary = "";
      if (length > 0) {
        lastSummary = progress?.summaries[length - 1]?.content ?? "";
      }
      systemPrompt = agent.trainingPrompt
        ?.replace("{{user_name}}", `${user.firstName} ${user.lastName}`)
        ?.replace("{{user_position}}", user.position ?? "")
        ?.replace("{{user_department}}", (user.department as any)?.name ?? "")
        ?.replace("{{previous_session_summary}}", lastSummary);
    } else if (sessionType.toUpperCase() === "EVALUATION") {
      if (!sessionId) {
        throw new AppError("Session id not found", "SESSION_NOT_FOUND", 404);
      }
      const progress = await getEvaluationProgress(
        sessionId,
        new mongoose.Types.ObjectId(user._id.toString()),
      );
      const length = progress.summaries.length;
      let lastSummary = "";
      if (length > 0) {
        lastSummary = progress.summaries[length - 1].content;
      }
      systemPrompt = agent.evaluationPrompt
        .replace("{{user_name}}", `${user.firstName} ${user.lastName}`)
        .replace("{{user_position}}", user.position ?? "")
        .replace("{{user_department}}", (user.department as any)?.name ?? "")
        .replace("{{previous_session_summary}}", lastSummary);
    } else {
      systemPrompt = agent.quickPrepPrompt
        .replace("{{user_name}}", `${user.firstName} ${user.lastName}`)
        .replace("{{user_position}}", user.position ?? "")
        .replace("{{user_department}}", (user.department as any)?.name ?? "");
    }

    return systemPrompt;
  } catch (error) {
    logger.info(`error:  ${error}`);
    throw new AppError("Error fetching system prompt", "SERVER_ERROR", 500);
  }
};
/**
 * Process a user message in a chat session
 */
export const processChatMessage = async (
  sessionId: string,
  content: string,
): Promise<{ messageId: string }> => {
  try {
    const session = await ChatSession.findById(sessionId);
    if (!session) {
      throw new AppError(
        `Session not found with id: ${sessionId}`,
        "SESSION_NOT_FOUND",
        404,
      );
    }

    if (session.status !== "active") {
      throw new AppError("Chat session is not active", "INACTIVE_SESSION", 400);
    }

    // Add user message to session
    const userMessage: IChatMessage = {
      role: "user",
      content,
      timestamp: new Date(),
    };

    session.messages.push(userMessage);
    await session.save();

    return {
      messageId: String(session.messages.length - 1),
    };
  } catch (error) {
    console.error("Error processing chat message:", error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Failed to process chat message",
      "CHAT_MESSAGE_ERROR",
      500,
    );
  }
};

/**
 * Generate assistant response
 */
export const generateAssistantResponse = async (
  sessionId: string,
): Promise<{ messageId: string; content: string; stream?: any }> => {
  try {
    const session = await ChatSession.findById(sessionId);
    if (!session) {
      throw new AppError(
        `Session not found with id: ${sessionId}`,
        "SESSION_NOT_FOUND",
        404,
      );
    }

    const messages = session.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const response = await openaiService.getChatCompletion(messages, true);
    return {
      messageId: String(session.messages.length),
      content: "", // Will be populated during streaming
      stream: response,
    };
  } catch (error) {
    console.error("Error generating assistant response:", error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Failed to generate assistant response",
      "ASSISTANT_RESPONSE_ERROR",
      500,
    );
  }
};

/**
 * Save assistant message to session
 */
export const saveAssistantMessage = async (
  sessionId: string,
  content: string,
): Promise<{ messageId: string }> => {
  try {
    const session = await ChatSession.findById(sessionId);
    if (!session) {
      throw new AppError(
        `Session not found with id: ${sessionId}`,
        "SESSION_NOT_FOUND",
        404,
      );
    }

    const assistantMessage: IChatMessage = {
      role: "assistant",
      content,
      timestamp: new Date(),
    };

    session.messages.push(assistantMessage);
    await session.save();

    return {
      messageId: String(session.messages.length - 1),
    };
  } catch (error) {
    console.error("Error saving assistant message:", error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Failed to save assistant message",
      "SAVE_MESSAGE_ERROR",
      500,
    );
  }
};

/**
 * End a chat session and generate summary
 */
export const endChatSession = async (
  sessionId: string,
): Promise<IEvaluationProgress | ITrainingProgress | undefined> => {
  try {
    const session = await getChatSessionWithAgent(sessionId);
    if (session.status !== "active") {
      throw new AppError("Session already ended", "SESSION_ENDED", 400);
    }

    session.endTime = new Date();
    await session.save();
    const transcript = generateTranscript(session);

    //calculate start time and end time in seconds
    const startTimeSeconds = Math.floor(session.startTime.getTime() / 1000);
    const endTimeSeconds = Math.floor(session.endTime.getTime() / 1000);

    const timeSpentSeconds = endTimeSeconds - startTimeSeconds;

    if (session.sessionType === "EVALUATION") {
      return await handleEvaluationSession(
        session,
        transcript,
        timeSpentSeconds,
      );
    } else if (session.sessionType === "TRAINING") {
      return await handleTrainingSession(session, transcript, timeSpentSeconds);
    }
  } catch (error) {
    console.error("Error ending chat session:", error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to end chat session", "END_SESSION_ERROR", 500);
  }
};

// Helper functions to reduce complexity

const getChatSessionWithAgent = async (sessionId: string) => {
  const session = await ChatSession.findById(sessionId).populate({
    path: "agentId",
    select: "name content instructions",
  });

  if (!session) {
    throw new AppError(
      `Session not found with id: ${sessionId}`,
      "SESSION_NOT_FOUND",
      404,
    );
  }

  return session;
};

const generateTranscript = (session: any): string => {
  return session.messages
    .map((msg: any) => `${msg.role}: ${msg.content}`)
    .join("\n");
};

const handleEvaluationSession = async (
  session: any,
  transcript: string,
  timeSpent: number,
) => {
  const progress = await EvaluationProgress.findOne({
    evaluationId: session.sessionId,
    userId: session.userId,
  });

  if (!progress) {
    throw new AppError("Progress not found", "PROGRESS_NOT_FOUND", 404);
  }

  let previousSummary = "";
  const length = progress.summaries.length;
  if (length > 0) {
    previousSummary = progress.summaries[length - 1].content;
  }
  const agent = session.agentId;

  const analysisResult = await analyzeEvaluationTranscript(
    transcript,
    agent.content,
    previousSummary,
  );

  logger.debug(`analysisResult: ${JSON.stringify(analysisResult)}`);

  const updatePayload = updateChatEvaluationProgress(
    progress,
    analysisResult,
    session,
    transcript,
  );

  const updatedProgress = await EvaluationProgress.findOneAndUpdate(
    {
      evaluationId: session.sessionId,
      userId: session.userId,
    },
    {
      $set: updatePayload,
    },
    { new: true }, // optional: returns the updated document
  );

  logger.debug(
    `updatedProgress: ${updatedProgress?.overallScore}, ${updatedProgress?.progress}`,
  );

  // Update assignee progress in the evaluation
  updateEvaluationProgress(
    session.sessionId ?? "",
    session.userId,
    updatedProgress?.progress ?? 10,
    updatedProgress?.timeSpent ?? 0,
    updatedProgress?.overallScore ?? 0,
  );

  return progress;
};

const updateChatEvaluationProgress = (
  progress: any,
  analysisResult: any,
  session: any,
  transcript: string,
) => {
  const updatedSummaries = [
    ...(progress.summaries ?? []),
    {
      content: analysisResult.summary,
      timestamp: new Date(),
      transcript: transcript,
      callId: session.sessionId,
    },
  ];

  const updatedProgress = analysisResult.progressPercentage;
  const updatedTimeSpent =
    (new Date().getTime() - session.startTime.getTime()) / 1000 +
    (progress.timeSpent || 0);

  const updatePayload: any = {
    summaries: updatedSummaries,
    progress: updatedProgress,
    timeSpent: updatedTimeSpent,
    lastAccessDate: new Date(),
    status: updatedProgress >= 100 ? "Completed" : "In Progress",
  };

  if (analysisResult.overallScore) {
    updatePayload.overallScore = analysisResult.overallScore;
  }

  if (analysisResult.improvementAreas) {
    updatePayload.improvementAreas = analysisResult.improvementAreas;
  }

  if (analysisResult.strengths) {
    updatePayload.strengths = analysisResult.strengths;
  }

  if (analysisResult.recommendation) {
    updatePayload.recommendation = analysisResult.recommendation;
  }

  if (analysisResult.nextSteps) {
    updatePayload.nextSteps = analysisResult.nextSteps;
  }

  return updatePayload;
};

const handleTrainingSession = async (
  session: any,
  transcript: string,
  timeSpent: number,
) => {
  logger.debug(`session: ${session}`);
  const progress = await TrainingProgress.findOne({
    sessionId: session.sessionId?.toString(),
    userId: session.userId?.toString(),
  });

  if (!progress) {
    throw new AppError("Progress not found", "PROGRESS_NOT_FOUND", 404);
  }
  let previousSummary = "";
  const length = progress.summaries.length;
  if (length > 0) {
    previousSummary = progress.summaries[length - 1].content;
  }

  const agent = session.agentId;

  const analysisResult = await analyzeTrainingTranscript(
    transcript,
    agent.content,
    previousSummary,
  );

  updateChatTrainingProgress(progress, analysisResult, session, transcript);
  await progress.save();

  await updateTraineeProgress(
    session.sessionId.toString(),
    session.userId,
    progress.progress,
    progress.timeSpent,
  );

  return progress;
};

const updateChatTrainingProgress = (
  progress: any,
  analysisResult: any,
  session: any,
  transcript: string,
) => {
  progress.summaries.push({
    content: analysisResult.summary,
    timestamp: new Date(),
    transcript: transcript,
    callId: session.sessionId,
  });

  progress.progress = analysisResult.progressPercentage;
  progress.timeSpent +=
    (new Date().getTime() - session.startTime.getTime()) / 1000;

  logger.info(`training timespent: ${progress.timeSpent}`);
  progress.lastAccessDate = new Date();

  if (analysisResult.topicsCovered) {
    progress.topicsCovered = analysisResult.topicsCovered;
  }

  if (analysisResult.conceptsUnderstood) {
    progress.conceptsUnderstood = analysisResult.conceptsUnderstood;
  }

  // Update status based on progress
  progress.status = progress.progress >= 100 ? "Completed" : "In Progress";
};

/**
 * Get a specific chat session by ID
 */
export const getChatSession = async (
  sessionId: string,
): Promise<IChatSession> => {
  try {
    const session = await ChatSession.findById(sessionId);
    if (!session) {
      throw new AppError(
        `Session not found with id: ${sessionId}`,
        "SESSION_NOT_FOUND",
        404,
      );
    }

    return session;
  } catch (error) {
    console.error("Error getting chat session:", error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to get chat session", "GET_SESSION_ERROR", 500);
  }
};

/**
 * List chat sessions for a user
 */
export const listUserChatSessions = async (
  userId: mongoose.Types.ObjectId,
  page = 1,
  limit = 10,
): Promise<{
  sessions: IChatSession[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  try {
    const skip = (page - 1) * limit;
    const total = await ChatSession.countDocuments({ userId });
    const totalPages = Math.ceil(total / limit);

    const sessions = await ChatSession.find({ userId })
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit);

    return {
      sessions,
      total,
      page,
      totalPages,
    };
  } catch (error) {
    console.error("Error listing chat sessions:", error);
    throw new AppError(
      "Failed to list chat sessions",
      "LIST_SESSIONS_ERROR",
      500,
    );
  }
};
