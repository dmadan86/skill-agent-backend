// src/features/agents/controllers/agentController.ts
import { Response, NextFunction } from "express";
import * as agentService from "../services/agentService";
import * as retellAgentService from "../../../shared/services/retellAgentService";
import { sendSuccess } from "../../../shared/utils/response.utils";
import {
  CreateAgentInput,
  UpdateAgentInput,
  GetAgentInput,
  DeleteAgentInput,
  agentSchemas,
  StartWebCallInput,
} from "../validation/agentSchema";
import { AuthenticatedRequest } from "../../../shared/middleware/authenticate";
import { AppError, AgentNotFoundError } from "../../../shared/errors/AppError";
import mongoose from "mongoose";
import { createTrainingSession } from "../../../features/training/services/trainingSessionService";
import { createEvaluation } from "../../../features/evaluation/services/evaluationService";

export const createAgent = async (
  req: AuthenticatedRequest<{}, {}, CreateAgentInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const agentData = req.body;

    const agents = await agentService.createAgent({
      ...agentData,
      owner: userId,
      userIds: agentData.userIds,
      departmentIds: agentData.departmentIds,
    });
    const trainingSession = await createTrainingSession({
      agentId: agents._id as string,
      createdBy: userId,
      userIds:
        agentData?.userIds && agentData?.userIds?.length > 0
          ? ([...agentData?.userIds, userId] as string[])
          : [userId.toString()],
      // departmentIds: [...(agentData?.departmentIds || []), userId] as string[],
      title: `Training for ${agents.name}`,
      description: `Training for ${agents.name}`,
    });
    const evaluationSession = await createEvaluation({
      agentId: agents._id as string,
      createdBy: userId,
      userIds:
        agentData?.userIds && agentData?.userIds?.length > 0
          ? ([...agentData?.userIds, userId] as string[])
          : [userId.toString()],
      // departmentIds: [...(agentData?.departmentIds || []), userId] as string[],
      title: `Evaluation for ${agents.name}`,
      description: `Evaluation for ${agents.name}`,
    });
    const updatedAgent = await agentService.updateAgent(
      agents._id as string,
      userId,
      {
        trainingSessionId: trainingSession._id as string,
        evaluationSessionId: evaluationSession._id as string,
      },
    );
    sendSuccess(
      res,
      {
        message: "Agents created successfully",
        data: updatedAgent,
      },
      201,
    );
  } catch (error) {
    next(error);
  }
};

export const updateAgent = async (
  req: AuthenticatedRequest<{ id: string }, {}, UpdateAgentInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const agent = await agentService.updateAgent(id, userId, req.body);

    sendSuccess(res, {
      message: "Agent updated successfully",
      data: agent,
    });
  } catch (error) {
    next(error);
  }
};

export const getAgent = async (
  req: AuthenticatedRequest<GetAgentInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AgentNotFoundError(`Agent not found with id: ${id}`);
    }
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const agent = await agentService.getAgentById(id, userId);

    if (!agent) {
      throw new AgentNotFoundError();
    }

    sendSuccess(res, {
      data: agent,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAgent = async (
  req: AuthenticatedRequest<DeleteAgentInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AgentNotFoundError(`Agent not found with id: ${id}`);
    }
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    await agentService.deleteAgent(id, userId);

    sendSuccess(res, {
      message: "Agent deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const listAgents = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const parsedQuery = agentSchemas.listAgentsSchema.query.parse(req.query);

    const { page, limit, type, industry } = parsedQuery;

    const result = await agentService.listAgents({
      page: page || undefined,
      limit: limit || undefined,
      type: type as string,
      industry: industry as string,
      owner: userId,
    });

    sendSuccess(res, {
      data: result.agents,
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

export const listIndividualAgents = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const parsedQuery = agentSchemas.listAgentsSchema.query.parse(req.query);

    const { page, limit, type, industry } = parsedQuery;

    const result = await agentService.listIndividualAgents({
      page: page || undefined,
      limit: limit || undefined,
      type: type as string,
      industry: industry as string,
      owner: userId,
    });

    sendSuccess(res, {
      data: result.agents,
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

export const startWebCall = async (
  req: AuthenticatedRequest<{}, {}, StartWebCallInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      agentId,
      userName,
      userPosition,
      userDepartment,
      previousSessionSummary,
    } = req.body;

    const { call_id, access_token } = await retellAgentService.startWebCall(
      agentId,
      userName,
      userPosition,
      userDepartment,
      previousSessionSummary,
    );

    sendSuccess(res, {
      message: "Web call started successfully",
      data: { call_id, access_token },
    });
  } catch (error) {
    next(error);
  }
};

export const setAutoReminder = async (
  req: AuthenticatedRequest<
    { agentId: string },
    {},
    {
      autoPoke: boolean;
      timeInterval: string;
      manualDays: number;
      startTime: string;
    }
  >,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { agentId } = req.params;
    const { autoPoke, timeInterval, manualDays, startTime } = req.body;

    const reminder = await agentService.setAutoReminder(
      agentId,
      autoPoke,
      timeInterval,
      manualDays,
      startTime,
    );

    sendSuccess(res, {
      message: "Auto reminder set successfully",
      data: reminder,
    });
  } catch (error) {
    next(error);
  }
};
