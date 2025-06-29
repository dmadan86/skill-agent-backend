// src/shared/models/TrainingSession.ts
import mongoose, { Document, Schema } from "mongoose";

export interface ITrainee {
  userId: mongoose.Types.ObjectId;
  status: "Not Started" | "In Progress" | "Completed";
  progressId: mongoose.Types.ObjectId;
  progress: number;
  lastAccessDate: Date;
  timeSpent: number;
  assignedDate: Date;
  completedDate?: Date;
}

export interface ITrainingSession extends Document {
  title: string;
  agentId: mongoose.Types.ObjectId;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  trainees: ITrainee[];
  createdAt: Date;
  updatedAt: Date;
}

const TraineeSchema = new Schema<ITrainee>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  progressId: {
    type: Schema.Types.ObjectId,
    ref: "TrainingProgress",
    required: true,
  },
  status: {
    type: String,
    enum: ["Not Started", "In Progress", "Completed"],
    default: "Not Started",
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  lastAccessDate: {
    type: Date,
    default: Date.now,
  },
  timeSpent: {
    type: Number,
    default: 0,
    min: 0, // minutes
  },
  assignedDate: {
    type: Date,
    default: Date.now,
  },
  completedDate: {
    type: Date,
  },
});

const TrainingSessionSchema = new Schema<ITrainingSession>(
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
    trainees: [TraineeSchema],
  },
  { timestamps: true },
);

// Create indexes for efficient queries
TrainingSessionSchema.index({ createdBy: 1 });
TrainingSessionSchema.index({ agentId: 1 });
TrainingSessionSchema.index({ "trainees.userId": 1 });

export const TrainingSession = mongoose.model<ITrainingSession>(
  "TrainingSession",
  TrainingSessionSchema,
);
