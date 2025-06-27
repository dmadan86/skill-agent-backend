// src/features/agents/validation/agentSchema.ts
import { z } from 'zod';

// Create Agent Schema
const createAgentSchema = z.object({
  name: z.string({
    required_error: 'Agent name is required',
  }).min(3, 'Agent name must be at least 3 characters').max(100),
  type: z.enum(['PROCESS', 'PRODUCT', 'SERVICE', 'JOB', 'CERTIFICATE'], {
    required_error: 'Agent type is required',
  }),
  description: z.string({
    required_error: 'Description is required',
  }).min(10, 'Description must be at least 10 characters'),
  industry: z.string({
    required_error: 'Industry is required',
  }),
  content: z.string({
    required_error: 'Agent content is required',
  }).min(20, 'Agent content must be at least 20 characters'),
  instructions: z.string().optional(),
  userIds: z.array(z.string()).optional(),
  departmentIds: z.array(z.string()).optional(),
});

// Update Agent Schema
const updateAgentSchema = z.object({
  name: z.string().min(3, 'Agent name must be at least 3 characters').max(100).optional(),
  type: z.enum(['PROCESS', 'PRODUCT', 'SERVICE', 'JOB', 'CERTIFICATE']).optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  industry: z.string().optional(),
  content: z.string().min(20, 'Agent content must be at least 20 characters').optional(),
  instructions: z.string().optional(),
});

// Get Agent Schema
const getAgentSchema = z.object({
  id: z.string({
    required_error: 'Agent ID is required',
  }),
});

// Delete Agent Schema
const deleteAgentSchema = z.object({
  id: z.string({
    required_error: 'Agent ID is required',
  }),
});

// List Agents Schema
const listAgentsSchema = z.object({
  page: z.string().optional().transform(val => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val, 10) : 10)),
  type: z.enum(['PROCESS', 'PRODUCT', 'SERVICE', 'JOB', 'CERTIFICATE']).optional(),
  agentType: z.enum(['TRAINING', 'EVALUATION', 'QUICK PREP']).optional(),
  industry: z.string().optional(),
});

// Start Web Call Schema
const startWebCallSchema = z.object({
  agentId: z.string({
    required_error: 'Agent ID is required',
  }),
  userName: z.string({
    required_error: 'User name is required',
  }),
  userPosition: z.string({
    required_error: 'User position is required',
  }), 
  userDepartment: z.string({
    required_error: 'User department is required',
  }),
  previousSessionSummary: z.string().optional(),
});

// Unified Assignment Schema
const unifiedAssignmentSchema = z.object({
  userIds: z.array(z.string()).optional(),
  departmentIds: z.array(z.string()).optional(),
});

// Unified Assignment Params Schema
const unifiedAssignmentParamsSchema = z.object({
  agentId: z.string({
    required_error: 'Agent ID is required',
  }),
});

// Unified Remove User Schema
const unifiedRemoveUserSchema = z.object({
  agentId: z.string({
    required_error: 'Agent ID is required',
  }),
  userId: z.string({
    required_error: 'User ID is required',
  }),
});

// Send Member Reminder Schema
const getMemberReminderSchema = z.object({
  agentId: z.string({
    required_error: 'Agent ID is required',
  }),
});
const sendMemberReminderSchema = z.object({
  autoPoke: z.boolean({
    required_error: 'Auto poke is required',
  }).optional(),
  timeInterval: z.string({
    required_error: 'Time interval is required',
  }).optional(),
  manualDays: z.number().optional(),
});

// Export types for use in controllers
export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
export type GetAgentInput = z.infer<typeof getAgentSchema>;
export type DeleteAgentInput = z.infer<typeof deleteAgentSchema>;
export type ListAgentsInput = z.infer<typeof listAgentsSchema>;
export type StartWebCallInput = z.infer<typeof startWebCallSchema>;
export type UnifiedAssignmentInput = z.infer<typeof unifiedAssignmentSchema>;
export type UnifiedAssignmentParamsInput = z.infer<typeof unifiedAssignmentParamsSchema>;
export type UnifiedRemoveUserInput = z.infer<typeof unifiedRemoveUserSchema>;

// Export schemas for validation middleware
export const agentSchemas = {
  createAgentSchema: { body: createAgentSchema },
  sendMemberReminderSchema: { params: getMemberReminderSchema, body: sendMemberReminderSchema },
  updateAgentSchema: { 
    params: getAgentSchema,
    body: updateAgentSchema,
  },
  getAgentSchema: { params: getAgentSchema },
  deleteAgentSchema: { params: deleteAgentSchema },
  listAgentsSchema: { query: listAgentsSchema },
  startWebCallSchema: { body: startWebCallSchema },
  unifiedAssignmentSchema: {
    params: unifiedAssignmentParamsSchema,
    body: unifiedAssignmentSchema,
  },
  unifiedRemoveUserSchema: {
    params: unifiedRemoveUserSchema,
  },
};