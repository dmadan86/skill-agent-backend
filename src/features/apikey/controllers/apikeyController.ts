import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../../shared/middleware/authenticate";
import * as apiKeyService from "../services/apiKeyService";
import { sendSuccess } from "../../../shared/utils/response.utils";
import { AppError } from "../../../shared/errors/AppError";
import {
  CreateApiKeyInput,
  RevokeApiKeyInput,
} from "../validation/apiKeySchema";

export const getApiKeys = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const apiKeys = await apiKeyService.getApiKeys(req.user.userId);
    sendSuccess(res, { data: apiKeys });
  } catch (error) {
    next(error);
  }
};

export const createApiKey = async (
  req: AuthenticatedRequest<{}, {}, CreateApiKeyInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const apiKey = await apiKeyService.createApiKey(
      req.user.userId,
      req.body.name,
    );
    sendSuccess(res, { data: apiKey }, 201);
  } catch (error) {
    next(error);
  }
};

export const revokeApiKey = async (
  req: AuthenticatedRequest<RevokeApiKeyInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    await apiKeyService.revokeApiKey(req.params.id, req.user.userId);
    sendSuccess(res, { message: "API key revoked successfully" });
  } catch (error) {
    next(error);
  }
};
