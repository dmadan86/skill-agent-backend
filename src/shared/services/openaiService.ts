import OpenAI from 'openai';
import config from '../config';
import { AppError } from '../errors/AppError';
import logger from '../utils/logger';
import { ResponseInput } from 'openai/resources/responses/responses';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

/**
 * Get chat completions from OpenAI
 */
export const getChatCompletion = async (
  messages: any,
  stream = false
) => {
  try {
    return await openai.responses.create({
      model: config.openai.model,
      stream: stream,
      input: messages
    });
  } catch (error) {
    logger.debug(`OpenAI API Error:  ${error}`);
    throw new AppError('Failed to get chat completion', 'OPENAI_API_ERROR', 500);
  }
};