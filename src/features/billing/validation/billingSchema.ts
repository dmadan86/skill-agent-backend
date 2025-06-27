import mongoose from "mongoose";
import { z } from "zod";

// Common schemas
export const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format",
  });

// Create Billing Plan Schema
const createBillingPlanSchema = z.object({
  name: z
    .string({
      required_error: "Plan name is required",
    })
    .min(3, "Name must be at least 3 characters")
    .max(50),
  description: z
    .string({
      required_error: "Description is required",
    })
    .min(10, "Description must be at least 10 characters"),
  monthlyPrice: z
    .number({
      required_error: "Monthly price is required",
    })
    .min(0, "Price cannot be negative"),
  yearlyPrice: z
    .number({
      required_error: "Yearly price is required",
    })
    .min(0, "Price cannot be negative"),
  currency: z
    .enum(["USD", "EUR", "GBP"], {
      required_error: "Currency is required",
    })
    .default("USD"),
  features: z.array(z.any()),
  isActive: z.boolean().default(true),
  popular: z.boolean().default(false),
  stripe_price_id: z.object({
    monthly: z.string().optional(),
    yearly: z.string().optional(),
  }),
  stripe_product_id: z.string().optional(),
});

// Update Billing Plan Schema
const updateBillingPlanSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50)
    .optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .optional(),
  monthlyPrice: z.number().min(0, "Price cannot be negative").optional(),
  yearlyPrice: z.number().min(0, "Price cannot be negative").optional(),
  currency: z.enum(["USD", "EUR", "GBP"]).optional(),
  features: z.array(z.any()).optional(),
  isActive: z.boolean().optional(),
  popular: z.boolean().optional(),
  stripe_price_id: z
    .object({
      monthly: z.string().optional(),
      yearly: z.string().optional(),
    })
    .optional(),
  stripe_product_id: z.string().optional(),
});

// Get Billing Plan Schema
const getBillingPlanSchema = z.object({
  id: objectIdSchema,
});

// Create Subscription Schema
const createSubscriptionSchema = z.object({
  planId: objectIdSchema,
  paymentMethod: z.object({
    type: z.enum(["credit_card", "paypal", "bank_transfer"]),
    cardBrand: z.string().optional(),
    lastFourDigits: z.string().optional(),
    expiryMonth: z.number().min(1).max(12).optional(),
    expiryYear: z.number().optional(),
    tokenId: z.string().optional(),
    email: z.string().email().optional(),
    isDefault: z.boolean().default(true),
  }),
  autoRenew: z.boolean().default(true),
});

// Update Subscription Schema
const updateSubscriptionSchema = z.object({
  planId: objectIdSchema.optional(),
  status: z
    .enum(["active", "canceled", "past_due", "trialing", "unpaid"])
    .optional(),
  creditBalance: z.number().min(0, "Credit balance cannot be negative").optional(),
  autoRenew: z.boolean().optional(),
});

// Add Payment Method Schema
const addPaymentMethodSchema = z.object({
  type: z.enum(["credit_card", "paypal", "bank_transfer"]),
  cardBrand: z.string().optional(),
  lastFourDigits: z.string().optional(),
  expiryMonth: z.number().min(1).max(12).optional(),
  expiryYear: z.number().optional(),
  tokenId: z.string().optional(),
  email: z.string().email().optional(),
  isDefault: z.boolean().default(false),
});

// Get Subscription Schema
const getSubscriptionSchema = z.object({
  id: objectIdSchema,
});

// List Subscriptions Schema
const listSubscriptionsSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10)),
  status: z
    .enum(["active", "canceled", "past_due", "trialing", "unpaid"])
    .optional(),
});

// Cancel Subscription Schema
const cancelSubscriptionSchema = z.object({
  id: objectIdSchema,
  cancelImmediately: z.boolean().default(false),
});

// Create Invoice Schema
const createInvoiceSchema = z.object({
  subscriptionId: objectIdSchema,
  amount: z.number().min(0),
  currency: z.enum(["USD", "EUR", "GBP"]).default("USD"),
  invoiceDate: z.date().default(() => new Date()),
  dueDate: z.date(),
  billingPeriodStart: z.date(),
  billingPeriodEnd: z.date(),
});

// Update Invoice Schema
const updateInvoiceSchema = z.object({
  status: z.enum(["draft", "pending", "paid", "failed", "canceled"]).optional(),
  paidDate: z.date().optional(),
  paymentMethodId: z.string().optional(),
});

// Get Invoice Schema
const getInvoiceSchema = z.object({
  id: objectIdSchema,
});

// Export types for use in controllers
export type CreateBillingPlanInput = z.infer<typeof createBillingPlanSchema>;
export type UpdateBillingPlanInput = z.infer<typeof updateBillingPlanSchema>;
export type GetBillingPlanInput = z.infer<typeof getBillingPlanSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type AddPaymentMethodInput = z.infer<typeof addPaymentMethodSchema>;
export type GetSubscriptionInput = z.infer<typeof getSubscriptionSchema>;
export type ListSubscriptionsInput = z.infer<typeof listSubscriptionsSchema>;
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type GetInvoiceInput = z.infer<typeof getInvoiceSchema>;

// Export schemas for validation middleware
export const billingSchemas = {
  createBillingPlanSchema: { body: createBillingPlanSchema },
  updateBillingPlanSchema: {
    params: getBillingPlanSchema,
    body: updateBillingPlanSchema,
  },
  getBillingPlanSchema: { params: getBillingPlanSchema },
  createSubscriptionSchema: { body: createSubscriptionSchema },
  updateSubscriptionSchema: {
    params: getSubscriptionSchema,
    body: updateSubscriptionSchema,
  },
  addPaymentMethodSchema: {
    params: getSubscriptionSchema,
    body: addPaymentMethodSchema,
  },
  getSubscriptionSchema: { params: getSubscriptionSchema },
  listSubscriptionsSchema: { query: listSubscriptionsSchema },
  cancelSubscriptionSchema: {
    params: getSubscriptionSchema,
    body: z.object({ cancelImmediately: z.boolean().default(false) }),
  },
  createInvoiceSchema: { body: createInvoiceSchema },
  updateInvoiceSchema: {
    params: getInvoiceSchema,
    body: updateInvoiceSchema,
  },
  getInvoiceSchema: { params: getInvoiceSchema },
}; 