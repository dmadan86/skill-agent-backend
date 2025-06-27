import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../../shared/middleware/authenticate";
import { AppError } from "../../../shared/errors/AppError";
import * as subscriptionService from "../services/SubscriptionService";
import { sendSuccess } from "../../../shared/utils/response.utils";
import { Request } from "express";
import { CreateCheckoutSessionInput } from "../validation/SubscriptionSchema";

/**
 * Create a Stripe checkout session
 * @restricted Authenticated users only
 */
export const createCheckoutSession = async (
  req: AuthenticatedRequest<{}, {}, CreateCheckoutSessionInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const userId = req.user.userId;
    const { price, plan_name, stripe_price_id, plan_id } = req.body;

    const result = await subscriptionService.createCheckoutSession({
      price,
      plan_name,
      stripe_price_id,
      userId,
      plan_id,
    });

    sendSuccess(res, {
      message: result?.message,
      ...result,
    }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Handle Stripe webhook events
 */
export const stripeWebhookController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sig = req.headers["stripe-signature"] as string;
    const payload = req.body;
    console.log(sig, "sig");

    if (!sig) {
      throw new AppError(
        "Missing Stripe signature",
        "MISSING_STRIPE_SIGNATURE",
        400
      );
    }

    const result = await subscriptionService.handleStripeWebhook(payload, sig);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get user billing details
 * @restricted Authenticated users only
 */
export const getUserBillingDetails = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const userId = req.user.userId;
    const billingDetails = await subscriptionService.getUserBillingDetails(userId);

    sendSuccess(res, {
      message: "User billing details fetched successfully",
      billingDetails,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel user subscription
 * @restricted Authenticated users only
 */
export const cancelSubscriptionController = async (
  req: AuthenticatedRequest<{ stripe_subscription_id: string }, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const subscriptionId = req.params.stripe_subscription_id;
    const cancelAtPeriodEnd = true;
    
    const result = await subscriptionService.cancelSubscription(subscriptionId, cancelAtPeriodEnd, req.user.userId);

    sendSuccess(res, {
      message: cancelAtPeriodEnd 
        ? "Subscription will be canceled at the end of the current billing period"
        : "Subscription canceled immediately",
      subscription: result,
    });
  } catch (error) {
    next(error);
  }
};