import { z } from "zod";

// Schema for creating a Stripe checkout session
export const createCheckoutSessionSchema = z.object({
  price: z.number().optional(),
  plan_name: z.string().optional(),
  stripe_price_id: z.string().optional(),
  plan_id: z.string().optional(),
});

export const getSubscriptionDetailsSchema = z.object({
  id: z.string().optional(),
});

const cancelSubscriptionSchema = z.object({
  stripe_subscription_id: z.string(),
});

export type CreateCheckoutSessionInput = z.infer<
  typeof createCheckoutSessionSchema
>;
export type GetSubscriptionDetailsInput = z.infer<
  typeof getSubscriptionDetailsSchema
>;
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;

export const subscriptionSchemas = {
  createCheckoutSessionSchema: { body: createCheckoutSessionSchema },
  getSubscriptionDetailsSchema: { body: getSubscriptionDetailsSchema },
  cancelSubscriptionSchema: { params: cancelSubscriptionSchema },
};
