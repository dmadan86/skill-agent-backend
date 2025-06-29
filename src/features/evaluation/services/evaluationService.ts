// src/features/evaluation/services/evaluationService.ts
import mongoose from "mongoose";
import {
  Evaluation,
  IEvaluation,
  IEvaluationAssignee,
} from "../../../shared/models/Evaluation";
import { Department } from "../../../shared/models/Department";
import { Agent } from "../../../shared/models/Agent";
import User from "../../../shared/models/User";

import {
  EvaluationNotFoundError,
  EvaluationAccessDeniedError,
  AssigneeNotFoundError,
  EvaluationInProgressError,
} from "../../../shared/errors/EvaluationErrors";
import { AgentNotFoundError, AppError } from "../../../shared/errors/AppError";
import { createEvaluationProgress } from "./evaluationProgressService";
import { EvaluationProgress } from "../../../shared/models/EvaluationProgress";
import { sendEvaluationAssignmentEmail } from "../../../shared/services/emailService";
import config from "../../../shared/config";
import logger from "../../../shared/utils/logger";
import {
  IActivityData,
  createActivityRecord,
} from "../../../shared/services/activityService";
import { UserMetricActivityService } from "../../../shared/services/userMetricActivityService";

interface CreateEvaluationData {
  title: string;
  agentId: string | mongoose.Types.ObjectId;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  userIds?: string[];
  departmentIds?: string[];
}

interface UpdateEvaluationData {
  title?: string;
  description?: string;
}

interface AssignUsersData {
  userIds?: string[];
  departmentIds?: string[];
}

interface ListEvaluationsOptions {
  page?: number;
  limit?: number;
  status?: string;
  userId?: string;
}

/**
 * Create a new evaluation
 */
export const createEvaluation = async (
  data: CreateEvaluationData,
): Promise<IEvaluation> => {
  const { userIds, departmentIds, ...evaluationData } = data;

  const agent = await Agent.findById(data.agentId);
  if (!agent) {
    throw new AgentNotFoundError();
  }

  const assignees = await getAssigneesFromInputs(userIds, departmentIds);

  if (assignees.length === 0) {
    throw new Error("No assignees specified for the evaluation");
  }

  const evaluation = new Evaluation({
    ...evaluationData,
    assignees,
    status: "Pending",
  });

  let savedEvaluation = await evaluation.save();
  for (const assignee of assignees) {
    const progress = await createEvaluationProgress({
      evaluationId: savedEvaluation._id as mongoose.Types.ObjectId,
      userId: assignee.userId,
      createdBy: data.createdBy,
    });

    // Update the assignee with the progressId
    const assigneeIndex = savedEvaluation.assignees.findIndex((a) =>
      a.userId.equals(assignee.userId),
    );
    if (assigneeIndex !== -1 && progress._id) {
      savedEvaluation.assignees[assigneeIndex].progressId =
        progress._id as mongoose.Types.ObjectId;
    }

    const user = await User.findById(assignee.userId);
    if (user) {
      await sendEvaluationAssignmentEmail(
        user.email,
        savedEvaluation.title,
        `${config.frontendUrl}/dashboard/my-evaluation/${savedEvaluation._id}`,
      );
    }
  }

  // Save the evaluation with updated progressIds
  savedEvaluation = await savedEvaluation.save();

  agent.evaluationSessionsUsingAgent.push(
    savedEvaluation._id as mongoose.Types.ObjectId,
  );
  await agent.save();

  // Populate user details before returning
  const populatedEvaluation = await Evaluation.findById(savedEvaluation._id)
    .populate("agentId", "name type description industry")
    .populate("createdBy", "firstName lastName email")
    .populate(
      "assignees.userId",
      "firstName lastName email position department",
    );

  if (!populatedEvaluation) {
    throw new EvaluationNotFoundError();
  }

  return populatedEvaluation;
};

/**
 * Update an existing evaluation
 */
export const updateEvaluation = async (
  id: string,
  userId: mongoose.Types.ObjectId,
  data: UpdateEvaluationData,
): Promise<IEvaluation> => {
  const evaluation = await Evaluation.findById(id);

  if (!evaluation) {
    throw new EvaluationNotFoundError();
  }

  if (!evaluation.createdBy.equals(userId)) {
    throw new EvaluationAccessDeniedError();
  }

  if (evaluation.status !== "Pending" && (data.title || data.description)) {
    throw new EvaluationInProgressError();
  }

  Object.assign(evaluation, data);

  const savedEvaluation = await evaluation.save();

  const populatedEvaluation = await Evaluation.findById(savedEvaluation._id)
    .populate("agentId", "name type description industry")
    .populate("createdBy", "firstName lastName email")
    .populate(
      "assignees.userId",
      "firstName lastName email position department",
    );

  if (!populatedEvaluation) {
    throw new EvaluationNotFoundError();
  }

  return populatedEvaluation;
};

/**
 * Get an evaluation by ID
 */
export const getEvaluationById = async (
  id: string,
  userId: mongoose.Types.ObjectId,
): Promise<IEvaluation> => {
  const evaluation = await Evaluation.findById(id)
    .populate("agentId", "name type description industry")
    .populate("createdBy", "firstName lastName email")
    .populate(
      "assignees.userId",
      "firstName lastName email position department",
    );

  if (!evaluation) {
    throw new EvaluationNotFoundError();
  }

  const isCreator = evaluation.createdBy._id.equals(userId);
  const isAssignee = evaluation.assignees.some((a) =>
    a.userId._id.equals(userId),
  );

  if (!isCreator && !isAssignee) {
    throw new EvaluationAccessDeniedError();
  }

  return evaluation;
};

/**
 * Delete an evaluation
 */
export const deleteEvaluation = async (
  id: string,
  userId: mongoose.Types.ObjectId,
): Promise<void> => {
  const evaluation = await Evaluation.findById(id);

  if (!evaluation) {
    throw new EvaluationNotFoundError();
  }

  if (!evaluation.createdBy.equals(userId)) {
    throw new EvaluationAccessDeniedError();
  }

  await EvaluationProgress.deleteMany({ evaluationId: id });

  await Evaluation.findByIdAndDelete(id);
};

/**
 * Assign users to an evaluation
 */
export const assignUsers = async (
  id: string,
  userId: mongoose.Types.ObjectId,
  data: AssignUsersData,
): Promise<IEvaluation> => {
  const evaluation = await Evaluation.findById(id);

  if (!evaluation) {
    throw new EvaluationNotFoundError();
  }

  // Check if user is the creator of the evaluation
  if (!evaluation.createdBy.equals(userId)) {
    throw new EvaluationAccessDeniedError();
  }

  // update status to in progress if evaluation is completed
  if (evaluation.status === "Completed") {
    evaluation.status = "In Progress";
  }

  // Get new assignees
  const newAssignees = await getAssigneesFromInputs(
    data.userIds,
    data.departmentIds,
  );

  if (newAssignees.length === 0) {
    throw new Error("No assignees specified");
  }

  // Add assignees that don't already exist in the evaluation
  const existingUserIds = evaluation.assignees.map((a) => a.userId.toString());

  for (const assignee of newAssignees) {
    const assigneeId = assignee.userId.toString();
    if (!existingUserIds.includes(assigneeId)) {
      evaluation.assignees.push(assignee);
    }
  }

  let savedEvaluation = await evaluation.save();

  // Create evaluation progress for each new assignee
  for (const assignee of newAssignees) {
    const assigneeId = assignee.userId.toString();
    if (!existingUserIds.includes(assigneeId)) {
      const progress = await createEvaluationProgress({
        evaluationId: savedEvaluation._id as mongoose.Types.ObjectId,
        userId: assignee.userId,
        createdBy: userId,
      });

      // Update the assignee with the progressId
      const assigneeIndex = savedEvaluation.assignees.findIndex((a) =>
        a.userId.equals(assignee.userId),
      );

      if (assigneeIndex !== -1 && progress._id) {
        savedEvaluation.assignees[assigneeIndex].progressId =
          progress._id as mongoose.Types.ObjectId;
      }
    }
  }

  // Save the evaluation again with updated progressIds
  savedEvaluation = await savedEvaluation.save();

  // Populate user details before returning
  const populatedEvaluation = await Evaluation.findById(savedEvaluation._id)
    .populate("agentId", "name type description industry")
    .populate("createdBy", "firstName lastName email")
    .populate(
      "assignees.userId",
      "firstName lastName email position department",
    );

  if (!populatedEvaluation) {
    throw new EvaluationNotFoundError();
  }

  return populatedEvaluation;
};

export const assignIndividualUsersToEvaluation = async (
  id: string,
  userId: mongoose.Types.ObjectId,
): Promise<IEvaluation> => {
  const evaluation = await Evaluation.findById(id);

  if (!evaluation) {
    throw new EvaluationNotFoundError();
  }

  // update status to in progress if evaluation is completed
  if (evaluation.status === "Completed") {
    evaluation.status = "In Progress";
  }

  // Get new assignees
  const newAssignees = await getAssigneesFromInputs([userId.toString()], []);

  if (newAssignees.length === 0) {
    throw new Error("No assignees specified");
  }

  // Add assignees that don't already exist in the evaluation
  const existingUserIds = evaluation.assignees.map((a) => a.userId.toString());

  for (const assignee of newAssignees) {
    const assigneeId = assignee.userId.toString();
    if (!existingUserIds.includes(assigneeId)) {
      evaluation.assignees.push(assignee);
    }
  }

  let savedEvaluation = await evaluation.save();

  // Only create progress for newly added assignees
  for (const assignee of newAssignees) {
    const assigneeId = assignee.userId.toString();
    if (!existingUserIds.includes(assigneeId)) {
      const progress = await createEvaluationProgress({
        evaluationId: savedEvaluation._id as mongoose.Types.ObjectId,
        userId: assignee.userId,
        createdBy: userId,
      });

      // Update the assignee with the progressId
      const assigneeIndex = savedEvaluation.assignees.findIndex((a) =>
        a.userId.equals(assignee.userId),
      );
      if (assigneeIndex !== -1 && progress._id) {
        savedEvaluation.assignees[assigneeIndex].progressId =
          progress._id as mongoose.Types.ObjectId;
      }
    }
  }

  // Save the evaluation with updated progressIds
  savedEvaluation = await savedEvaluation.save();

  // Populate user details before returning
  const populatedEvaluation = await Evaluation.findById(savedEvaluation._id)
    .populate("agentId", "name type description industry")
    .populate("createdBy", "firstName lastName email")
    .populate(
      "assignees.userId",
      "firstName lastName email position department",
    );

  if (!populatedEvaluation) {
    throw new EvaluationNotFoundError();
  }

  return populatedEvaluation;
};

/**
 * Remove an assignee from an evaluation
 */
export const removeAssignee = async (
  evaluationId: string,
  assigneeId: string,
  userId: mongoose.Types.ObjectId,
): Promise<IEvaluation> => {
  const evaluation = await Evaluation.findById(evaluationId);

  if (!evaluation) {
    throw new EvaluationNotFoundError();
  }

  if (!evaluation.createdBy.equals(userId)) {
    throw new EvaluationAccessDeniedError();
  }

  const assigneeIndex = evaluation.assignees.findIndex(
    (a) => a.userId.toString() === assigneeId,
  );

  if (assigneeIndex === -1) {
    throw new AssigneeNotFoundError();
  }

  evaluation.assignees.splice(assigneeIndex, 1);

  let progress = await EvaluationProgress.findOne({
    evaluationId: evaluationId,
    userId: assigneeId,
  });
  if (progress) {
    await progress.deleteOne();
  }

  updateEvaluationStatus(evaluation);

  const savedEvaluation = await evaluation.save();

  // Populate user details before returning
  const populatedEvaluation = await Evaluation.findById(savedEvaluation._id)
    .populate("agentId", "name type description industry")
    .populate("createdBy", "firstName lastName email")
    .populate(
      "assignees.userId",
      "firstName lastName email position department",
    );

  if (!populatedEvaluation) {
    throw new EvaluationNotFoundError();
  }

  return populatedEvaluation;
};

/**
 * List evaluations with pagination and filtering
 */
export const listEvaluations = async (
  options: ListEvaluationsOptions,
): Promise<{
  evaluations: IEvaluation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const { page = 1, limit = 10, status, userId } = options;

  const query: any = {};

  // Add filters if provided
  if (status) query["assignees.status"] = status;
  if (userId) {
    const user = await User.findById(userId);
    if (user?.role === "manager" || user?.role === "admin") {
      query.createdBy = userId;
    } else {
      query["assignees.userId"] = userId;
    }
  }

  const total = await Evaluation.countDocuments(query);
  const totalPages = Math.ceil(total / limit);

  const evaluations = await Evaluation.find(query)
    .populate("agentId", "name type description industry")
    .populate("createdBy", "firstName lastName email")
    .populate(
      "assignees.userId",
      "firstName lastName email position department progressId",
    )
    .sort({ updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  logger.debug("evaluations: " + JSON.stringify(evaluations));
  return {
    evaluations,
    total,
    page,
    limit,
    totalPages,
  };
};

/**
 * Update evaluation progress after a session
 */
export const updateEvaluationProgress = async (
  evaluationId: string,
  userId: mongoose.Types.ObjectId,
  progress: number,
  timeSpent: number,
  overallScore: number,
): Promise<IEvaluation> => {
  // Verify evaluation exists and user is assigned to it
  const evaluation =
    await Evaluation.findById(evaluationId).populate("agentId");

  if (!evaluation) {
    throw new EvaluationNotFoundError();
  }

  // Find the assignee
  const assigneeIndex = evaluation.assignees.findIndex((a) =>
    a.userId.equals(userId),
  );

  if (assigneeIndex === -1) {
    throw new AssigneeNotFoundError();
  }

  const assignee: IEvaluationAssignee = evaluation.assignees[assigneeIndex];

  // Update assignee's last access date and time spent
  assignee.lastAccessDate = new Date();
  assignee.timeSpent = timeSpent;
  assignee.progress = progress;

  if (progress >= 100) {
    assignee.status = "Completed";
    assignee.completedDate = new Date();
  } else if (progress > 0) {
    assignee.status = "In Progress";
  }

  evaluation.assignees[assigneeIndex] = assignee;

  const savedEvaluation = await evaluation.save();

  // Populate user details before returning
  const populatedEvaluation = await Evaluation.findById(savedEvaluation._id)
    .populate("agentId", "name type description industry")
    .populate("createdBy", "firstName lastName email")
    .populate(
      "assignees.userId",
      "firstName lastName email position department",
    );

  if (!populatedEvaluation) {
    throw new EvaluationNotFoundError();
  }

  const user = await User.findById(userId);

  const activityData: IActivityData = {
    userId: userId.toString(),
    username: user?.firstName + " " + user?.lastName,
    managerId: evaluation.createdBy.toString(),
    activityType: "EVALUATION",
    metric: overallScore ?? 33,
    sessionTitle: evaluation.title,
  };

  await createActivityRecord(activityData);

  // Track user metric activity
  await UserMetricActivityService.createActivity({
    userId: userId.toString(),
    activityType:
      progress >= 100
        ? "evaluation_completed"
        : progress > 0
          ? "evaluation_progress"
          : "evaluation_started",
    feature: "evaluation",
    metadata: {
      evaluationId: (
        populatedEvaluation as IEvaluation & { _id: mongoose.Types.ObjectId }
      )._id.toString(),
      evaluationTitle: populatedEvaluation.title,
      progress,
      timeSpent,
      overallScore,
      previousProgress: assignee.progress,
    },
    status: "success",
    duration: timeSpent,
  });

  return populatedEvaluation;
};

/**
 * Get evaluation overview with assignee details
 */
export const getEvaluationOverview = async (
  evaluationId: string,
  userId: mongoose.Types.ObjectId,
): Promise<{
  evaluation: any;
  assignee: IEvaluationAssignee | null;
  user: any;
}> => {
  // Get evaluation with populated fields
  const evaluation = await Evaluation.findById(evaluationId)
    .populate("agentId", "name type description industry content")
    .populate("createdBy", "firstName lastName email")
    .populate(
      "assignees.userId",
      "firstName lastName email position department",
    );

  if (!evaluation) {
    throw new EvaluationNotFoundError();
  }

  // Check if user is the creator or an assignee
  const isCreator = evaluation.createdBy._id.equals(userId);
  const assigneeIndex = evaluation.assignees.findIndex((a) =>
    a.userId._id.equals(userId),
  );
  const isAssignee = assigneeIndex !== -1;

  if (!isCreator && !isAssignee) {
    throw new EvaluationAccessDeniedError();
  }

  // Get assignee and user info if user is an assignee
  let assignee = null;
  let user = null;

  if (isAssignee) {
    assignee = evaluation.assignees[assigneeIndex];
    user = assignee.userId;
  }

  return {
    evaluation,
    assignee,
    user,
  };
};

/**
 * Helper function to extract assignees from user IDs and departments
 */
const getAssigneesFromInputs = async (
  userIds?: string[],
  departmentIds?: string[],
): Promise<IEvaluationAssignee[]> => {
  const uniqueUserIds = new Set<string>();

  addIndividualUsers(uniqueUserIds, userIds);

  await addDepartmentMembers(uniqueUserIds, departmentIds);

  return await createAssigneeEntries(uniqueUserIds);
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
      throw new AppError(
        `Department with ID ${depId} not found`,
        "DEPARTMENT_NOT_FOUND",
        404,
      );
    }

    department.members.forEach((memberId) => {
      uniqueUserIds.add(memberId.toString());
    });
  }
};

const createAssigneeEntries = async (
  uniqueUserIds: Set<string>,
): Promise<IEvaluationAssignee[]> => {
  const assignees: IEvaluationAssignee[] = [];

  for (const userId of uniqueUserIds) {
    const user = await User.findById(userId);
    if (user) {
      assignees.push(createAssigneeEntry(userId));
    }
  }

  return assignees;
};

const createAssigneeEntry = (userId: string): IEvaluationAssignee => {
  return {
    userId: new mongoose.Types.ObjectId(userId),
    status: "Pending",
    progressId: new mongoose.Types.ObjectId(),
    progress: 0,
    timeSpent: 0,
  };
};
/**
 * Helper function to update evaluation status based on assignee statuses
 */
function updateEvaluationStatus(evaluation: IEvaluation): void {
  if (evaluation.assignees.length === 0) {
    evaluation.status = "Pending";
    return;
  }

  if (evaluation.assignees.every((a) => a.status === "Completed")) {
    evaluation.status = "Completed";
  } else if (evaluation.assignees.some((a) => a.status === "In Progress")) {
    evaluation.status = "In Progress";
  } else {
    evaluation.status = "Pending";
  }
}
