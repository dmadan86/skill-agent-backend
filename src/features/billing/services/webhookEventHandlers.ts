import Stripe from "stripe";
import { UsageLogs } from "../../../shared/models/UsageLogs";
import { dbLogger } from "../../../shared/utils/loggerUtils";
import { AppError } from "../../../shared/errors/AppError";
import { Subscription } from "../../../shared/models/Subscription";
import User from "../../../shared/models/User";
import { Payment } from "../../../shared/models/Payment";
import { Invoice } from "../../../shared/models/Invoice";

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY as string;
const stripe = new Stripe(STRIPE_KEY, {
  apiVersion: "2025-05-28.basil",
});

export const getCustomer = async (customerId: string) => {
  try {
    const customerResponse: Stripe.Response<
      Stripe.Customer | Stripe.DeletedCustomer
    > = await stripe.customers.retrieve(customerId);
    if (customerResponse.deleted) {
      throw new Error("Customer not found or deleted");
    }
    const customer = customerResponse as Stripe.Customer;
    return customer;
  } catch (error) {
    console.error("Error fetching customer:", error);
    return null;
  }
};

export const handleCheckoutSessionCompleted = async (
  event: any
): Promise<void> => {
  const session = event.data.object;

  try {
    if (
      !session.customer ||
      !session.subscription ||
      !session.metadata?.user_id ||
      !session.metadata?.plan_name ||
      !session.metadata?.price ||
      !session.metadata?.stripe_price_id ||
      !session.metadata?.plan_id
    ) {
      throw new Error("Missing required session properties");
    }

    const customer = await getCustomer(session.customer) as Stripe.Customer;

    // Find the user in the database
    const user = await User.findById(session.metadata.user_id);
    if (!user) {
      throw new Error("User not found");
    }

    // Retrieve subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription
    );
    const currentPeriodStart = new Date(
      subscription.items.data[0].current_period_start * 1000
    );
    const currentPeriodEnd = new Date(
      subscription.items.data[0].current_period_end * 1000
    );

    // Create a new subscription
    const newSubscription = new Subscription({
      userId: user._id,
      plan: session.metadata.plan_name,
      price: parseFloat(session.metadata.price),
      stripe_price_id: session.metadata.stripe_price_id,
      startDate: currentPeriodStart,
      endDate: currentPeriodEnd,
      isActive: true,
      autoRenew: true,
      stripe_subscription_id: session.subscription,
    });
    await newSubscription.save();

    // Create a new payment
    const payment = new Payment({
      userId: user._id,
      subscriptionId: session.subscription,
      email: customer.email,
      type: "subscription_created",
      amount: session.amount_total / 100,
      payment_date: currentPeriodStart,
      payment_status: "completed",
      currency: session.currency,
      metadata: {
        customer_id: customer.id,
        customer_name: customer.name || null,
        customer_email: customer.email || null,
        customer_phone: customer.phone || null,
        customer_address: customer.address
          ? {
              line1: customer.address.line1,
              line2: customer.address.line2,
              city: customer.address.city,
              state: customer.address.state,
              postal_code: customer.address.postal_code,
              country: customer.address.country,
            }
          : null,
      },
    });
    await payment.save();

    // Create UsageLogs
    await UsageLogs.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          is_subscribed: true,
          subscription_id: session.subscription,
          subscription_expiry: currentPeriodEnd,
          customer_id: customer.id,
          stripe_price_id: session.metadata.stripe_price_id,
          plan_status: "active",
          is_trial_used: true,
          plan_id: session.metadata?.plan_id,
        },
      },
      { new: true, upsert: true }
    );
  } catch (error) {
    console.error("Error in handleCheckoutSessionCompleted:", error);
    throw error;
  }
};

export const handleSubscriptionEvent = async (
  event: any,
  action: "created" | "updated" | "deleted"
): Promise<void> => {
  const subscription = event.data.object;

  try {
    if (!subscription.customer) {
      throw new Error("Customer ID is missing in the subscription");
    }

    const customer = await getCustomer(subscription.customer) as Stripe.Customer;

    // Find the usage log for the customer
    const usageLog = await UsageLogs.findOne({ customer_id: customer.id });
    if (!usageLog) {
      console.warn(`Usage log not found for customer ${customer.id}`);
      return;
    }

    const currentPeriodStart = new Date(
      subscription.items.data[0].current_period_start * 1000
    );
    const currentPeriodEnd = new Date(
      subscription.items.data[0].current_period_end * 1000
    );

    const isCancelledViaMetadata =
      subscription.metadata?.subscription_status === "subscription_canceled";
    
    const now = new Date();
    const isFreemiumTrialValid =
      usageLog.trial_end_date &&
      usageLog.trial_end_date > now &&
      !usageLog.is_trial_used;

    switch (action) {
      case "created":
        await UsageLogs.findOneAndUpdate(
          { customer_id: customer.id },
          {
            is_subscribed: true,
            plan_status: "active",
            subscription_expiry: currentPeriodEnd,
          },
          { new: true }
        );
        break;

      case "updated":
        let planStatus: string;
        let isSubscribed = false;
        let isActive = false;

        switch (subscription.status) {
          case "active":
            if (isCancelledViaMetadata) {
              planStatus = "cancelled";
              isSubscribed = false;
              isActive = false;
            } else {
              planStatus = subscription.cancel_at_period_end
                ? "active_until_period_end"
                : "active";
              isSubscribed = true;
              isActive = !subscription.cancel_at_period_end;
            }
            break;
          case "trialing":
            planStatus = "trialing";
            isSubscribed = true;
            isActive = true;
            break;
          case "past_due":
            planStatus = "past_due";
            isSubscribed = true;
            isActive = true;
            break;
          case "canceled":
          case "unpaid":
            planStatus = "cancelled";
            isSubscribed = false;
            isActive = false;
            break;
          case "incomplete":
            planStatus = "incomplete";
            isSubscribed = false;
            isActive = false;
            break;
          case "incomplete_expired":
            planStatus = "incomplete_expired";
            isSubscribed = false;
            isActive = false;
            break;
          case "paused":
            planStatus = "paused";
            isSubscribed = false;
            isActive = false;
            break;
          default:
            planStatus = "cancelled";
            isSubscribed = false;
            isActive = false;
            break;
        };

        if(isCancelledViaMetadata) {
          await Subscription.findOneAndUpdate(
            { stripe_subscription_id: subscription.id },
            {
              isActive,
              endDate: currentPeriodEnd,
              autoRenew: !subscription.cancel_at_period_end,
              cancelledAt: subscription.cancel_at_period_end ? new Date() : null,
            },
            { new: true, upsert: false }
          );
  
          await UsageLogs.findOneAndUpdate(
            { customer_id: customer.id },
            {
              is_subscribed: false,
              plan_status: planStatus,
              plan_id: subscription.metadata?.plan_id,
            }
          );
  
          const createCancelledPayments = new Payment({
            userId: usageLog.userId,
            subscriptionId: subscription.id,
            email: customer.email,
            type: "subscription_cancelled",
            payment_status: "cancelled",
            payment_date: new Date(subscription.canceled_at * 1000) || new Date(),
            currency: subscription.currency || "usd",
            amount: 0,
            metadata: {
              customer_id: customer.id,
              customer_name: customer.name || null,
              customer_email: customer.email || null,
              customer_phone: customer.phone || null,
              customer_address: customer.address
                ? {
                    line1: customer.address.line1,
                    line2: customer.address.line2,
                    city: customer.address.city,
                    state: customer.address.state,
                    postal_code: customer.address.postal_code,
                    country: customer.address.country,
                  }
                : null,
            },
          });
          await createCancelledPayments.save();

          return;
        } else {
          await Subscription.findOneAndUpdate(
            { stripe_subscription_id: subscription.id },
            {
              isActive,
              endDate: currentPeriodEnd,
              autoRenew: !subscription.cancel_at_period_end,
              cancelledAt: subscription.cancel_at_period_end ? new Date() : null,
              plan: subscription.metadata.plan_name,
              price: parseFloat(subscription.metadata.price),
              stripe_price_id: subscription.metadata.stripe_price_id,
            },
            { new: true, upsert: false }
          );
  
          await UsageLogs.findOneAndUpdate(
            { customer_id: customer.id },
            {
              subscription_expiry: currentPeriodEnd,
              plan_status: planStatus,
              is_subscribed: isSubscribed,
              cancellation_date: subscription.cancel_at_period_end
                ? currentPeriodEnd
                : null,
              stripe_price_id: subscription.metadata.stripe_price_id,
              plan_id: subscription.metadata?.plan_id,
            },
            { new: true, upsert: false }
          );
  
          const invoice = await stripe.invoices.retrieve(
            subscription.latest_invoice
          );
  
          const payment = new Payment({
            userId: usageLog.userId,
            subscriptionId: subscription.id,
            type: "subscription_upgraded",
            amount: invoice.total / 100,
            payment_date: new Date(invoice.created * 1000),
            email: customer.email,
            payment_status: invoice.status === "paid" ? "completed" : "pending",
            currency: invoice.currency,
            metadata: {
              customer_id: customer.id,
              customer_name: customer.name || null,
              customer_email: customer.email || null,
              customer_phone: customer.phone || null,
              customer_address: customer.address
                ? {
                    line1: customer.address.line1,
                    line2: customer.address.line2,
                    city: customer.address.city,
                    state: customer.address.state,
                    postal_code: customer.address.postal_code,
                    country: customer.address.country,
                  }
                : null,
            },
          });
          await payment.save();
        }
        break;

      case "deleted":
        await Subscription.findOneAndUpdate(
          { userId: usageLog.userId },
          {
            isActive: false,
            autoRenew: false,
          }
        );

        await UsageLogs.findOneAndUpdate(
          { customer_id: customer.id },
          {
            is_subscribed: false,
            plan_status: isFreemiumTrialValid ? "trialing" : "expired",
            subscription_expiry: isFreemiumTrialValid
              ? usageLog.trial_end_date
              : new Date(),
          }
        );

        const createCancelledPayments = new Payment({
          userId: usageLog.userId,
          subscriptionId: subscription.id,
          email: (customer as Stripe.Customer)?.email || "",
          type: "subscription_cancelled",
          payment_status: "cancelled",
          payment_date: new Date(subscription.canceled_at * 1000) || new Date(),
          currency: subscription.currency || "usd",
          amount: 0,
          metadata: {
            customer_id: customer.id,
            customer_name: customer.name || null,
            customer_email: customer.email || null,
            customer_phone: customer.phone || null,
            customer_address: customer.address
              ? {
                  line1: customer.address.line1,
                  line2: customer.address.line2,
                  city: customer.address.city,
                  state: customer.address.state,
                  postal_code: customer.address.postal_code,
                  country: customer.address.country,
                }
              : null,
          },
        });
        await createCancelledPayments.save();
        break;

      default:
        console.warn(`Unhandled subscription action: ${action}`);
        break;
    }
  } catch (error) {
    console.error(`Error handling ${action} subscription:`, error);
    throw error;
  }
};

/**
 * Handle trial will end event
 * This should NOT happen in freemium model - log error if it occurs
 */
export const handleTrialWillEnd = async (event: any) => {
  const subscription = event.data.object;

  try {
    const customerId = subscription.customer as string;

    // Get user and usage log details
    const usageLog = await UsageLogs.findOne({ customer_id: customerId });
    if (!usageLog) {
      throw new AppError("Usage log not found", "USAGE_LOG_NOT_FOUND", 404);
    }

    const user = await User.findById(usageLog.userId);
    if (!user) {
      throw new AppError("User not found", "USER_NOT_FOUND", 404);
    }

    // Force subscription to active to fix the issue
    await UsageLogs.findOneAndUpdate(
      { customer_id: customerId },
      { plan_status: "active" }
    );

  } catch (error) {
    dbLogger.error("Trial", "handleTrialWillEnd", error);
    throw new AppError(
      "Failed to handle trial will end event",
      "TRIAL_WILL_END_ERROR",
      500
    );
  }
};

/**
 * Check and handle expired freemium trials
 * This should be called by a cron job or scheduled task
 */
export const handleExpiredFreemiumTrials = async (): Promise<void> => {
  try {
    const now = new Date();

    const expiredTrials = await UsageLogs.find({
      plan_status: "trialing",
      trial_end_date: { $lt: now },
      is_subscribed: false,
    });

    for (const usageLog of expiredTrials) {
      await UsageLogs.findByIdAndUpdate(usageLog._id, {
        plan_status: "expired",
        subscription_expiry: now,
        is_trial_used: true,
        cancellation_date: now,
      });

      // Get user details for email notification
      const user = await User.findById(usageLog.userId);
      if (user) {
        // Send trial expired email (optional)
        // await sendTrialExpiredEmail(user.email);
        // console.log(`Freemium trial expired for user ${user._id}`);
      }
    }
  } catch (error) {
    console.error("Error handling expired freemium trials:", error);
    throw error;
  }
};

/**
 * Send trial ending warning for freemium users
 * This should be called by a cron job 2-3 days before trial expiry
 */
export const sendFreemiumTrialWarning = async (): Promise<void> => {
  try {
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + 3);
  
    const upcomingExpiry = await UsageLogs.find({
      plan_status: "trialing",
      trial_end_date: {
        $gte: new Date(warningDate.getTime() - 24 * 60 * 60 * 1000),
        $lt: new Date(warningDate.getTime() + 24 * 60 * 60 * 1000),
      },
      is_subscribed: false,
      trial_end_notification_sent: { $ne: true },
    });

    for (const usageLog of upcomingExpiry) {
      const user = await User.findById(usageLog.userId);
      if (user) {
        // Send trial ending warning email
        // await sendFreemiumTrialEndingEmail(user.email, 3);

        // Mark notification as sent
        await UsageLogs.findByIdAndUpdate(usageLog._id, {
          trial_end_notification_sent: true,
          trial_end_notification_date: new Date(),
        });
      }
    }
  } catch (error) {
    console.error("Error sending freemium trial warnings:", error);
    throw error;
  }
};

export const handleInvoiceEvent = async (
  event: any,
  action: "created" | "finalized" | "succeeded" | "failed" | "paid"
): Promise<void> => {
  const invoice = event.data.object;
  const customer = await getCustomer(invoice.customer) as Stripe.Customer;

  try {
    const invoiceData = {
      customer_id: invoice.customer,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      invoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
      invoiceNumber: invoice.number,
      billingPeriod: {
        start: new Date(invoice.lines.data[0]?.period?.start * 1000),
        end: new Date(invoice.lines.data[0]?.period?.end * 1000),
      },
      metadata: {
        subtotal: invoice.subtotal / 100,
        total: invoice.total / 100,
        customer_name: customer.name || null,
        customer_email: customer.email || null,
        customer_phone: customer.phone || null,
        customer_address: customer.address
          ? {
              line1: customer.address.line1,
              line2: customer.address.line2,
              city: customer.address.city,
              state: customer.address.state,
              postal_code: customer.address.postal_code,
              country: customer.address.country,
            }
          : null,
      },
    };

    switch (action) {
      case "created":
        await Invoice.findOneAndUpdate(
          { stripeInvoiceId: invoice.id },
          {
            ...invoiceData,
            status: "draft",
          },
          { upsert: true, new: true }
        );
        break;

      case "finalized":
        await Invoice.findOneAndUpdate(
          { stripeInvoiceId: invoice.id },
          {
            ...invoiceData,
            status: "open",
            dueDate: new Date(invoice.due_date * 1000),
          },
          { upsert: true, new: true }
        );
        break;

      case "succeeded":
        const succeededInvoice = await Invoice.findOneAndUpdate(
          { stripeInvoiceId: invoice.id },
          {
            ...invoiceData,
            status: "paid",
            dueDate: new Date(invoice.due_date * 1000),
            paidAt: new Date(invoice.status_transitions.paid_at * 1000),
            amount: invoice.amount_paid / 100,
          },
          { upsert: true, new: true }
        );
        // Update usage log
        await UsageLogs.findOneAndUpdate(
          { customer_id: invoice.customer },
          {
            plan_status: "active",
            subscription_expiry: new Date(
              invoice.lines.data[0]?.period?.end * 1000
            ),
            is_subscribed: true,
          }
        );
        break;

      case "paid":
        await Invoice.findOneAndUpdate(
          { stripeInvoiceId: invoice.id },
          {
            ...invoiceData,
            status: "paid",
            paidAt: new Date(invoice.status_transitions.paid_at * 1000),
            amount: invoice.amount_paid / 100,
          },
          { upsert: true, new: true }
        );
        break;

      case "failed":
        await Invoice.findOneAndUpdate(
          { stripeInvoiceId: invoice.id },
          {
            ...invoiceData,
            status: "payment_failed",
            dueDate: new Date(invoice.due_date * 1000),
          },
          { upsert: true, new: true }
        );

        await UsageLogs.findOneAndUpdate(
          { customer_id: invoice.customer },
          {
            plan_status: "payment_failed",
          }
        );
        break;

      default:
        console.warn(`Unhandled invoice action: ${action}`);
        break;
    }
  } catch (error) {
    console.error(`Error handling invoice event: ${error}`, {
      invoiceId: invoice.id,
      action,
      error,
    });
    dbLogger.error("Invoice", `handleInvoiceEvent:${action}`, error);
    throw new AppError(
      `Failed to handle invoice ${action}`,
      "INVOICE_HANDLING_ERROR",
      500
    );
  }
};
