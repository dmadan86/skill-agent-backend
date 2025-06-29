import logger from "./logger";

/**
 * Utility functions for standardized logging throughout the application
 */

/**
 * Log database operations
 */
export const dbLogger = {
  /**
   * Log a successful database connection
   */
  connected: (dbName: string) => {
    logger.info(`Database connected: ${dbName}`);
  },

  /**
   * Log a database connection error
   */
  connectionError: (error: unknown) => {
    logger.error("Database connection error", { error });
  },

  /**
   * Log a database query
   */
  query: (collection: string, operation: string, filter?: object) => {
    logger.debug(`DB Query: ${collection} - ${operation}`, { filter });
  },

  /**
   * Log a successful database operation
   */
  success: (collection: string, operation: string, docId?: string) => {
    const docInfo = docId ? ` - ${docId}` : "";
    logger.debug(`DB Success: ${collection} - ${operation}${docInfo}`);
  },

  /**
   * Log a database operation error
   */
  error: (collection: string, operation: string, error: unknown) => {
    logger.error(`DB Error: ${collection} - ${operation}`, { error });
  },
};

/**
 * Log authentication related events
 */
export const authLogger = {
  /**
   * Log a successful login
   */
  login: (userId: string, method = "email") => {
    logger.info(`Login success: ${userId} via ${method}`);
  },

  /**
   * Log a failed login attempt
   */
  loginFailed: (email: string, reason: string) => {
    logger.warn(`Login failed: ${email}`, { reason });
  },

  /**
   * Log a logout
   */
  logout: (userId: string) => {
    logger.info(`Logout: ${userId}`);
  },

  /**
   * Log a registration
   */
  register: (userId: string, method = "email") => {
    logger.info(`User registered: ${userId} via ${method}`);
  },
};

/**
 * Log API related events
 */
export const apiLogger = {
  /**
   * Log an API request (for detailed logging beyond the http middleware)
   */
  request: (method: string, path: string, userId?: string) => {
    const userInfo = userId ? ` - User: ${userId}` : "";
    logger.debug(`API Request: ${method} ${path}${userInfo}`);
  },

  /**
   * Log an API response
   */
  response: (
    method: string,
    path: string,
    statusCode: number,
    responseTime: number,
  ) => {
    if (statusCode >= 400) {
      logger.warn(
        `API Response: ${method} ${path} - Status: ${statusCode} - Time: ${responseTime}ms`,
      );
    } else {
      logger.debug(
        `API Response: ${method} ${path} - Status: ${statusCode} - Time: ${responseTime}ms`,
      );
    }
  },

  /**
   * Log an API error
   */
  error: (method: string, path: string, error: unknown, userId?: string) => {
    const userInfo = userId ? ` - User: ${userId}` : "";
    logger.error(`API Error: ${method} ${path}${userInfo}`, { error });
  },
};

/**
 * Log external service interactions
 */
export const serviceLogger = {
  /**
   * Log an external service request
   */
  request: (service: string, operation: string, params?: object) => {
    logger.debug(`Service Request: ${service} - ${operation}`, { params });
  },

  /**
   * Log a successful external service response
   */
  success: (service: string, operation: string, responseTime?: number) => {
    const timeInfo = responseTime ? ` - Time: ${responseTime}ms` : "";
    logger.debug(`Service Success: ${service} - ${operation}${timeInfo}`);
  },

  /**
   * Log an external service error
   */
  error: (service: string, operation: string, error: unknown) => {
    logger.error(`Service Error: ${service} - ${operation}`, { error });
  },
};

/**
 * Log websocket events
 */
export const socketLogger = {
  /**
   * Log a socket connection
   */
  connect: (socketId: string, userId?: string) => {
    const userInfo = userId ? ` - User: ${userId}` : "";
    logger.info(`Socket connected: ${socketId}${userInfo}`);
  },

  /**
   * Log a socket disconnection
   */
  disconnect: (socketId: string, reason: string) => {
    logger.info(`Socket disconnected: ${socketId} - Reason: ${reason}`);
  },

  /**
   * Log a socket event
   */
  event: (socketId: string, event: string, userId?: string) => {
    const userInfo = userId ? ` - User: ${userId}` : "";
    logger.debug(`Socket Event: ${socketId} - ${event}${userInfo}`);
  },

  /**
   * Log a socket error
   */
  error: (socketId: string, error: unknown) => {
    logger.error(`Socket Error: ${socketId}`, { error });
  },
};
