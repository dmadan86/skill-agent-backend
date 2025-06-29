import mongoose, { Document, Schema } from "mongoose";
import { WebhookEvent } from "./Webhook";

export interface IWebhookDelivery extends Document {
  webhookId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  event: WebhookEvent;
  payload: Record<string, any>;
  status: "pending" | "success" | "failed";
  statusCode?: number;
  responseBody?: string;
  errorMessage?: string;
  attempts: number;
  nextRetry?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const WebhookDeliverySchema = new Schema<IWebhookDelivery>(
  {
    webhookId: {
      type: Schema.Types.ObjectId,
      ref: "Webhook",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    event: {
      type: String,
      required: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    statusCode: {
      type: Number,
    },
    responseBody: {
      type: String,
    },
    errorMessage: {
      type: String,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    nextRetry: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

WebhookDeliverySchema.index({ webhookId: 1 });
WebhookDeliverySchema.index({ userId: 1 });
WebhookDeliverySchema.index({ event: 1 });
WebhookDeliverySchema.index({ status: 1 });
WebhookDeliverySchema.index({ nextRetry: 1 }, { sparse: true });

export const WebhookDelivery = mongoose.model<IWebhookDelivery>(
  "WebhookDelivery",
  WebhookDeliverySchema,
);
