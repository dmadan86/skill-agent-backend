import mongoose, { Document, Schema } from "mongoose";

export interface IBillingPlan extends Document {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  features: any[];
  isActive: boolean;
  popular: boolean;
  stripe_price_id: {
    monthly: string;
    yearly: string;
  };
  stripe_product_id: string;
  createdAt: Date;
  updatedAt: Date;
}

const BillingPlanSchema = new Schema<IBillingPlan>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    monthlyPrice: {
      type: Number,
      required: true,
    },
    yearlyPrice: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    features: [],
    isActive: {
      type: Boolean,
      default: false,
    },
    popular: {
      type: Boolean,
      default: false,
    },
    stripe_price_id: {
      monthly: {
        type: String,
      },
      yearly: {
        type: String,
      },
    },
    stripe_product_id: {
      type: String,
    },
  },
  { timestamps: true },
);

BillingPlanSchema.index({ name: 1 });
BillingPlanSchema.index({ isActive: 1 });

export const BillingPlan = mongoose.model<IBillingPlan>(
  "BillingPlan",
  BillingPlanSchema,
);
