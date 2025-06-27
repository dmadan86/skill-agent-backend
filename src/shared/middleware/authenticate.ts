import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/tokenService';
import { AuthenticationError } from '../errors/AppError';
import { ApiKey } from '../models/ApiKey';
import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError';
import { sendError } from '../utils/response.utils';
import { SystemLogService } from '../services/systemLogService';
import logger from '../utils/logger';

export interface AuthenticatedRequest<
  P = {},
  ResBody = {},
  ReqBody = {},
  ReqQuery = {}
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user?: {
    userId: string;
    role: string;
    // organizationOwner: any;
    email?: string;
    key?: string;
  };
  file?: Express.Multer.File;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const apiKeyHeader = req.headers['x-api-key'];
    
    // Check if API key is provided
    if (apiKeyHeader) {
      const apiKeyValue = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;
      
      const apiKey = await ApiKey.findOne({ key: apiKeyValue });
      
      if (!apiKey) {
        throw new AuthenticationError('Invalid API key', 'AUTH_INVALID_API_KEY');
      }
      
      if (apiKey.expiresAt < new Date()) {
        apiKey.isActive = false;
        await apiKey.save();
        throw new AuthenticationError('API key has expired', 'AUTH_API_KEY_EXPIRED');
      }
      
      if (!apiKey.isActive) {
        throw new AuthenticationError('API key is inactive', 'AUTH_API_KEY_INACTIVE');
      }
      
      req.user = {
        key: apiKey.key,
        userId: apiKey.userId.toString(),
        role: "admin"
      };
      next();
      return;
    }
    
    // Check if JWT token is provided
    if (authHeader) {
      const parts = authHeader.split(' ');
      
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        throw new AuthenticationError('Invalid token format', 'AUTH_INVALID_FORMAT');
      }
      
      const token = parts[1];
      
      const payload = verifyAccessToken(token);
      
      req.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };
      next();
      return;
    }
    throw new AuthenticationError('No authentication credentials provided', 'AUTH_NO_CREDENTIALS');
  } catch (error) {
    next(error);
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required', 'AUTH_REQUIRED');
      }
      
      if (!roles.includes(req.user.role)) {
        throw new AuthenticationError('Insufficient permissions', 'AUTH_INSUFFICIENT_PERMISSIONS');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};