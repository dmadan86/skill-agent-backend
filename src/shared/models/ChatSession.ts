import mongoose, { Document, Schema } from "mongoose";

export interface IChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

export interface IChatSession extends Document {
  userId: mongoose.Types.ObjectId;
  agentId: mongoose.Types.ObjectId;
  sessionType: "TRAINING" | "EVALUATION" | "QUICK_PREP";
  status: "active" | "completed";
  sessionId?: string;
  startTime: Date;
  endTime?: Date;
  summary?: string;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  role: {
    type: String,
    enum: ["user", "assistant", "system"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const ChatSessionSchema = new Schema<IChatSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    agentId: {
      type: Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
    },
    sessionType: {
      type: String,
      enum: ["TRAINING", "EVALUATION", "QUICK_PREP"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    sessionId: {
      type: String,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    summary: {
      type: String,
    },
    messages: [ChatMessageSchema],
  },
  { timestamps: true },
);

// Create indexes for efficient queries
ChatSessionSchema.index({ userId: 1, startTime: -1 });
ChatSessionSchema.index({ agentId: 1 });
ChatSessionSchema.index({ status: 1 });

export const ChatSession = mongoose.model<IChatSession>(
  "ChatSession",
  ChatSessionSchema,
);
