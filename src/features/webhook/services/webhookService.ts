import { Webhook, IWebhook } from "../../../shared/models/Webhook";
import { WebhookDelivery } from "../../../shared/models/WebhookDelivery";
import { AppError } from "../../../shared/errors/AppError";
import { generateWebhookSecret } from "../../../shared/services/webhookService";
import {
  CreateWebhookInput,
  UpdateWebhookInput,
} from "../validation/webhookSchema";

/**
 * Get all webhooks for a user
 */
export const getWebhooks = async (userId: string): Promise<IWebhook[]> => {
  return Webhook.find({ userId });
};

/**
 * Get a webhook by ID
 */
export const getWebhookById = async (
  id: string,
  userId: string,
): Promise<IWebhook> => {
  const webhook = await Webhook.findOne({ _id: id, userId });

  if (!webhook) {
    throw new AppError("Webhook not found", "NOT_FOUND", 404);
  }

  return webhook;
};

/**
 * Create a new webhook
 */
export const createWebhook = async (
  userId: string,
  webhookData: CreateWebhookInput,
): Promise<IWebhook> => {
  const secret = generateWebhookSecret();

  const webhook = new Webhook({
    ...webhookData,
    userId,
    secret,
    active: true,
    failureCount: 0,
  });

  return webhook.save();
};

/**
 * Update a webhook
 */
export const updateWebhook = async (
  id: string,
  userId: string,
  updateData: UpdateWebhookInput,
): Promise<IWebhook> => {
  const webhook = await Webhook.findOne({ _id: id, userId });

  if (!webhook) {
    throw new AppError("Webhook not found", "NOT_FOUND", 404);
  }

  // Update webhook properties
  Object.keys(updateData).forEach((key) => {
    if (updateData[key as keyof UpdateWebhookInput] !== undefined) {
      (webhook as any)[key] = updateData[key as keyof UpdateWebhookInput];
    }
  });

  return webhook.save();
};

/**
 * Delete a webhook
 */
export const deleteWebhook = async (
  id: string,
  userId: string,
): Promise<void> => {
  const webhook = await Webhook.findOneAndDelete({ _id: id, userId });

  if (!webhook) {
    throw new AppError("Webhook not found", "NOT_FOUND", 404);
  }
};

/**
 * Regenerate webhook secret
 */
export const regenerateSecret = async (
  id: string,
  userId: string,
): Promise<{ secret: string }> => {
  const webhook = await Webhook.findOne({ _id: id, userId });

  if (!webhook) {
    throw new AppError("Webhook not found", "NOT_FOUND", 404);
  }

  const secret = generateWebhookSecret();
  webhook.secret = secret;
  await webhook.save();

  return { secret };
};

/**
 * Get webhook delivery history
 */
export const getWebhookDeliveries = async (
  webhookId: string,
  userId: string,
  limit: number = 50,
  skip: number = 0,
): Promise<{
  deliveries: any[];
  total: number;
}> => {
  // Verify webhook exists and belongs to user
  const webhook = await Webhook.findOne({ _id: webhookId, userId });

  if (!webhook) {
    throw new AppError("Webhook not found", "NOT_FOUND", 404);
  }

  // Get total count
  const total = await WebhookDelivery.countDocuments({ webhookId });

  // Get deliveries with pagination
  const deliveries = await WebhookDelivery.find({ webhookId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    deliveries,
    total,
  };
};
