// src/shared/errors/AppError.ts (base error class)
export class AppError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(
    message: string,
    code: string,
    status: number,
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Authentication specific errors
export class AuthenticationError extends AppError {
  constructor(message: string, code: string, details?: unknown) {
    super(message, code, 401, details);
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  constructor(details?: unknown) {
    super("Invalid email or password", "AUTH_INVALID_CREDENTIALS", details);
  }
}

export class EmailInUseError extends AppError {
  constructor(details?: unknown) {
    super("Email is already in use", "AUTH_EMAIL_IN_USE", 409, details);
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor(details?: unknown) {
    super("Token has expired", "AUTH_TOKEN_EXPIRED", details);
  }
}

export class InvalidTokenError extends AuthenticationError {
  constructor(details?: unknown) {
    super("Invalid or malformed token", "AUTH_TOKEN_INVALID", details);
  }
}

export class GoogleAuthError extends AuthenticationError {
  constructor(message: string, details?: unknown) {
    super(message, "AUTH_GOOGLE_FAILED", details);
  }
}

export class AccountLockedError extends AuthenticationError {
  constructor(details?: unknown) {
    super(
      "Account is locked due to too many failed attempts",
      "AUTH_ACCOUNT_LOCKED",
      details
    );
  }
}

// src/shared/errors/AppError.ts (agent error types)

// Not Found Error - Used when an agent can't be found
export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found", details?: unknown) {
    super(message, "RESOURCE_NOT_FOUND", 404, details);
  }
}

// Forbidden Error - Used when a user doesn't have permission
export class ForbiddenError extends AppError {
  constructor(message: string = "Permission denied", details?: unknown) {
    super(message, "FORBIDDEN", 403, details);
  }
}

// Validation Error - Used for invalid agent data
export class ValidationError extends AppError {
  constructor(message: string = "Validation failed", details?: unknown) {
    super(message, "VALIDATION_FAILED", 400, details);
  }
}

// Agent Specific Errors
export class AgentNotFoundError extends NotFoundError {
  constructor(details?: unknown) {
    super("Agent not found", details);
  }
}

export class AgentAccessDeniedError extends ForbiddenError {
  constructor(details?: unknown) {
    super("You do not have permission to access this agent", details);
  }
}

export class DuplicateAgentNameError extends AppError {
  constructor(details?: unknown) {
    super(
      "An agent with this name already exists",
      "AGENT_NAME_DUPLICATE",
      409,
      details
    );
  }
}
export class AgentInUseError extends AppError {
  constructor(details?: unknown) {
    super(
      "Agent is currently in use and cannot be modified",
      "AGENT_IN_USE",
      409,
      details
    );
  }
}

export class AgentLimitExceededError extends AppError {
  constructor(details?: unknown) {
    super(
      "You have reached the maximum number of allowed agents",
      "AGENT_LIMIT_EXCEEDED",
      403,
      details
    );
  }
}

export class RetellApiError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "RETELL_API_ERROR", 500, details);
  }
}

export class RetellAgentCreationError extends RetellApiError {
  constructor(details?: unknown) {
    super("Failed to create Retell agent", details);
  }
}

export class RetellAgentUpdateError extends RetellApiError {
  constructor(details?: unknown) {
    super("Failed to update Retell agent", details);
  }
}

export class RetellAgentDeletionError extends RetellApiError {
  constructor(details?: unknown) {
    super("Failed to delete Retell agent", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized", details?: unknown) {
    super(message, "UNAUTHORIZED", 401, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Conflict", details?: unknown) {
    super(message, "CONFLICT", 409, details);
  }
}

// Email specific errors
export class EmailSendError extends AppError {
  constructor(details?: unknown) {
    super("Failed to send email", "EMAIL_SEND_FAILED", 500, details);
  }
}
