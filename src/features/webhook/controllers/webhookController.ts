import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../../shared/middleware/authenticate";
import * as webhookService from "../services/webhookService";
import { sendSuccess } from "../../../shared/utils/response.utils";
import { AppError } from "../../../shared/errors/AppError";
import {
  CreateWebhookInput,
  UpdateWebhookInput,
  GetWebhookInput,
} from "../validation/webhookSchema";
/**
 * Get all webhooks for the authenticated user
 */
export const getWebhooks = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const webhooks = await webhookService.getWebhooks(req.user.userId);
    sendSuccess(res, { data: webhooks });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a webhook by ID
 */
export const getWebhook = async (
  req: AuthenticatedRequest<GetWebhookInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const webhook = await webhookService.getWebhookById(
      req.params.id,
      req.user.userId,
    );
    sendSuccess(res, { data: webhook });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new webhook
 */
export const createWebhook = async (
  req: AuthenticatedRequest<{}, {}, CreateWebhookInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }
    console.log("Webhook Body:", req.body); // Log the request body

    const webhook = await webhookService.createWebhook(
      req.user.userId,
      req.body,
    );

    // Return webhook with secret (only returned on create)
    sendSuccess(res, { data: webhook }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a webhook
 */
export const updateWebhook = async (
  req: AuthenticatedRequest<GetWebhookInput, {}, UpdateWebhookInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const webhook = await webhookService.updateWebhook(
      req.params.id,
      req.user.userId,
      req.body,
    );
    sendSuccess(res, { data: webhook });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a webhook
 */
export const deleteWebhook = async (
  req: AuthenticatedRequest<GetWebhookInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    await webhookService.deleteWebhook(req.params.id, req.user.userId);
    sendSuccess(res, { message: "Webhook deleted successfully" });
  } catch (error) {
    next(error);
  }
};

/**
 * Regenerate webhook secret
 */
export const regenerateSecret = async (
  req: AuthenticatedRequest<GetWebhookInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const result = await webhookService.regenerateSecret(
      req.params.id,
      req.user.userId,
    );
    sendSuccess(res, { data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Get webhook delivery history
 */
export const getWebhookDeliveries = async (
  req: AuthenticatedRequest<GetWebhookInput> & {
    query: { limit?: string; skip?: string };
  },
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    const skip = req.query.skip ? parseInt(req.query.skip, 10) : 0;

    const result = await webhookService.getWebhookDeliveries(
      req.params.id,
      req.user.userId,
      limit,
      skip,
    );
    sendSuccess(res, { data: result });
  } catch (error) {
    next(error);
  }
};
