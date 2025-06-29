// src/features/apikey/routes.ts
import { Router } from "express";
import * as apiKeyController from "./controllers/apikeyController";
import { validate } from "../../shared/middleware/validate";
import { authenticate } from "../../shared/middleware/authenticate";
import { apiKeySchemas } from "./validation/apiKeySchema";

const router = Router();

// All API key routes require authentication
router.use(authenticate);

// Get API keys
router.get("/", apiKeyController.getApiKeys);

// Generate API key
router.post(
  "/generate",
  validate(apiKeySchemas.createApiKeySchema),
  apiKeyController.createApiKey,
);

// Revoke API key
router.delete(
  "/:id",
  validate(apiKeySchemas.revokeApiKeySchema),
  apiKeyController.revokeApiKey,
);

export default router;
