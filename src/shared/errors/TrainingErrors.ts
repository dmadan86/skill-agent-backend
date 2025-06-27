// src/shared/errors/TrainingErrors.ts
import { AppError, NotFoundError, ForbiddenError } from './AppError';

// Training Session specific errors
export class TrainingSessionNotFoundError extends NotFoundError {
  constructor(details?: unknown) {
    super('Training session not found', details);
  }
}

export class TrainingSessionAccessDeniedError extends ForbiddenError {
  constructor(details?: unknown) {
    super('You do not have permission to access this training session', details);
  }
}

export class TraineeNotAssignedError extends ForbiddenError {
  constructor(details?: unknown) {
    super('User is not assigned to this training session', details);
  }
}

export class TraineeAlreadyAssignedError extends AppError {
  constructor(details?: unknown) {
    super('User is already assigned to this training session', 'TRAINEE_ALREADY_ASSIGNED', 409, details);
  }
}

export class TrainingProgressNotFoundError extends NotFoundError {
  constructor(details?: unknown) {
    super('Training progress not found', details);
  }
}

export class DepartmentNotFoundError extends NotFoundError {
  constructor(details?: unknown) {
    super('Department not found', details);
  }
}

export class InvalidTrainingStateError extends AppError {
  constructor(message: string = 'Invalid training state transition', details?: unknown) {
    super(message, 'INVALID_TRAINING_STATE', 400, details);
  }
}

export class NoTraineesSpecifiedError extends AppError {
  constructor(details?: unknown) {
    super('No trainees specified for assignment', 'NO_TRAINEES_SPECIFIED', 400, details);
  }
}

export class AnalysisServiceError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'ANALYSIS_SERVICE_ERROR', 500, details);
  }
}