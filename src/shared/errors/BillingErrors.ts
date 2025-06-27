import { AppError } from './AppError';

export class BillingPlanNotFoundError extends AppError {
  constructor() {
    super('Billing plan not found', 'BILLING_PLAN_NOT_FOUND', 404);
  }
}

export class BillingPlanExistsError extends AppError {
  constructor() {
    super('A billing plan with this name already exists', 'BILLING_PLAN_EXISTS', 409);
  }
}

export class SubscriptionNotFoundError extends AppError {
  constructor() {
    super('Subscription not found', 'SUBSCRIPTION_NOT_FOUND', 404);
  }
}

export class SubscriptionExistsError extends AppError {
  constructor() {
    super('An active subscription already exists for this team', 'SUBSCRIPTION_EXISTS', 409);
  }
}

export class InvoiceNotFoundError extends AppError {
  constructor() {
    super('Invoice not found', 'INVOICE_NOT_FOUND', 404);
  }
}

export class PaymentMethodInvalidError extends AppError {
  constructor() {
    super('Payment method is invalid or incomplete', 'PAYMENT_METHOD_INVALID', 400);
  }
}

export class PaymentProcessingError extends AppError {
  constructor(message: string = 'Payment processing failed') {
    super(message, 'PAYMENT_PROCESSING_ERROR', 400);
  }
}

export class SubscriptionCancellationError extends AppError {
  constructor() {
    super('Failed to cancel subscription', 'SUBSCRIPTION_CANCELLATION_ERROR', 400);
  }
}

export class TeamSubscriptionAccessDeniedError extends AppError {
  constructor() {
    super('You do not have permission to manage this team\'s subscription', 'SUBSCRIPTION_ACCESS_DENIED', 403);
  }
}

export class TeamInvoiceAccessDeniedError extends AppError {
  constructor() {
    super('You do not have permission to access this team\'s invoices', 'INVOICE_ACCESS_DENIED', 403);
  }
}

export class BillingAccessDeniedError extends AppError {
  constructor() {
    super('You do not have permission to perform this billing operation', 'BILLING_ACCESS_DENIED', 403);
  }
}

export class InvoiceGenerationError extends AppError {
  constructor() {
    super('Failed to generate invoice', 'INVOICE_GENERATION_ERROR', 500);
  }
} 