import Stripe from "stripe";
import { AppError, NotFoundError } from "../../../shared/errors/AppError";
import { dbLogger } from "../../../shared/utils/loggerUtils";
import User from "../../../shared/models/User";
import { UsageLogs } from "../../../shared/models/UsageLogs";
import { Subscription } from "../../../shared/models/Subscription";
import { Invoice } from "../../../shared/models/Invoice";

import {
  handleCheckoutSessionCompleted,
  handleSubscriptionEvent,
  handleTrialWillEnd,
  handleInvoiceEvent,
} from "./webhookEventHandlers";

import { CreateCheckoutSessionInput } from "../validation/SubscriptionSchema";
import { BillingPlan } from "../../../shared/models/BillingPlan";
import { FREEMIUM_PLAN_ID } from "../../../shared/utils/constants";

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY as string;
const stripe = new Stripe(STRIPE_KEY, {
  apiVersion: "2025-05-28.basil",
});

/**
 * Create a Stripe checkout session
 */
export const createCheckoutSession = async (
  data: CreateCheckoutSessionInput & { userId: string },
) => {
  try {
    const user = await User.findById(data.userId);
    if (!user) {
      console.error("User not found");
      return null;
    }

    const existingUser = await UsageLogs.findOne({ userId: data?.userId });
    let stripeCustomer;
    if (existingUser && existingUser.customer_id) {
      stripeCustomer = await stripe.customers.retrieve(
        existingUser.customer_id,
      );

      if (stripeCustomer) {
        const existingSubscription = await stripe.subscriptions.list({
          customer: stripeCustomer.id,
          status: "active",
        });
        const activeSubscription = existingSubscription?.data[0];

        const updatedSubscription = await stripe.subscriptions.update(
          activeSubscription.id,
          {
            items: [
              {
                id: activeSubscription.items.data[0].id,
                price: data.stripe_price_id,
              },
            ],
            proration_behavior: "always_invoice",
            metadata: {
              price: data?.price,
              plan_name: data.plan_name,
              stripe_price_id: data.stripe_price_id,
              user_id: data.userId,
              plan_id: data?.plan_id,
            },
          } as Stripe.SubscriptionUpdateParams,
        );

        const latestInvoice = await stripe.invoices.retrieve(
          String(updatedSubscription.latest_invoice),
        );

        return {
          type: "subscription_updated",
          subscription: {
            id: updatedSubscription.id,
            plan: updatedSubscription.metadata.plan_name,
            price: parseFloat(updatedSubscription.metadata.price),
            plan_id: updatedSubscription.metadata.plan_id,
          },
          invoice_url: latestInvoice.hosted_invoice_url,
          message: `Your subscription has been successfully upgraded to the ${data.plan_name} plan.`,
        };
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      billing_address_collection: "required",
      line_items: [
        {
          price: data.stripe_price_id,
          quantity: 1,
        },
      ],
      metadata: {
        price: data?.price,
        plan_name: data.plan_name,
        stripe_price_id: data.stripe_price_id,
        user_id: data.userId,
        plan_id: data?.plan_id,
      },
      success_url: `${process.env.FRONTEND_URL}/dashboard/settings/billing`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard`,
    } as Stripe.Checkout.SessionCreateParams);

    return {
      type: "subscription_created",
      session_id: session.id,
      message: `You have successfully subscribed to the ${data.plan_name} plan.`,
    };
  } catch (error) {
    console.log(error);
  }
};

/**
 * Handle Stripe webhook events
 */
export const handleStripeWebhook = async (
  payload: Buffer,
  sig: string,
): Promise<{ received: boolean; type: string }> => {
  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET as string;
    const event = stripe.webhooks.constructEvent(payload, sig, secret);

    // Handle events in proper order
    switch (event.type) {
      case "checkout.session.completed":
        console.log("⭐ Processing checkout completion");
        await handleCheckoutSessionCompleted(event);
        break;

      case "customer.subscription.created":
        console.log("📝 New subscription created");
        await handleSubscriptionEvent(event, "created");
        break;

      case "customer.subscription.trial_will_end":
        console.log(
          "⚠️ Trial ending soon - This should NOT happen in freemium model",
        );
        await handleTrialWillEnd(event);
        break;

      case "customer.subscription.updated":
        console.log("🔄 Subscription updated");
        await handleSubscriptionEvent(event, "updated");
        break;

      case "customer.subscription.deleted":
        console.log("❌ Subscription deleted");
        await handleSubscriptionEvent(event, "deleted");
        break;

      case "invoice.created":
        console.log("📋 Invoice created");
        await handleInvoiceEvent(event, "created");
        break;

      case "invoice.finalized":
        console.log("✅ Invoice finalized");
        await handleInvoiceEvent(event, "finalized");
        break;

      case "invoice.payment_succeeded":
        console.log("💰 Payment succeeded");
        await handleInvoiceEvent(event, "succeeded");
        break;

      case "invoice.paid":
        console.log("✅ Invoice paid");
        await handleInvoiceEvent(event, "paid");
        break;

      case "invoice.payment_failed":
        console.log("❌ Payment failed");
        await handleInvoiceEvent(event, "failed");
        break;

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    return {
      received: true,
      type: event.type,
    };
  } catch (error) {
    dbLogger.error("Subscription", "handleStripeWebhook", error);
    throw new AppError(
      "Failed to handle Stripe webhook event",
      "STRIPE_WEBHOOK_ERROR",
      500,
    );
  }
};

/**
 * Get user billing details including UsageLogs, Subscription, and Invoices
 */
export const getUserBillingDetails = async (userId: string) => {
  try {
    const usageLog = await UsageLogs.findOne({ userId }).sort({
      createdAt: -1,
    });
    if (!usageLog) {
      throw new AppError("Usage log not found", "USAGE_LOG_NOT_FOUND", 404);
    }

    const customerId = usageLog.customer_id;
    const subscription = await Subscription.findOne({ userId, isActive: true });
    const invoices = await Invoice.find({ customer_id: customerId }).sort({
      createdAt: -1,
    });

    return {
      usageLog,
      subscription,
      invoices,
    };
  } catch (error) {
    console.error("Error fetching user billing details:", error);
    throw new AppError(
      "Failed to fetch user billing details",
      "BILLING_DETAILS_ERROR",
      500,
    );
  }
};

/**
 * Cancel user subscription using UsageLogs integration
 */
export const cancelSubscription = async (
  subscription_id: string,
  cancelAtPeriodEnd: boolean = false,
  userId: string,
) => {
  try {
    let stripeSubscription =
      await stripe.subscriptions.retrieve(subscription_id);
    if (!stripeSubscription) {
      throw new AppError(
        "Subscription not found in Stripe",
        "STRIPE_SUBSCRIPTION_NOT_FOUND",
        404,
      );
    }

    const freemiumPlan = await BillingPlan.findById(FREEMIUM_PLAN_ID);
    if (!freemiumPlan) {
      throw new NotFoundError("Freemium plan not found");
    }

    let canceledSubscription;

    if (cancelAtPeriodEnd) {
      canceledSubscription = await stripe.subscriptions.update(
        subscription_id,
        {
          cancel_at_period_end: true,
          metadata: {
            subscription_status: "subscription_canceled",
            plan_id: String(freemiumPlan._id),
          },
        } as Stripe.SubscriptionUpdateParams,
      );
    } else {
      canceledSubscription = await stripe.subscriptions.cancel(subscription_id);
    }

    return {
      message: `Your subscription has been successfully canceled.`,
      subscription: canceledSubscription,
      isActive: false,
    };
  } catch (error) {
    dbLogger.error("Subscription", "cancelSubscription", error);

    if (error instanceof Stripe.errors.StripeError) {
      throw new AppError(
        `Stripe error: ${error.message}`,
        "STRIPE_CANCELLATION_ERROR",
        400,
      );
    }

    // Re-throw AppErrors as-is
    if (error instanceof AppError) {
      throw error;
    }

    // Handle unexpected errors
    throw new AppError(
      "Failed to cancel subscription",
      "SUBSCRIPTION_CANCELLATION_ERROR",
      500,
    );
  }
};
