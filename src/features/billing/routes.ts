// src/features/billing/routes.ts
import express, { Router } from "express";
import * as billingPlanController from "./controllers/billingPlanController";
import { validate } from "../../shared/middleware/validate";
import { authenticate } from "../../shared/middleware/authenticate";
import { billingSchemas } from "./validation/billingSchema";
import * as subscriptionController from "./controllers/SubscriptionController";
import { subscriptionSchemas } from "./validation/SubscriptionSchema";

const router = Router();

router.post("/stripe/webhook", subscriptionController.stripeWebhookController);

router.get("/plans", billingPlanController.listBillingPlans);
router.get(
  "/plans/:id",
  validate(billingSchemas.getBillingPlanSchema),
  billingPlanController.getBillingPlan,
);

// All other billing routes require authentication
router.use(authenticate);

router.post(
  "/plans",
  validate(billingSchemas.createBillingPlanSchema),
  billingPlanController.createBillingPlan,
);
router.put(
  "/plans/:id",
  validate(billingSchemas.updateBillingPlanSchema),
  billingPlanController.updateBillingPlan,
);
router.delete(
  "/plans/:id",
  validate(billingSchemas.getBillingPlanSchema),
  billingPlanController.deleteBillingPlan,
);

// Create checkout session
router.post(
  "/subscription/create-checkout-session",
  validate(subscriptionSchemas.createCheckoutSessionSchema),
  subscriptionController.createCheckoutSession,
);

// Get user billing details
router.get(
  "/subscription/billing-details",
  subscriptionController.getUserBillingDetails,
);

router.delete(
  "/subscription/cancel/:stripe_subscription_id",
  validate(subscriptionSchemas.cancelSubscriptionSchema),
  subscriptionController.cancelSubscriptionController,
);

export default router;
