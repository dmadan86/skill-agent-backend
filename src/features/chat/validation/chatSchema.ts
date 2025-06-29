import { z } from "zod";

// Create Chat Session Schema
const createChatSessionSchema = z.object({
  agentId: z.string({
    required_error: "Agent ID is required",
  }),
  sessionType: z.enum(["TRAINING", "EVALUATION", "QUICK_PREP"], {
    required_error: "Session type is required",
  }),
});

// Get Chat Session Schema
const getChatSessionSchema = z.object({
  id: z.string({
    required_error: "Session ID is required",
  }),
});

// End Chat Session Schema
const endChatSessionSchema = z.object({
  id: z.string({
    required_error: "Session ID is required",
  }),
});

// List Chat Sessions Schema
const listChatSessionsSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10)),
});

// Export schemas for validation middleware
export const chatSchemas = {
  createChatSessionSchema: {
    body: createChatSessionSchema,
  },
  getChatSessionSchema: {
    params: getChatSessionSchema,
  },
  endChatSessionSchema: {
    params: endChatSessionSchema,
  },
  listChatSessionsSchema: {
    query: listChatSessionsSchema,
  },
};
