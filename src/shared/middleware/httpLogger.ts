import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import logger from '../utils/logger';

/**
 * HTTP request logger middleware
 */
export const httpLogger = morgan(
  (tokens, req, res) => {
    const message = [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens['response-time'](req, res), 'ms',
      'ip:', (req as Request).ip ?? req.headers['x-forwarded-for'] ?? '-',
      'user-agent:', req.headers['user-agent'] ?? '-',
    ].join(' ');
    
    return message;
  },
  {
    stream: {
      write: (message: string) => {
        logger.http(message.trim());
      },
    },
  }
);

/**
 * Middleware to log request body for debugging in development
 */
export const requestBodyLogger = (req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0 && req.path !== '/api/auth/login') {
    logger.debug(`Request Body: ${JSON.stringify(req.body, null, 2)}`);
  }
  next();
}; 