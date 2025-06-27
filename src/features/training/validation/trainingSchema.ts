// src/features/training/validation/trainingSchema.ts
import mongoose from "mongoose";
import { z } from "zod";

// Common schemas

export const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format",
  });

// Create Training Session Schema
const createTrainingSessionSchema = z.object({
  title: z
    .string({
      required_error: "Session title is required",
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

// Update Training Session Schema
const updateTrainingSessionSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100)
    .optional(),
  description: z.string().optional(),
});

// Get Training Session Schema
const getTrainingSessionSchema = z.object({
  id: objectIdSchema,
});

// Delete Training Session Schema
const deleteTrainingSessionSchema = z.object({
  id: objectIdSchema,
});

// Assign Trainees Schema
const assignTraineesSchema = z.object({
  userIds: z.array(objectIdSchema).optional(),
  departmentIds: z.array(objectIdSchema).optional(),
});

// Remove Trainee Schema
const removeTraineeSchema = z.object({
  sessionId: objectIdSchema,
  userId: objectIdSchema,
});

// Send Member Reminder Schema
const sendMemberReminderSchema = z.object({
  userId: objectIdSchema,
});

// List Training Sessions Schema
const listTrainingSessionsSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10)),
  status: z.enum(["Not Started", "In Progress", "Completed"]).optional(),
  agentId: objectIdSchema.optional(),
  userId: objectIdSchema.optional(),
});

// Start Training Schema
const startTrainingSchema = z.object({
  sessionId: objectIdSchema,
});

// Update Progress Schema
const updateProgressSchema = z.object({
  callId: z.string({
    required_error: "Call ID is required",
  })
});

// Submit Evaluation Schema
const submitEvaluationSchema = z.object({
  sessionId: objectIdSchema,
  score: z
    .number({
      required_error: "Score is required",
    })
    .min(0, "Score cannot be negative")
    .max(100, "Score cannot exceed 100"),
  feedback: z
    .string({
      required_error: "Feedback is required",
    })
    .min(10, "Feedback must be at least 10 characters"),
});

// Export types for use in controllers
export type CreateTrainingSessionInput = z.infer<
  typeof createTrainingSessionSchema
>;
export type UpdateTrainingSessionInput = z.infer<
  typeof updateTrainingSessionSchema
>;
export type GetTrainingSessionInput = z.infer<typeof getTrainingSessionSchema>;
export type DeleteTrainingSessionInput = z.infer<
  typeof deleteTrainingSessionSchema
>;
export type AssignTraineesInput = z.infer<typeof assignTraineesSchema>;
export type RemoveTraineeInput = z.infer<typeof removeTraineeSchema>;
export type ListTrainingSessionsInput = z.infer<
  typeof listTrainingSessionsSchema
>;
export type StartTrainingInput = z.infer<typeof startTrainingSchema>;
export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;
export type SubmitEvaluationInput = z.infer<typeof submitEvaluationSchema>;

// Export schemas for validation middleware
export const trainingSchemas = {
  createTrainingSessionSchema: { body: createTrainingSessionSchema },
  updateTrainingSessionSchema: {
    params: getTrainingSessionSchema,
    body: updateTrainingSessionSchema,
  },
  getTrainingSessionSchema: { params: getTrainingSessionSchema },
  deleteTrainingSessionSchema: { params: deleteTrainingSessionSchema },
  assignTraineesSchema: {
    params: getTrainingSessionSchema,
    body: assignTraineesSchema,
  },
  removeTraineeSchema: {
    params: removeTraineeSchema,
  },
  sendMemberReminderSchema: {
    params: sendMemberReminderSchema,
  },
  listTrainingSessionsSchema: { query: listTrainingSessionsSchema },
  startTrainingSchema: { params: startTrainingSchema },
  updateProgressSchema: {
    params: startTrainingSchema,
    body: updateProgressSchema,
  },
  submitEvaluationSchema: {
    params: startTrainingSchema,
    body: submitEvaluationSchema,
  },
  resetProgressSchema: {
    params: startTrainingSchema,
  },
};
