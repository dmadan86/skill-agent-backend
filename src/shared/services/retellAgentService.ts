// src/features/integrations/services/retellService.ts
import config from "../config";
import {
  AppError,
  RetellAgentCreationError,
  RetellAgentDeletionError,
  RetellAgentUpdateError,
} from "../errors/AppError";
import Retell from "retell-sdk";
import { IAgent } from "../models/Agent";
import { generateQuickPrepAgentPrompt } from "../../features/agents/services/quickPrepAgentService";
import { generateEvaluationAgentPrompt } from "../../features/agents/services/evaluationAgentService";
import { generateTrainingAgentPrompt } from "../../features/agents/services/trainingAgentService";
import logger from "../utils/logger";

const retellClient = new Retell({
  apiKey: config.retell.apiKey,
});

/**
 * Create a new agent in Retell AI
 */
export const createRetellAgent = async (
  agent: IAgent,
  agentType: string
): Promise<{ retellAgentId: string; retellLlmId: string, prompt: string }> => {
  try {
    logger.debug(
      "Creating Retell agent for agent: " +
        agent.name +
        " and agentType: " +
        agentType
    );
    const generalPrompt = generateAgentPrompt(agent, agentType);
    const llmParams: Retell.Llm.LlmCreateParams = {
      model: config.retell.defaultLlmModel,
      general_prompt: generalPrompt,
    };

    const llm = await retellClient.llm.create(llmParams);

    const agentParams: Retell.Agent.AgentCreateParams = {
      response_engine: { llm_id: llm.llm_id, type: "retell-llm" },
      voice_id: config.retell.defaultVoice,
      agent_name: agent.name,
    };

    const retellAgent = await retellClient.agent.create(agentParams);

    return { retellAgentId: retellAgent.agent_id, retellLlmId: llm.llm_id , prompt: generalPrompt };
  } catch (error) {
    console.log(error);
    throw new RetellAgentCreationError(error);
  }
};

/**
 * Update an existing agent in Retell AI
 */
export const updateRetellAgent = async (
  llmId: string,
  agentId: string,
  agent: IAgent,
  agentType: string
): Promise<{ retellAgentId: string; retellLlmId: string; prompt: string }> => {
  try {
    const generalPrompt = generateAgentPrompt(agent, agentType);

    const llmParams: Retell.Llm.LlmUpdateParams = {
      model: config.retell.defaultLlmModel,
      general_prompt: generalPrompt,
    };

    const llm = await retellClient.llm.update(llmId, llmParams);
    const agentParams: Retell.Agent.AgentUpdateParams = {
      response_engine: { llm_id: llm.llm_id, type: "retell-llm" },
      voice_id: config.retell.defaultVoice,
      agent_name: agent.name,
    };

    const retellAgent = await retellClient.agent.update(agentId, agentParams);
    return { retellAgentId: retellAgent.agent_id, retellLlmId: llm.llm_id , prompt: generalPrompt };
  } catch (error) {
    throw new RetellAgentUpdateError(error);
  }
};

/**
 * Generate the appropriate prompt based on agent type
 */
const generateAgentPrompt = (agent: IAgent, agentType: string): string => {
  switch (agentType) {
    case "TRAINING":
      return generateTrainingAgentPrompt(agent);
    case "EVALUATION":
      return generateEvaluationAgentPrompt(agent);
    case "QUICK_PREP":
      return generateQuickPrepAgentPrompt(agent);
    default:
      throw new Error("Invalid agent type");
  }
};

/**
 * Delete an agent from Retell AI
 */
export const deleteRetellAgent = async (
  agentId: string,
  llmId: string
): Promise<void> => {
  try {
    await retellClient.llm.delete(llmId);
    await retellClient.agent.delete(agentId);
  } catch (error) {
    throw new RetellAgentDeletionError(error);
  }
};

/**
 * Get the details of a call
 */
export const getCallDetails = async (
  callId: string
): Promise<{ transcript: string; timeSpent: number }> => {
  try {
    logger.debug(`Retrieving call details for callId: ${callId}`);

    // Add a small delay to ensure the transcript is ready
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const callResponse = await retellClient.call.retrieve(callId);

    if (!callResponse) {
      logger.error(`No response received for callId: ${callId}`);
      throw new Error("No call response received");
    }

    // If transcript is empty, try again after a short delay
    if (!callResponse.transcript) {
      logger.debug("Transcript is empty, retrying after delay...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const retryResponse = await retellClient.call.retrieve(callId);

      if (!retryResponse || !retryResponse.transcript) {
        logger.error(
          `Failed to get transcript after retry for callId: ${callId}`
        );
        throw new Error("Failed to retrieve transcript after retry");
      }

      callResponse.transcript = retryResponse.transcript;
    }

    const transcript = callResponse.transcript;
    logger.debug(`Retrieved transcript length: ${transcript.length}`);

    const timeSpent =
      callResponse.end_timestamp && callResponse.start_timestamp
        ? Math.floor(
            (callResponse.end_timestamp - callResponse.start_timestamp) / 60
          ) // Convert to minutes
        : 0;

    logger.debug(`Calculated time spent: ${timeSpent} minutes`);
    return { transcript, timeSpent };
  } catch (error: unknown) {
    logger.error("Error getting call details:", error);
    throw new Error(
      `Failed to get call details: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Start a web call with an agent
 */
export const startWebCall = async (
  agentId: string,
  userName: string,
  userPosition: string,
  userDepartment: string,
  previousSessionSummary: string | undefined
): Promise<{ call_id: string; access_token: string }> => {
  try {
    const { call_id, access_token } = await retellClient.call.createWebCall({
      agent_id: agentId,
      retell_llm_dynamic_variables: {
        user_name: userName,
        user_position: userPosition,
        user_department: userDepartment,
        previous_session_summary: previousSessionSummary,
      },
    });

    return { call_id, access_token };
  } catch (error) {
    console.log(error);
    throw new AppError(
      "Failed to start web call",
      "FAILED_TO_START_WEB_CALL",
      500
    );
  }
};
