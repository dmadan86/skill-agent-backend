import mongoose from "mongoose";
import { Agent } from "../../../shared/models/Agent";
import {
  AgentNotFoundError,
  AgentAccessDeniedError,
} from "../../../shared/errors/AppError";
import {
  assignTrainees,
  removeTrainee,
} from "../../training/services/trainingSessionService";
import {
  assignUsers,
  removeAssignee,
} from "../../evaluation/services/evaluationService";
import { sendUnifiedAssignmentEmail } from "../../../shared/services/emailService";
import config from "../../../shared/config";
import User from "../../../shared/models/User";
import { generateEmailToken } from "../../../shared/services/tokenService";

// Define types locally since they're not in shared types
interface AssignTraineesData {
  userIds?: string[];
  departmentIds?: string[];
}

interface AssignUsersData {
  userIds?: string[];
  departmentIds?: string[];
}

export interface UnifiedAssignmentData {
  userIds?: string[];
  departmentIds?: string[];
}

export interface UnifiedAssignmentResponse {
  trainingSession: any;
  evaluationSession: any;
  agent: any;
}

/**
 * Unified service to assign users to both training and evaluation sessions
 */
export const assignUsersToAgent = async (
  agentId: string,
  userId: mongoose.Types.ObjectId,
  data: UnifiedAssignmentData,
): Promise<UnifiedAssignmentResponse> => {
  const agent = await Agent.findById(agentId);

  if (!agent) {
    throw new AgentNotFoundError();
  }

  if (!agent.owner.equals(userId)) {
    throw new AgentAccessDeniedError();
  }

  const results: UnifiedAssignmentResponse = {
    trainingSession: null,
    evaluationSession: null,
    agent: null,
  };

  // Assign to training session if it exists
  if (agent.trainingSessionId) {
    try {
      const trainingData: AssignTraineesData = {
        userIds: data.userIds,
        departmentIds: data.departmentIds,
      };
      results.trainingSession = await assignTrainees(
        agent.trainingSessionId.toString(),
        userId,
        trainingData,
      );
    } catch (error) {
      console.error("Error assigning to training session:", error);
      // Continue with evaluation even if training fails
    }
  }

  // Assign to evaluation session if it exists
  if (agent.evaluationSessionId) {
    try {
      const evaluationData: AssignUsersData = {
        userIds: data.userIds,
        departmentIds: data.departmentIds,
      };
      results.evaluationSession = await assignUsers(
        agent.evaluationSessionId.toString(),
        userId,
        evaluationData,
      );
    } catch (error) {
      console.error("Error assigning to evaluation session:", error);
      // Continue even if evaluation fails
    }
  }

  // Update agent with new user IDs
  if (data.userIds && data.userIds.length > 0) {
    const newUserIds = data.userIds.map(
      (id) => new mongoose.Types.ObjectId(id),
    );
    const existingUserIds = agent.userIds.map((id) => id.toString());

    for (const newUserId of newUserIds) {
      if (!existingUserIds.includes(newUserId.toString())) {
        agent.userIds.push(newUserId);
      }
    }

    await agent.save();
    results.agent = agent;
  }

  // Send unified email
  if (data.userIds && data.userIds.length > 0) {
    for (const assignedUserId of data.userIds) {
      const user = await User.findById(assignedUserId);
      if (user) {
        const passwordChangeRequired = user.passwordChangeRequired;
        const token = generateEmailToken(
          user._id.toString(),
          user.email,
          "magic_link_setup",
        );

        let trainingLink = results.trainingSession
          ? `${config.frontendUrl}/dashboard/my-training/${results.trainingSession._id}`
          : undefined;

        let evaluationLink = results.evaluationSession
          ? `${config.frontendUrl}/dashboard/my-evaluation/${results.evaluationSession._id}`
          : undefined;

        if (passwordChangeRequired && token) {
          const setPasswordUrl = `${config.frontendUrl}/set-password?token=${token}`;
          if (trainingLink) {
            trainingLink = `${setPasswordUrl}&redirect=${encodeURIComponent(trainingLink)}`;
          }
          if (evaluationLink) {
            // If training link also exists, it will be the primary redirect. Otherwise, use evaluation.
            const redirectUrl = trainingLink ? trainingLink : evaluationLink;
            evaluationLink = `${setPasswordUrl}&redirect=${encodeURIComponent(redirectUrl)}`;
          }
        }

        await sendUnifiedAssignmentEmail(user.email, {
          training: results.trainingSession
            ? {
                title: results.trainingSession.title,
                link: trainingLink as string,
              }
            : undefined,
          evaluation: results.evaluationSession
            ? {
                title: results.evaluationSession.title,
                link: evaluationLink as string,
              }
            : undefined,
        });
      }
    }
  }

  return results;
};

/**
 * Unified service to remove users from both training and evaluation sessions
 */
export const removeUsersFromAgent = async (
  agentId: string,
  userId: mongoose.Types.ObjectId,
  userToRemove: string,
): Promise<UnifiedAssignmentResponse> => {
  const agent = await Agent.findById(agentId);

  if (!agent) {
    throw new AgentNotFoundError();
  }

  if (!agent.owner.equals(userId)) {
    throw new AgentAccessDeniedError();
  }

  const results: UnifiedAssignmentResponse = {
    trainingSession: null,
    evaluationSession: null,
    agent: null,
  };

  // Remove from training session if it exists
  if (agent.trainingSessionId) {
    try {
      results.trainingSession = await removeTrainee(
        agent.trainingSessionId.toString(),
        userToRemove,
        userId,
      );
    } catch (error) {
      console.error("Error removing from training session:", error);
      // Continue with evaluation even if training fails
    }
  }

  // Remove from evaluation session if it exists
  if (agent.evaluationSessionId) {
    try {
      results.evaluationSession = await removeAssignee(
        agent.evaluationSessionId.toString(),
        userToRemove,
        userId,
      );
    } catch (error) {
      console.error("Error removing from evaluation session:", error);
      // Continue even if evaluation fails
    }
  }

  // Remove from agent's userIds
  agent.userIds = agent.userIds.filter((id) => id.toString() !== userToRemove);
  await agent.save();
  results.agent = agent;

  return results;
};
