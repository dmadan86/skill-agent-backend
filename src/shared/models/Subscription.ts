import mongoose, { Document, Schema } from "mongoose";

export interface ISubscription extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  plan: string;
  price: number;
  stripe_price_id: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  cancellation_date: Date | null;
  autoRenew: boolean;
  cancelledAt: Date | null;
  cancelledDuringTrial: boolean;
  trialEndedEarly: boolean;
  stripe_subscription_id: string;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plan: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    stripe_price_id: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    cancellation_date: {
      type: Date,
      default: null,
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledDuringTrial: {
      type: Boolean,
      default: false,
    },
    trialEndedEarly: {
      type: Boolean,
      default: false,
    },
    stripe_subscription_id: {
      type: String,
    },
  },
  { timestamps: true },
);

export const Subscription = mongoose.model<ISubscription>(
  "Subscription",
  SubscriptionSchema,
);
