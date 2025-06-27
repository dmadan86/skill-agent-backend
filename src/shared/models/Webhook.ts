import mongoose, { Document, Schema } from "mongoose";

export interface IWebhook extends Document {
  userId: mongoose.Types.ObjectId;
  url: string;
  active: boolean;
  secret: string;
  events: string[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date;
  failureCount: number;
  maxRetries: number;
  retryInterval: number;
}

export type WebhookEvent = 
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'team.created'
  | 'team.updated'
  | 'team.deleted'
  | 'team.member_added'
  | 'team.member_removed'
  | 'agent.created'
  | 'agent.updated'
  | 'agent.deleted'
  | 'training.started'
  | 'training.completed'
  | 'training.failed'
  | 'report.generated'
  | 'user.nudged';

const WebhookSchema = new Schema<IWebhook>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    secret: {
      type: String,
      required: true,
    },
    events: {
      type: [String],
      required: true,
      validate: {
        validator: function(events: string[]) {
          return events.length > 0;
        },
        message: "At least one event must be specified"
      }
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    lastUsed: {
      type: Date,
    },
    failureCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    retryInterval: {
      type: Number, // in seconds
      default: 60,
    }
  },
  { timestamps: true }
);

WebhookSchema.index({ userId: 1 });
WebhookSchema.index({ events: 1 });

export const Webhook = mongoose.model<IWebhook>("Webhook", WebhookSchema); 