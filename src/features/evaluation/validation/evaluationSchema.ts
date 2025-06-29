// src/features/evaluation/validation/evaluationSchema.ts
import { z } from "zod";

// Common schema patterns
const objectIdSchema = z
  .string({
    required_error: "ID is required",
  })
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// Next step schema
const nextStepSchema = z.object({
  title: z
    .string({
      required_error: "Next step title is required",
    })
    .min(3, "Title must be at least 3 characters"),
  description: z
    .string({
      required_error: "Next step description is required",
    })
    .min(10, "Description must be at least 10 characters"),
  type: z.enum(["Training", "Practice", "Follow-up"], {
    required_error: "Next step type is required",
  }),
});

// Skill assessment schema
const skillAssessmentSchema = z.object({
  skillName: z
    .string({
      required_error: "Skill name is required",
    })
    .min(2, "Skill name must be at least 2 characters"),
  score: z
    .number({
      required_error: "Score is required",
    })
    .min(0, "Score must be at least 0")
    .max(100, "Score cannot exceed 100"),
  weight: z
    .number()
    .min(1, "Weight must be at least 1")
    .max(10, "Weight cannot exceed 10")
    .default(1),
});

// Create Evaluation Schema
const createEvaluationSchema = z.object({
  title: z
    .string({
      required_error: "Evaluation title is required",
    })
    .min(3, "Title must be at least 3 characters")
    .max(100),
  agentId: objectIdSchema.refine((val) => val.length === 24, {
    message: "Agent ID must be 24 characters long",
  }),
  description: z.string().optional(),
  userIds: z.array(objectIdSchema).optional(),
  departmentIds: z.array(objectIdSchema).optional(),
});

// Update Evaluation Schema
const updateEvaluationSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100)
    .optional(),
  description: z.string().optional(),
});

// Get Evaluation Schema
const getEvaluationSchema = z.object({
  id: objectIdSchema,
});

// Delete Evaluation Schema
const deleteEvaluationSchema = z.object({
  id: objectIdSchema,
});

// Assign Users Schema
const assignUsersSchema = z.object({
  userIds: z.array(objectIdSchema).optional(),
  departmentIds: z.array(objectIdSchema).optional(),
});

// Remove Assignee Schema
const removeAssigneeSchema = z.object({
  evaluationId: objectIdSchema,
  userId: objectIdSchema,
});

// List Evaluations Schema
const listEvaluationsSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10)),
  status: z.enum(["Pending", "In Progress", "Completed"]).optional(),
  agentId: objectIdSchema.optional(),
  userId: objectIdSchema.optional(),
});

// Start Evaluation Schema
const startEvaluationSchema = z.object({
  evaluationId: objectIdSchema,
});

// Update Evaluation Progress Schema
const updateEvaluationProgressSchema = z.object({
  callId: z.string({
    required_error: "Call ID is required",
  }),
});

// Add Skill Assessment Schema
const addSkillAssessmentSchema = z.object({
  evaluationId: objectIdSchema,
  userId: objectIdSchema,
  skillAssessments: z.array(skillAssessmentSchema),
});

// Add Strengths Schema
const addStrengthsSchema = z.object({
  evaluationId: objectIdSchema,
  userId: objectIdSchema,
  strengths: z.array(z.string()),
});

// Add Improvement Areas Schema
const addImprovementAreasSchema = z.object({
  evaluationId: objectIdSchema,
  userId: objectIdSchema,
  improvementAreas: z.array(z.string()),
});

// Add Recommendation Schema
const addRecommendationSchema = z.object({
  evaluationId: objectIdSchema,
  recommendation: z
    .string({
      required_error: "Recommendation is required",
    })
    .min(10, "Recommendation must be at least 10 characters"),
});

// Add Next Steps Schema
const addNextStepsSchema = z.object({
  evaluationId: objectIdSchema,
  nextSteps: z.array(nextStepSchema),
});

// Complete Evaluation Schema
const completeEvaluationSchema = z.object({
  evaluationId: objectIdSchema,
  userId: objectIdSchema,
  overallScore: z
    .number({
      required_error: "Overall score is required",
    })
    .min(0, "Score must be at least 0")
    .max(100, "Score cannot exceed 100"),
});

// Export types for use in controllers
export type CreateEvaluationInput = z.infer<typeof createEvaluationSchema>;
export type UpdateEvaluationInput = z.infer<typeof updateEvaluationSchema>;
export type GetEvaluationInput = z.infer<typeof getEvaluationSchema>;
export type DeleteEvaluationInput = z.infer<typeof deleteEvaluationSchema>;
export type AssignUsersInput = z.infer<typeof assignUsersSchema>;
export type RemoveAssigneeInput = z.infer<typeof removeAssigneeSchema>;
export type ListEvaluationsInput = z.infer<typeof listEvaluationsSchema>;
export type StartEvaluationInput = z.infer<typeof startEvaluationSchema>;
export type UpdateEvaluationProgressInput = z.infer<
  typeof updateEvaluationProgressSchema
>;
export type AddSkillAssessmentInput = z.infer<typeof addSkillAssessmentSchema>;
export type AddStrengthsInput = z.infer<typeof addStrengthsSchema>;
export type AddImprovementAreasInput = z.infer<
  typeof addImprovementAreasSchema
>;
export type AddRecommendationInput = z.infer<typeof addRecommendationSchema>;
export type AddNextStepsInput = z.infer<typeof addNextStepsSchema>;
export type CompleteEvaluationInput = z.infer<typeof completeEvaluationSchema>;

// Export schemas for validation middleware
export const evaluationSchemas = {
  createEvaluationSchema: { body: createEvaluationSchema },
  updateEvaluationSchema: {
    params: getEvaluationSchema,
    body: updateEvaluationSchema,
  },
  getEvaluationSchema: { params: getEvaluationSchema },
  deleteEvaluationSchema: { params: getEvaluationSchema },
  assignUsersSchema: {
    params: getEvaluationSchema,
    body: assignUsersSchema,
  },
  removeAssigneeSchema: {
    params: removeAssigneeSchema,
  },
  listEvaluationsSchema: { query: listEvaluationsSchema },
  startEvaluationSchema: { params: startEvaluationSchema },
  updateEvaluationProgressSchema: {
    params: startEvaluationSchema,
    body: updateEvaluationProgressSchema,
  },
  addSkillAssessmentSchema: {
    params: startEvaluationSchema,
    body: addSkillAssessmentSchema,
  },
  addStrengthsSchema: {
    params: startEvaluationSchema,
    body: addStrengthsSchema,
  },
  addImprovementAreasSchema: {
    params: startEvaluationSchema,
    body: addImprovementAreasSchema,
  },
  addRecommendationSchema: {
    params: startEvaluationSchema,
    body: addRecommendationSchema,
  },
  addNextStepsSchema: {
    params: startEvaluationSchema,
    body: addNextStepsSchema,
  },
  completeEvaluationSchema: {
    params: startEvaluationSchema,
    body: completeEvaluationSchema,
  },
};
