import { z } from "zod";

const webhookEventsList = [
  'user.created',
  'user.updated',
  'user.deleted',
  'team.created',
  'team.updated',
  'team.deleted',
  'team.member_added',
  'team.member_removed',
  'agent.created',
  'agent.updated',
  'agent.deleted',
  'training.started',
  'training.completed',
  'training.failed',
  'report.generated',
  'user.nudged'
] as const;

// Create webhook input schema
const createWebhookSchema = z.object({
  url: z
    .string()
    .url("URL must be a valid URL")
    .min(5, "URL must be at least 5 characters"),
  events: z
    .array(z.enum(webhookEventsList))
    .min(1, "At least one event must be specified"),
  description: z
    .string()
    .max(200, "Description must be at most 200 characters")
    .optional(),
  maxRetries: z
    .number()
    .int("Max retries must be an integer")
    .min(1, "Max retries must be at least 1")
    .max(10, "Max retries must be at most 10")
    .optional(),
  retryInterval: z
    .number()
    .int("Retry interval must be an integer")
    .min(10, "Retry interval must be at least 10 seconds")
    .max(3600, "Retry interval must be at most 3600 seconds (1 hour)")
    .optional(),
});

// Update webhook input schema
const updateWebhookSchema = z.object({
  url: z
    .string()
    .url("URL must be a valid URL")
    .min(5, "URL must be at least 5 characters")
    .optional(),
  events: z
    .array(z.enum(webhookEventsList))
    .min(1, "At least one event must be specified")
    .optional(),
  active: z
    .boolean()
    .optional(),
  description: z
    .string()
    .max(200, "Description must be at most 200 characters")
    .optional(),
  maxRetries: z
    .number()
    .int("Max retries must be an integer")
    .min(1, "Max retries must be at least 1")
    .max(10, "Max retries must be at most 10")
    .optional(),
  retryInterval: z
    .number()
    .int("Retry interval must be an integer")
    .min(10, "Retry interval must be at least 10 seconds")
    .max(3600, "Retry interval must be at most 3600 seconds (1 hour)")
    .optional(),
});

// Get webhook by ID param schema
const getWebhookSchema = z.object({
  id: z.string().min(1, "Webhook ID is required"),
});

// Test webhook input schema
const testWebhookSchema = z.object({
  id: z.string().min(1, "Webhook ID is required"),
});

// Webhook deliveries query schema
const webhookDeliveriesQuerySchema = z.object({
  limit: z.string().optional(),
  skip: z.string().optional(),
});

// Export all schemas
export const webhookSchemas = {
  createWebhookSchema: { body: createWebhookSchema },
  updateWebhookSchema: { body: updateWebhookSchema },
  getWebhookSchema: { params: getWebhookSchema },
  testWebhookSchema: { params: testWebhookSchema },
  webhookDeliveriesQuerySchema: { query: webhookDeliveriesQuerySchema }
};

export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>;
export type GetWebhookInput = z.infer<typeof getWebhookSchema>;
export type TestWebhookInput = z.infer<typeof testWebhookSchema>; 