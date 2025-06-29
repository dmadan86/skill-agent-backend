// src/shared/errors/EvaluationErrors.ts
import { AppError, NotFoundError, ForbiddenError } from "./AppError";

// Evaluation specific errors
export class EvaluationNotFoundError extends NotFoundError {
  constructor(details?: unknown) {
    super("Evaluation not found", details);
  }
}

export class EvaluationAccessDeniedError extends ForbiddenError {
  constructor(details?: unknown) {
    super("You do not have permission to access this evaluation", details);
  }
}

export class AssigneeNotFoundError extends NotFoundError {
  constructor(details?: unknown) {
    super("Assignee not found in this evaluation", details);
  }
}

export class AssigneeAlreadyExistsError extends AppError {
  constructor(details?: unknown) {
    super(
      "Assignee is already part of this evaluation",
      "ASSIGNEE_ALREADY_EXISTS",
      409,
      details,
    );
  }
}

export class InvalidEvaluationStateError extends AppError {
  constructor(
    message: string = "Invalid evaluation state transition",
    details?: unknown,
  ) {
    super(message, "INVALID_EVALUATION_STATE", 400, details);
  }
}

export class EvaluationInProgressError extends AppError {
  constructor(details?: unknown) {
    super(
      "Cannot modify an evaluation that is in progress or completed",
      "EVALUATION_IN_PROGRESS",
      400,
      details,
    );
  }
}

export class ReportGenerationError extends AppError {
  constructor(
    message: string = "Failed to generate evaluation report",
    details?: unknown,
  ) {
    super(message, "REPORT_GENERATION_ERROR", 500, details);
  }
}

export class EvaluationAnalysisError extends AppError {
  constructor(
    message: string = "Failed to analyze evaluation transcript",
    details?: unknown,
  ) {
    super(message, "EVALUATION_ANALYSIS_ERROR", 500, details);
  }
}
