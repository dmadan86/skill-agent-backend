// src/features/agents/services/agentService.ts
import mongoose from "mongoose";
import { Agent, IAgent } from "../../../shared/models/Agent";
import {
  AgentNotFoundError,
  AgentAccessDeniedError,
  DuplicateAgentNameError
} from "../../../shared/errors/AppError";
import {
  createRetellAgent,
  deleteRetellAgent,
  updateRetellAgent,
} from "../../../shared/services/retellAgentService";
import { deleteTrainingSession } from "../../training/services/trainingSessionService";
import { deleteEvaluation } from "../../evaluation/services/evaluationService";
import logger from "../../../shared/utils/logger";
import { useWebhookTrigger } from "../../../shared/services/webhookService";
import { cancelDelayedRepeatingJob, scheduleDelayedRepeatingJob } from "../../../shared/services/schedulerService";
import User from "../../../shared/models/User";
import { sendTrainingReminderEmail } from "../../../shared/services/emailService";
import config from "../../../shared/config";
import { getIndividualUserTrainingProgress } from "../../training/services/trainingProgressService";
import { getIndividualUserEvaluationProgress } from "../../evaluation/services/evaluationProgressService";
interface CreateAgentData {
  name: string;
  type: string;
  description: string;
  industry: string;
  content: string;
  instructions?: string;
  owner: mongoose.Types.ObjectId;
  userIds?: string[];
  departmentIds?: string[];
}

interface UpdateAgentData {
  name?: string;
  type?: string;
  description?: string;
  industry?: string;
  content?: string;
  instructions?: string;
  userIds?: string[];
  departmentIds?: string[];
  trainingSessionId?: string;
  evaluationSessionId?: string;
}

interface ListAgentsOptions {
  page?: number;
  limit?: number;
  type?: string;
  industry?: string;
  owner?: mongoose.Types.ObjectId;
}
/**
 * Create a new agent
 */
export const createAgent = async (data: CreateAgentData): Promise<IAgent> => {
  const existingAgent = await Agent.findOne({
    name: data.name,
    owner: data.owner,
  });
  if (existingAgent) {
    throw new DuplicateAgentNameError();
  }
  try {
    const agent = new Agent(data);

    const retellAgent = await Promise.all([
      createRetellAgent(agent, "TRAINING"),
      createRetellAgent(agent, "EVALUATION"),
      createRetellAgent(agent, "QUICK_PREP"),
    ]);

    agent.retellTrainingLlmId = retellAgent[0].retellLlmId;
    agent.retellEvaluationLlmId = retellAgent[1].retellLlmId;
    agent.retellQuickPrepLlmId = retellAgent[2].retellLlmId;
    agent.retellTrainingAgentId = retellAgent[0].retellAgentId;
    agent.retellEvaluationAgentId = retellAgent[1].retellAgentId;
    agent.retellQuickPrepAgentId = retellAgent[2].retellAgentId;

    logger.info(`trainingPrompt: ${retellAgent[0].prompt}`);

    agent.trainingPrompt = retellAgent[0].prompt;
    agent.evaluationPrompt = retellAgent[1].prompt;
    agent.quickPrepPrompt = retellAgent[2].prompt;

    const savedAgent = await agent.save();
    await useWebhookTrigger('agent.created', savedAgent, data.owner.toString());
    return savedAgent;
  } catch (error: any) {
    throw error;
  }
};

/**
 * Update an existing agent
 */
export const updateAgent = async (
  id: string,
  userId: mongoose.Types.ObjectId,
  data: UpdateAgentData
): Promise<IAgent> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AgentNotFoundError(`Agent not found with id: ${id}`);
  }
  const agent = await Agent.findById(id);

  if (!agent) {
    throw new AgentNotFoundError();
  }

  // Check if the user is the owner of the agent
  if (!agent.owner.equals(userId)) {
    throw new AgentAccessDeniedError();
  }

  if (data.name && data.name !== agent.name) {
    const existingAgent = await Agent.findOne({
      name: data.name,
      owner: userId,
    });

    if (existingAgent) {
      throw new DuplicateAgentNameError();
    }
  }

  agent.name = data.name ?? agent.name;
  agent.type = data.type ?? agent.type;
  agent.description = data.description ?? agent.description;
  agent.industry = data.industry ?? agent.industry;
  agent.content = data.content ?? agent.content;
  agent.instructions = data.instructions ?? agent.instructions;

  const trainingPrompt = await updateRetellAgent(
    agent.retellTrainingLlmId,
    agent.retellTrainingAgentId,
    agent,
    "TRAINING"
  );
  const evaluationPrompt = await updateRetellAgent(
    agent.retellEvaluationLlmId,
    agent.retellEvaluationAgentId,
    agent,
    "EVALUATION"
  );
  const quickPrepPrompt = await updateRetellAgent(
    agent.retellQuickPrepLlmId,
    agent.retellQuickPrepAgentId,
    agent,
    "QUICK_PREP"
  );

  agent.trainingPrompt = trainingPrompt.prompt;
  agent.evaluationPrompt = evaluationPrompt.prompt;
  agent.quickPrepPrompt = quickPrepPrompt.prompt;

  if (data.trainingSessionId) {
    agent.trainingSessionId = data.trainingSessionId;
  }

  if (data.evaluationSessionId) {
    agent.evaluationSessionId = data.evaluationSessionId;
  }
  
  const savedAgent = await agent.save()
  await useWebhookTrigger('agent.updated', savedAgent, userId.toString());
  return savedAgent;
};

/**
 * Get an agent by ID
 */
export const getAgentById = async (
  id: string,
  userId: mongoose.Types.ObjectId
): Promise<IAgent> => {
  const agent = await Agent.findById(id).populate("owner", "firstName lastName email").populate("userIds").populate("departmentIds");

  if (!agent) {
    throw new AgentNotFoundError();
  }

  // Check if the user is the owner of the agent
  if (!agent.owner.equals(userId)) {
    throw new AgentAccessDeniedError();
  }

  return agent;
};

/**
 * Delete an agent
 */
export const deleteAgent = async (
  id: string,
  userId: mongoose.Types.ObjectId
): Promise<void> => {
  const agent = await Agent.findById(id);

  if (!agent) {
    throw new AgentNotFoundError();
  }

  // Check if the user is the owner of the agent
  if (!agent.owner.equals(userId)) {
    throw new AgentAccessDeniedError();
  }

  for (const session of agent.trainingSessionsUsingAgent) {
    await deleteTrainingSession(session._id.toString(), userId);
  }

  for (const session of agent.evaluationSessionsUsingAgent) {
    await deleteEvaluation(session._id.toString(), userId);
  }

  await deleteRetellAgent(
    agent.retellTrainingAgentId,
    agent.retellTrainingLlmId
  );
  await deleteRetellAgent(
    agent.retellEvaluationAgentId,
    agent.retellEvaluationLlmId
  );
  await deleteRetellAgent(
    agent.retellQuickPrepAgentId,
    agent.retellQuickPrepLlmId
  );
  await Agent.findByIdAndDelete(id);
  await useWebhookTrigger('agent.deleted', { id }, userId.toString());
};

/**
 * List agents with pagination and filtering
 */
export const listAgents = async (
  options: ListAgentsOptions
): Promise<{
  agents: IAgent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const { page = 1, limit = 30, type, industry, owner } = options;

  const query: any = {
    isPublic: { $ne: true }
  };

  // Add filters if provided
  if (type) query.type = type;
  if (industry) query.industry = industry;
  if (owner) query.owner = owner;

  const total = await Agent.countDocuments(query);
  const totalPages = Math.ceil(total / limit);

  const agents = await Agent.find(query)
    .sort({ createdAt: -1 })

  return {
    agents,
    total,
    page,
    limit,
    totalPages,
  };
};

export const listIndividualAgents = async (
  options: ListAgentsOptions
): Promise<{
  agents: IAgent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const { page = 1, limit = 10, type, industry, owner } = options;

  const query: any = {
    isPublic: { $ne: true }
  };

  // Add filters if provided
  if (type) query.type = type;
  if (industry) query.industry = industry;
  if (owner) query.owner = owner;

  const total = await Agent.countDocuments(query);
  const totalPages = Math.ceil(total / limit);

  const agents = await Agent.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)

  const finalAgents = await Promise.all(agents.map(async (agent: any) => {
    const trainingProgress = await getIndividualUserTrainingProgress(agent.owner, agent._id as mongoose.Types.ObjectId);
    const evaluationProgress = await getIndividualUserEvaluationProgress(agent.owner, agent._id);
    return { ...agent._doc, trainingProgress, evaluationProgress };
  }));

  return {
    agents: finalAgents as any,
    total,
    page,
    limit,  
    totalPages,
  };
};


function getNextCSTStartTime(cstTimeStr: string) {
  const [hour, minute] = cstTimeStr.split(':').map(Number);
  const now = new Date();

  // Get current time in CST
  const nowCST = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }));

  // Create target CST time today
  const targetCST = new Date(nowCST);
  targetCST.setHours(hour, minute, 0, 0);

  // If target CST time is in the past, move to tomorrow
  if (targetCST <= nowCST) {
    targetCST.setDate(targetCST.getDate() + 1);
  }

  // Convert CST time back to UTC millis, then to local time
  const localStartTime = new Date(targetCST.getTime());

  return localStartTime.toISOString();
}


export const setAutoReminder = async (agentId: string, autoPoke: boolean, timeInterval: string, manualDays: number, startTime: string) => {
  const agent = await Agent.findById(agentId);
  if (!agent) {
    throw new AgentNotFoundError();
  }

  const cstStartTime = getNextCSTStartTime(startTime);
  
  agent.autoReminder = autoPoke;
  agent.timeInterval = timeInterval;
  agent.manualDays = manualDays;
  agent.startTime = cstStartTime;

  await agent.save();

  let cronExpr = "";

  if(timeInterval === "manual") {
    cronExpr = `0 0 * * *`;
  } else if (timeInterval === "daily") {
    cronExpr = `0 0 * * *`;
  } else if (timeInterval === "weekly") {
    cronExpr = `0 0 * * *`;
  } else if (timeInterval === "monthly") {
    cronExpr = `0 0 1 * *`;
  }

  const now = new Date();
  const startDate = new Date(cstStartTime);
  const delayMs = startDate.getTime() - now.getTime();

  if (delayMs < 0) {
    throw new Error('Start time must be in the future');
  }
  if (autoPoke) {
    scheduleDelayedRepeatingJob(agentId, delayMs, cronExpr, () => {
      sendNotificationToUsers(agentId);
    });
  } else {
    cancelDelayedRepeatingJob(agentId);
  }
  return agent;
}

const sendNotificationToUsers = async (agentId: string) => {
  const agent = await Agent.findById(agentId);
  if (!agent) {
    throw new AgentNotFoundError();
  }
  agent.userIds.forEach(async (user) => {
    await sendNotificationToUser(user._id, agent.name);
  });
}

const sendNotificationToUser = async (userId: mongoose.Types.ObjectId, agentName: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const joinTrainingLink = `${config.frontendUrl}/login`;

  await sendTrainingReminderEmail(
    agentName,
    new Date().toISOString(),
    user.email,
    `${user.firstName} ${user.lastName}`,
    joinTrainingLink
  );
}
