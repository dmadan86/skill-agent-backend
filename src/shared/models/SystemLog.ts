import mongoose, { Document, Schema } from "mongoose";

export interface ISystemLog extends Document {
  level: "info" | "warning" | "error" | "critical";
  type: "system_status" | "error" | "security" | "performance";
  message: string;
  details?: Record<string, any>;
  status?: "up" | "down";
  startTime?: Date;
  endTime?: Date;
  timestamp: Date;
  source: string;
  metadata?: Record<string, any>;
}

const systemLogSchema = new Schema<ISystemLog>(
  {
    level: {
      type: String,
      enum: ["info", "warning", "error", "critical"],
      required: true,
    },
    type: {
      type: String,
      enum: ["system_status", "error", "security", "performance"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    details: {
      type: Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ["up", "down"],
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    source: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient querying
systemLogSchema.index({ timestamp: -1 });
systemLogSchema.index({ level: 1, type: 1 });
systemLogSchema.index({ source: 1 });

export const SystemLog = mongoose.model<ISystemLog>(
  "SystemLog",
  systemLogSchema,
);
