// src/features/training/services/trainingSessionService.ts
import mongoose from "mongoose";
import {
  TrainingSession,
  ITrainingSession,
  ITrainee,
} from "../../../shared/models/TrainingSession";
import { Department } from "../../../shared/models/Department";
import { Agent } from "../../../shared/models/Agent";
import {
  TrainingSessionNotFoundError,
  TrainingSessionAccessDeniedError,
  DepartmentNotFoundError,
  NoTraineesSpecifiedError,
} from "../../../shared/errors/TrainingErrors";
import { AgentNotFoundError } from "../../../shared/errors/AppError";
import User from "../../../shared/models/User";
import { createTrainingProgress } from "./trainingProgressService";
import { TrainingProgress } from "../../../shared/models/TrainingProgress";
import {
  sendTrainingAssignmentEmail,
  sendTrainingReminderEmail,
} from "../../../shared/services/emailService";
import config from "../../../shared/config";
import logger from "../../../shared/utils/logger";
import {
  IActivityData,
  createActivityRecord,
} from "../../../shared/services/activityService";
import { useWebhookTrigger } from "../../../shared/services/webhookService";
import { UserMetricActivityService } from "../../../shared/services/userMetricActivityService";

interface CreateTrainingSessionData {
  title: string;
  agentId: string | mongoose.Types.ObjectId;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  userIds?: string[];
  departmentIds?: string[];
}

interface UpdateTrainingSessionData {
  title?: string;
  description?: string;
}

interface AssignTraineesData {
  userIds?: string[];
  departmentIds?: string[];
}

interface ListTrainingSessionsOptions {
  page?: number;
  limit?: number;
  status?: string;
  userId?: string;
}

/**
 * Create a new training session
 */
export const createTrainingSession = async (
  data: CreateTrainingSessionData,
): Promise<ITrainingSession> => {
  const { userIds, departmentIds, ...sessionData } = data;

  const agent = await Agent.findById(data.agentId);
  if (!agent) {
    throw new AgentNotFoundError();
  }

  const trainees = await getTraineesFromInputs(userIds, departmentIds);

  if (trainees.length === 0) {
    throw new NoTraineesSpecifiedError();
  }

  const session = new TrainingSession({
    ...sessionData,
    trainees,
  });

  let savedSession = await session.save();
  for (const trainee of trainees) {
    const progress = await createTrainingProgress({
      sessionId: savedSession._id as mongoose.Types.ObjectId,
      userId: trainee.userId,
      createdBy: data.createdBy,
    });

    // Update the trainee with the progressId
    const traineeIndex = savedSession.trainees.findIndex((t) =>
      t.userId.equals(trainee.userId),
    );
    if (traineeIndex !== -1 && progress._id) {
      savedSession.trainees[traineeIndex].progressId =
        progress._id as mongoose.Types.ObjectId;
    }

    const user = await User.findById(trainee.userId);
    if (user && user.role === "employee") {
      await sendTrainingAssignmentEmail(
        user.email,
        savedSession.title,
        `${config.frontendUrl}/dashboard/my-training/${savedSession._id}`,
      );
    }
  }

  // Save the session with updated progressIds
  savedSession = await savedSession.save();

  agent.trainingSessionsUsingAgent.push(
    savedSession._id as mongoose.Types.ObjectId,
  );
  await agent.save();

  // Populate user details before returning
  const populatedSession = await TrainingSession.findById(savedSession._id)
    .populate("agentId", "name type description industry")
    .populate("createdBy", "firstName lastName email")
    .populate(
      "trainees.userId",
      "firstName lastName email position department",
    );

  if (!populatedSession) {
    throw new TrainingSessionNotFoundError();
  }

  // Trigger webhook for training started
  await useWebhookTrigger(
    "training.started",
    {
      sessionId: savedSession._id,
      title: savedSession.title,
      agentId: savedSession.agentId,
      createdBy: savedSession.createdBy,
    },
    data.createdBy.toString(),
  );

  return populatedSession;
};

/**
 * Update an existing training session
 */
export const updateTrainingSession = async (
  id: string,
  userId: mongoose.Types.ObjectId,
  data: UpdateTrainingSessionData,
): Promise<ITrainingSession> => {
  const session = await TrainingSession.findById(id);

  if (!session) {
    throw new TrainingSessionNotFoundError();
  }

  // Check if user is the creator of the session
  if (!session.createdBy.equals(userId)) {
    throw new TrainingSessionAccessDeniedError();
  }

  if (
    session.trainees.some((t) => t.status !== "Not Started") &&
    (data.title || data.description)
  ) {
    throw new Error("Cannot update session with trainees in progress");
  }

  // Apply updates
  Object.assign(session, data);

  let savedSession = await session.save();
  // Populate user details before returning
  const populatedSession = await TrainingSession.findById(savedSession._id)
    .populate("agentId", "name type description industry")
    .populate("createdBy", "firstName lastName email")
    .populate(
      "trainees.userId",
      "firstName lastName email position department",
    );

  if (!populatedSession) {
    throw new TrainingSessionNotFoundError();
  }

  return populatedSession;
};

/**
 * Get a training session by ID
 */
export const getTrainingSessionById = async (
  id: string,
  userId: mongoose.Types.ObjectId,
): Promise<ITrainingSession> => {
  const session = await TrainingSession.findById(id)
    .populate("agentId", "name type description industry")
    .populate("createdBy", "firstName lastName email")
    .populate(
      "trainees.userId",
      "firstName lastName email position department",
    );

  if (!session) {
    throw new TrainingSessionNotFoundError();
  }

  // Check if user is the creator or a trainee in the session
  const isCreator = session.createdBy._id.equals(userId);
  const isTrainee = session.trainees.some((t) => t.userId._id.equals(userId));

  if (!isCreator && !isTrainee) {
    throw new TrainingSessionAccessDeniedError();
  }

  return session;
};

/**
 * Delete a training session
 */
export const deleteTrainingSession = async (
  id: string,
  userId: mongoose.Types.ObjectId,
): Promise<void> => {
  const session = await TrainingSession.findById(id);

  if (!session) {
    throw new TrainingSessionNotFoundError();
  }

  if (!session.createdBy.equals(userId)) {
    throw new TrainingSessionAccessDeniedError();
  }

  await TrainingProgress.deleteMany({ sessionId: id });

  await TrainingSession.findByIdAndDelete(id);
};

/**
 * Assign trainees to a training session
 */
export const assignTrainees = async (
  id: string,
  userId: mongoose.Types.ObjectId,
  data: AssignTraineesData,
): Promise<ITrainingSession> => {
  const session = await TrainingSession.findById(id);

  if (!session) {
    throw new TrainingSessionNotFoundError();
  }

  // Check if user is the creator of the session
  if (!session.createdBy.equals(userId)) {
    throw new TrainingSessionAccessDeniedError();
  }

  // Get new trainees
  const newTrainees = await getTraineesFromInputs(
    data.userIds,
    data.departmentIds,
  );

  if (newTrainees.length === 0) {
    throw new NoTraineesSpecifiedError();
  }

  // Add trainees that don't already exist in the session
  const existingUserIds = session.trainees.map((t) => t.userId.toString());

  for (const trainee of newTrainees) {
    const traineeId = trainee.userId.toString();
    if (!existingUserIds.includes(traineeId)) {
      session.trainees.push(trainee);
    }
  }

  // Save the session first to ensure it has the updated trainees
  let savedSession = await session.save();

  // Create training progress for each new trainee and update their progressId
  for (const trainee of newTrainees) {
    const traineeId = trainee.userId.toString();
    if (!existingUserIds.includes(traineeId)) {
      // Create progress for this trainee
      const progress = await createTrainingProgress({
        sessionId: savedSession._id as mongoose.Types.ObjectId,
        userId: trainee.userId,
        createdBy: userId,
      });

      // Update the trainee with the progressId
      const traineeIndex = savedSession.trainees.findIndex((t) =>
        t.userId.equals(trainee.userId),
      );

      if (traineeIndex !== -1 && progress._id) {
        savedSession.trainees[traineeIndex].progressId =
          progress._id as mongoose.Types.ObjectId;
      }
    }
  }

  // Save the session again with the updated progressIds
  savedSession = await savedSession.save();

  // Populate user details before returning
  const populatedSession = await TrainingSession.findById(savedSession._id)
    .populate("agentId", "name type description industry")
    .populate("createdBy", "firstName lastName email")
    .populate(
      "trainees.userId",
      "firstName lastName email position department",
    );

  if (!populatedSession) {
    throw new TrainingSessionNotFoundError();
  }

  return populatedSession;
};

export const assignIndividualTrainees = async (
  id: string,
  userId: mongoose.Types.ObjectId,
): Promise<ITrainingSession> => {
  const session = await TrainingSession.findById(id);

  if (!session) {
    throw new TrainingSessionNotFoundError();
  }

  // Get new trainees
  const newTrainees = await getTraineesFromInputs([userId.toString()], []);

  if (newTrainees.length === 0) {
    throw new NoTraineesSpecifiedError();
  }

  // Add trainees that don't already exist in the session
  const existingUserIds = session.trainees.map((t) => t.userId.toString());

  const agent = await Agent.findById(session.agentId);

  for (const trainee of newTrainees) {
    const traineeId = trainee.userId.toString();
    if (!existingUserIds.includes(traineeId)) {
      session.trainees.push(trainee);
    }
  }

  for (const trainee of newTrainees) {
    const traineeId = trainee.userId.toString();
    if (!existingUserIds.includes(traineeId)) {
      agent?.userIds.push(trainee.userId);
    }
  }

  await agent?.save();

  // Save the session first to ensure it has the updated trainees
  let savedSession = await session.save();

  // Create training progress for each new trainee and update their progressId
  for (const trainee of newTrainees) {
    const traineeId = trainee.userId.toString();
    if (!existingUserIds.includes(traineeId)) {
      // Create progress for this trainee
      const progress = await createTrainingProgress({
        sessionId: savedSession._id as mongoose.Types.ObjectId,
        userId: trainee.userId,
        createdBy: userId,
      });

      // Update the trainee with the progressId
      const traineeIndex = savedSession.trainees.findIndex((t) =>
        t.userId.equals(trainee.userId),
      );

      if (traineeIndex !== -1 && progress._id) {
        savedSession.trainees[traineeIndex].progressId =
          progress._id as mongoose.Types.ObjectId;
      }
    }
  }

  // Save the session again with the updated progressIds
  savedSession = await savedSession.save();

  // Populate user details before returning
  const populatedSession = await TrainingSession.findById(savedSession._id)
    .populate("agentId", "name type description industry")
    .populate("createdBy", "firstName lastName email")
    .populate(
      "trainees.userId",
      "firstName lastName email position department",
    );

  if (!populatedSession) {
    throw new TrainingSessionNotFoundError();
  }

  return populatedSession;
};

/**
 * Remove a trainee from a training session
 */
export const removeTrainee = async (
  sessionId: string,
  traineeId: string,
  userId: mongoose.Types.ObjectId,
): Promise<ITrainingSession> => {
  const session = await TrainingSession.findById(sessionId);

  if (!session) {
    throw new TrainingSessionNotFoundError();
  }

  // Check if user is the creator of the session
  if (!session.createdBy.equals(userId)) {
    throw new TrainingSessionAccessDeniedError();
  }

  // Remove the trainee

  const traineeIndex = session.trainees.findIndex((t) =>
    t.userId.equals(traineeId),
  );
  if (traineeIndex === -1) {
    throw new Error("User is not a trainee in this session");
  }

  session.trainees.splice(traineeIndex, 1);

  let progress = await TrainingProgress.findOne({
    sessionId: sessionId,
    userId: traineeId,
  });
  if (progress) {
    await progress.deleteOne();
  }

  let savedSession = await session.save();
  // Populate user details before returning
  const populatedSession = await TrainingSession.findById(savedSession._id)
    .populate("agentId", "name type description industry")
    .populate("createdBy", "firstName lastName email")
    .populate(
      "trainees.userId",
      "firstName lastName email position department",
    );

  if (!populatedSession) {
    throw new TrainingSessionNotFoundError();
  }

  return populatedSession;
};

/**
 * List training sessions with pagination and filtering
 */
export const listTrainingSessions = async (
  options: ListTrainingSessionsOptions,
): Promise<{
  sessions: ITrainingSession[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const { page = 1, limit = 10, status, userId } = options;

  const query: any = {};

  // Add filters if provided
  if (status) query["trainees.status"] = status;
  if (userId) {
    const user = await User.findById(userId);
    if (user?.role === "manager" || user?.role === "admin") {
      query.createdBy = userId;
    } else {
      query["trainees.userId"] = userId;
    }
  }

  const total = await TrainingSession.countDocuments(query);
  const totalPages = Math.ceil(total / limit);

  const sessions = await TrainingSession.find(query)
    .populate("agentId", "name type description industry")
    .populate("createdBy", "firstName lastName email")
    .populate(
      "trainees.userId",
      "firstName lastName email position department progressId",
    )
    .sort({ updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    sessions,
    total,
    page,
    limit,
    totalPages,
  };
};

/**
 * Update trainee status and progress in a session
 */
export const updateTraineeProgress = async (
  sessionId: string,
  userId: mongoose.Types.ObjectId,
  progress: number,
  timeSpent: number,
): Promise<ITrainingSession> => {
  logger.info(`sessionId : ${sessionId}`);
  const session = await TrainingSession.findById(sessionId);

  if (!session) {
    throw new TrainingSessionNotFoundError();
  }

  // Find the trainee
  const traineeIndex = session.trainees.findIndex((t) =>
    t.userId.equals(userId),
  );

  if (traineeIndex === -1) {
    throw new Error("User is not a trainee in this session");
  }

  // Update the trainee's progress
  const trainee = session.trainees[traineeIndex];
  trainee.progress = progress;
  trainee.timeSpent += timeSpent;
  trainee.lastAccessDate = new Date();

  // Update status based on progress
  if (progress >= 100) {
    trainee.status = "Completed";
    trainee.completedDate = new Date();

    // Trigger webhook for training completed
    await useWebhookTrigger(
      "training.completed",
      {
        sessionId,
        userId,
        progress,
        timeSpent,
      },
      userId.toString(),
    );
  } else if (progress > 0) {
    trainee.status = "In Progress";
  }

  session.trainees[traineeIndex] = trainee;
  let savedSession = await session.save();
  // Populate user details before returning
  const populatedSession = await TrainingSession.findById(savedSession._id)
    .populate("agentId", "name type description industry")
    .populate("createdBy", "firstName lastName email")
    .populate(
      "trainees.userId",
      "firstName lastName email position department",
    );

  if (!populatedSession) {
    throw new TrainingSessionNotFoundError();
  }

  const user = await User.findById(userId);
  const activityData: IActivityData = {
    userId: userId.toString(),
    username: user?.firstName + " " + user?.lastName,
    managerId: session.createdBy.toString(),
    activityType: "TRAINING",
    metric: progress,
    sessionTitle: session.title,
  };
  await createActivityRecord(activityData);

  // Track user metric activity
  await UserMetricActivityService.createActivity({
    userId: userId.toString(),
    activityType:
      progress >= 100
        ? "training_completed"
        : progress > 0
          ? "training_progress"
          : "training_started",
    feature: "training",
    metadata: {
      sessionId: (session._id as any).toString(),
      sessionTitle: session.title,
      progress,
      timeSpent,
    },
    status: "success",
    duration: timeSpent,
  });

  return populatedSession;
};

/**
 * Helper function to extract trainees from u ser IDs and departments
 */
const getTraineesFromInputs = async (
  userIds?: string[],
  departmentIds?: string[],
): Promise<ITrainee[]> => {
  const uniqueUserIds = new Set<string>();

  // Add individual users
  addIndividualUsers(uniqueUserIds, userIds);

  // Add department members
  await addDepartmentMembers(uniqueUserIds, departmentIds);

  // Create trainee entries for each unique user
  return await createTraineeEntries(uniqueUserIds);
};

const addIndividualUsers = (
  uniqueUserIds: Set<string>,
  userIds?: string[],
): void => {
  if (userIds?.length) {
    userIds.forEach((id) => uniqueUserIds.add(id));
  }
};

const addDepartmentMembers = async (
  uniqueUserIds: Set<string>,
  departmentIds?: string[],
): Promise<void> => {
  if (!departmentIds?.length) return;

  for (const depId of departmentIds) {
    const department = await Department.findById(depId);

    if (!department) {
      throw new DepartmentNotFoundError();
    }

    department.members.forEach((memberId) => {
      uniqueUserIds.add(memberId.toString());
    });
  }
};

const createTraineeEntries = async (
  uniqueUserIds: Set<string>,
): Promise<ITrainee[]> => {
  const trainees: ITrainee[] = [];

  for (const userId of uniqueUserIds) {
    const userExists = await User.findById(userId);
    if (userExists) {
      trainees.push(createTraineeEntry(userId));
    }
  }

  return trainees;
};

const createTraineeEntry = (userId: string): ITrainee => {
  const now = new Date();
  return {
    userId: new mongoose.Types.ObjectId(userId),
    status: "Not Started",
    progressId: new mongoose.Types.ObjectId(),
    progress: 0,
    lastAccessDate: now,
    timeSpent: 0,
    assignedDate: now,
  };
};

export const sendMemberReminder = async (
  userId: string,
  requesterId: string,
): Promise<void> => {
  // Get user details
  const user = await User.findById(userId);
  logger.info(`user : ${user}`);
  if (!user) {
    throw new Error("User not found");
  }

  // Get the training session for this user
  const session = await TrainingSession.findOne({
    "trainees.userId": userId,
  });

  const trainingTitle = session?.title || "";
  const assignedDate = session?.createdAt?.toISOString() || "";

  logger.info(`session : ${session}`);

  if (!session) {
    throw new Error("No training session found for this user");
  }

  // Create the training link
  const trainingLink = `${config.frontendUrl}/dashboard/my-training/${session._id}`;

  await sendTrainingReminderEmail(
    trainingTitle,
    assignedDate,
    user.email,
    `${user.firstName} ${user.lastName}`,
    trainingLink,
  );

  logger.info(`Reminder sent for training session to user ${user.email}`);
};
