import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { sendError } from '../utils/response.utils';
import { ZodError } from 'zod';
import logger from '../utils/logger';
import { SystemLogService } from '../services/systemLogService';

export const errorHandler = async (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  logger.error(`Error: ${err.message}`, { 
    error: err.stack, 
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Log error to system logs
  await SystemLogService.logError(err, 'error-handler', {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.userId
  });

  // If the error is from our application
  if (err instanceof AppError) {
    sendError(
      res,
      err.code,
      err.message,
      err.status,
      err.details
    );
    return;
  }

  // Handle mongoose validation errors
  if (err.name === 'ValidationError') {
    await SystemLogService.logError(err, 'database', {
      type: 'validation',
      path: req.path,
      method: req.method
    });
    sendError(
      res,
      'VALIDATION_ERROR',
      'Validation failed',
      400,
      err
    );
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    await SystemLogService.logSecurity('invalid_token', 'auth', {
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    sendError(
      res,
      'AUTH_TOKEN_INVALID',
      'Invalid token',
      401,
      err.message
    );
    return;
  }

  if (err.name === 'TokenExpiredError') {
    await SystemLogService.logSecurity('expired_token', 'auth', {
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    sendError(
      res,
      'AUTH_TOKEN_EXPIRED',
      'Token expired',
      401,
      err.message
    );
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    await SystemLogService.logError(err, 'validation', {
      type: 'zod',
      path: req.path,
      method: req.method
    });
    sendError(
      res,
      'VALIDATION_ERROR',
      'Validation failed',
      400,
      err.errors
    );
    return;
  }

  // Default error handler for unhandled errors
  await SystemLogService.logError(err, 'system', {
    type: 'unhandled',
    path: req.path,
    method: req.method
  });
  sendError(
    res,
    'INTERNAL_SERVER_ERROR',
    'An unexpected error occurred',
    500,
    process.env.NODE_ENV === 'development' ? err.message : undefined
  );
};