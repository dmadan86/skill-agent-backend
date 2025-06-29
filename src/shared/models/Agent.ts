// src/shared/models/Agent.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IAgent extends Document {
  name: string;
  type: string;
  description: string;
  industry: string;
  content: string;
  trainingPrompt: string;
  evaluationPrompt: string;
  quickPrepPrompt: string;
  retellTrainingLlmId: string;
  retellTrainingAgentId: string;
  retellEvaluationLlmId: string;
  retellEvaluationAgentId: string;
  retellQuickPrepLlmId: string;
  retellQuickPrepAgentId: string;
  instructions?: string;
  owner: mongoose.Types.ObjectId;
  trainingSessionsUsingAgent: mongoose.Types.ObjectId[];
  evaluationSessionsUsingAgent: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  userIds: mongoose.Types.ObjectId[];
  departmentIds: mongoose.Types.ObjectId[];
  trainingSessionId?: mongoose.Types.ObjectId | string;
  evaluationSessionId?: mongoose.Types.ObjectId | string;
  autoReminder?: boolean;
  timeInterval?: string;
  manualDays?: number;
  startTime?: string;
  isPublic?: boolean;
}

const AgentSchema = new Schema<IAgent>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["PROCESS", "PRODUCT", "SERVICE", "JOB", "CERTIFICATE"],
    },
    userIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: false,
      },
    ],
    departmentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Department",
        required: false,
      },
    ],
    trainingPrompt: {
      type: String,
    },
    evaluationPrompt: {
      type: String,
    },
    quickPrepPrompt: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    industry: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    retellTrainingLlmId: {
      type: String,
      required: true,
    },
    retellTrainingAgentId: {
      type: String,
      required: true,
    },
    retellEvaluationLlmId: {
      type: String,
      required: true,
    },
    retellEvaluationAgentId: {
      type: String,
      required: true,
    },
    retellQuickPrepLlmId: {
      type: String,
      required: true,
    },
    retellQuickPrepAgentId: {
      type: String,
      required: true,
    },
    instructions: {
      type: String,
      required: false,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    trainingSessionsUsingAgent: {
      type: [Schema.Types.ObjectId],
      ref: "TrainingSession",
      required: false,
    },
    evaluationSessionsUsingAgent: {
      type: [Schema.Types.ObjectId],
      ref: "EvaluationSession",
      required: false,
    },
    trainingSessionId: {
      type: Schema.Types.ObjectId,
      ref: "TrainingSession",
      required: false,
    },
    evaluationSessionId: {
      type: Schema.Types.ObjectId,
      ref: "EvaluationSession",
      required: false,
    },
    autoReminder: {
      type: Boolean,
      required: false,
      default: false,
    },
    timeInterval: {
      type: String,
      required: false,
    },
    manualDays: {
      type: Number,
      required: false,
    },
    startTime: {
      type: String,
      required: false,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

AgentSchema.index({ name: 1, owner: 1, isPublic: 1 }, { unique: true });

export const Agent = mongoose.model<IAgent>("Agent", AgentSchema);
