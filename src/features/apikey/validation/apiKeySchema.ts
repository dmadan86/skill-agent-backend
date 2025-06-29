import { z } from "zod";

// Create API Key Schema
const createApiKeySchema = z.object({
  name: z
    .string({
      required_error: "Name is required",
    })
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be at most 50 characters"),
});

// Revoke API Key Schema
const revokeApiKeySchema = z.object({
  id: z.string({
    required_error: "API Key ID is required",
  }),
});

// Export types for use in controllers
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type RevokeApiKeyInput = z.infer<typeof revokeApiKeySchema>;

// Define request body types
export type CreateApiKeyRequestBody = {
  name: string;
};

export type RevokeApiKeyRequestParams = {
  id: string;
};

// Export schemas for validation middleware
export const apiKeySchemas = {
  createApiKeySchema: { body: createApiKeySchema },
  revokeApiKeySchema: { params: revokeApiKeySchema },
};
