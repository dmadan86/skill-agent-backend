// src/shared/models/Evaluation.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IEvaluationAssignee {
  userId: mongoose.Types.ObjectId;
  status: "Pending" | "In Progress" | "Completed";
  startDate?: Date;
  completedDate?: Date;
  progressId: mongoose.Types.ObjectId;
  progress: number;
  overallScore?: number;
  timeSpent: number;
  lastAccessDate?: Date;
}

export interface IEvaluation extends Document {
  title: string;
  agentId: mongoose.Types.ObjectId;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  assignees: IEvaluationAssignee[];
  status: "Pending" | "In Progress" | "Completed";
  createdAt: Date;
  updatedAt: Date;
}
const EvaluationAssigneeSchema = new Schema<IEvaluationAssignee>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed"],
    default: "Pending",
  },
  progressId: {
    type: Schema.Types.ObjectId,
    ref: "EvaluationProgress",
    required: true,
  },
  startDate: {
    type: Date,
  },
  completedDate: {
    type: Date,
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
  },
  timeSpent: {
    type: Number,
    default: 0,
    min: 0, // minutes
  },
  lastAccessDate: {
    type: Date,
  },
});

const EvaluationSchema = new Schema<IEvaluation>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    agentId: {
      type: Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignees: [EvaluationAssigneeSchema],
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"],
      default: "Pending",
    },
  },
  { timestamps: true },
);

// Create indexes for efficient queries
EvaluationSchema.index({ createdBy: 1 });
EvaluationSchema.index({ agentId: 1 });
EvaluationSchema.index({ "assignees.userId": 1 });
EvaluationSchema.index({ status: 1 });
EvaluationSchema.index({ departmentIds: 1 });

export const Evaluation = mongoose.model<IEvaluation>(
  "Evaluation",
  EvaluationSchema,
);
