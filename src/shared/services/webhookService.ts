import crypto from "crypto";
import axios from "axios";
import { Webhook, IWebhook, WebhookEvent } from "../models/Webhook";
import { WebhookDelivery, IWebhookDelivery } from "../models/WebhookDelivery";
import logger from "../utils/logger";

/**
 * Generate a random webhook secret
 */
export const generateWebhookSecret = (): string => {
  const randomBytes = crypto.randomBytes(16).toString("hex");
  return `wh_${randomBytes}`;
};

/**
 * Create an HMAC signature for a webhook payload
 */
export const createSignature = (payload: any, secret: string): string => {
  const stringPayload = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(stringPayload)
    .digest("hex");
  return `sha256=${signature}`;
};

/**
 * Trigger an event and deliver to all matching webhooks
 */
export const triggerWebhookEvent = async (
  event: WebhookEvent,
  payload: Record<string, any>,
  userId: string,
): Promise<void> => {
  try {
    // Find all active webhooks that subscribe to this event for this user
    const webhooks = await Webhook.find({
      userId,
      active: true,
      events: event,
    });

    if (webhooks.length === 0) {
      return; // No webhooks to deliver to
    }

    // Create webhook delivery records and queue for processing
    const deliveryPromises = webhooks.map(async (webhook) => {
      const delivery = new WebhookDelivery({
        webhookId: webhook._id,
        userId,
        event,
        payload,
        status: "pending",
        attempts: 0,
        nextRetry: new Date(),
      });

      await delivery.save();

      // Fire and forget delivery in the background
      processWebhookDelivery(delivery, webhook).catch((err) => {
        logger.error("Error processing webhook delivery:", {
          webhookId: webhook._id,
          deliveryId: delivery._id,
          error: err.message,
        });
      });
    });

    await Promise.all(deliveryPromises);
  } catch (error) {
    logger.error("Error triggering webhook event:", {
      event,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Process a webhook delivery with retries
 */
export const processWebhookDelivery = async (
  delivery: IWebhookDelivery,
  webhook: IWebhook,
): Promise<void> => {
  try {
    // Increment attempt counter
    delivery.attempts += 1;

    // Create signature for the payload
    const signature = createSignature(delivery.payload, webhook.secret);

    // Make the HTTP request to the webhook URL
    const response = await axios.post(webhook.url, delivery.payload, {
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": delivery.event,
        "X-Webhook-Id": delivery._id,
      },
      timeout: 10000, // 10 second timeout
    });

    // Update webhook and delivery on success
    delivery.status = "success";
    delivery.statusCode = response.status;
    delivery.responseBody = JSON.stringify(response.data).slice(0, 1000); // Limit response size
    delivery.completedAt = new Date();
    delivery.nextRetry = undefined;

    webhook.lastUsed = new Date();
    webhook.failureCount = 0;

    await Promise.all([delivery.save(), webhook.save()]);

    logger.info("Webhook delivery successful", {
      webhookId: webhook._id,
      deliveryId: delivery._id,
      event: delivery.event,
    });
  } catch (error: any) {
    // Handle error and determine if we should retry
    const statusCode = error.response?.status;
    const errorMessage = error.message || "Unknown error";
    const responseBody = error.response?.data
      ? JSON.stringify(error.response.data).slice(0, 1000)
      : undefined;

    // Update delivery record with error details
    delivery.statusCode = statusCode;
    delivery.errorMessage = errorMessage;
    delivery.responseBody = responseBody;

    // Determine if we should retry based on status code and attempt count
    const shouldRetry =
      delivery.attempts < webhook.maxRetries &&
      (!statusCode || statusCode >= 500 || statusCode === 429);

    if (shouldRetry) {
      // Calculate next retry with exponential backoff
      const backoffSeconds = Math.min(
        webhook.retryInterval * Math.pow(2, delivery.attempts - 1),
        3600, // Max 1 hour backoff
      );

      delivery.status = "pending";
      delivery.nextRetry = new Date(Date.now() + backoffSeconds * 1000);

      logger.warn("Webhook delivery failed, will retry", {
        webhookId: webhook._id,
        deliveryId: delivery._id,
        attempt: delivery.attempts,
        nextRetry: delivery.nextRetry,
        error: errorMessage,
      });
    } else {
      // Max retries reached, mark as failed
      delivery.status = "failed";
      delivery.nextRetry = undefined;
      delivery.completedAt = new Date();

      // Increment webhook failure count
      webhook.failureCount += 1;

      logger.error("Webhook delivery failed permanently", {
        webhookId: webhook._id,
        deliveryId: delivery._id,
        attempts: delivery.attempts,
        error: errorMessage,
      });
    }

    await Promise.all([delivery.save(), webhook.save()]);
  }
};

/**
 * Retry failed webhook deliveries that are due for retry
 */
export const retryPendingWebhooks = async (): Promise<number> => {
  try {
    // Find deliveries that need to be retried
    const pendingDeliveries = await WebhookDelivery.find({
      status: "pending",
      nextRetry: { $lte: new Date() },
    }).limit(100);

    if (pendingDeliveries.length === 0) {
      return 0;
    }

    // Process each pending delivery
    const promises = pendingDeliveries.map(async (delivery) => {
      try {
        const webhook = await Webhook.findById(delivery.webhookId);

        if (!webhook || !webhook.active) {
          // Webhook was deleted or deactivated, mark delivery as failed
          delivery.status = "failed";
          delivery.errorMessage = "Webhook no longer exists or is inactive";
          delivery.completedAt = new Date();
          delivery.nextRetry = undefined;
          await delivery.save();
          return;
        }

        // Process the delivery
        await processWebhookDelivery(delivery, webhook);
      } catch (error) {
        logger.error("Error processing pending webhook:", {
          deliveryId: delivery._id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    await Promise.all(promises);
    return pendingDeliveries.length;
  } catch (error) {
    logger.error("Error retrying pending webhooks:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return 0;
  }
};

/**
 * Custom hook to trigger webhook events
 * @param event The event to trigger
 * @param data The data to send with the webhook
 * @param userId The user ID associated with the event
 */
export const useWebhookTrigger = async (
  event: WebhookEvent,
  data: any,
  userId: string,
): Promise<void> => {
  const activeWebhooks = await Webhook.find({
    events: event,
    active: true,
  });

  if (activeWebhooks.length > 0) {
    await triggerWebhookEvent(event, data, userId);
  }
};
