import { Response } from 'express';
import { ApiResponse } from '../types/api.types';
import logger from './logger';

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200, meta?: Record<string, unknown>): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta,
  };
  logger.debug('Response sent: ' +  JSON.stringify(response) );
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  code: string,
  message: string,
  statusCode = 500,
  details?: unknown
): Response => {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      status: statusCode,
      details,
    },
  };
  logger.debug('Error response sent', { response });
  return res.status(statusCode).json(response);
};