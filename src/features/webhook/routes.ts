import { Router } from "express";
import * as webhookController from "./controllers/webhookController";
import { validate } from "../../shared/middleware/validate";
import { authenticate } from "../../shared/middleware/authenticate";
import { webhookSchemas } from "./validation/webhookSchema";

const router = Router();

// All webhook routes require authentication
router.use(authenticate);

// Get all webhooks
router.get("/", webhookController.getWebhooks);

// Get webhook by ID
router.get(
  "/:id",
  validate(webhookSchemas.getWebhookSchema),
  webhookController.getWebhook,
);

// Create webhook
router.post(
  "/",
  validate(webhookSchemas.createWebhookSchema),
  webhookController.createWebhook,
);

// Update webhook
router.put(
  "/:id",
  validate({
    ...webhookSchemas.getWebhookSchema,
    ...webhookSchemas.updateWebhookSchema,
  }),
  webhookController.updateWebhook,
);

// Delete webhook
router.delete(
  "/:id",
  validate(webhookSchemas.getWebhookSchema),
  webhookController.deleteWebhook,
);

// Regenerate webhook secret
router.post(
  "/:id/regenerate-secret",
  validate(webhookSchemas.getWebhookSchema),
  webhookController.regenerateSecret,
);

// Get webhook deliveries (history)
router.get(
  "/:id/deliveries",
  validate({
    ...webhookSchemas.getWebhookSchema,
    ...webhookSchemas.webhookDeliveriesQuerySchema,
  }),
  webhookController.getWebhookDeliveries,
);

export default router;
