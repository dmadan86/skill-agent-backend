import mongoose, { Document, Schema } from "mongoose";

export interface IPayment extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  subscriptionId: string;
  email: string;
  type: string;
  amount: number;
  payment_date: Date;
  payment_status: string;
  currency: string;
  metadata: Record<string, any>;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subscriptionId: {
      type: String
    },
    email: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    payment_date: {
      type: Date,
      default: Date.now,
    },
    payment_status: {
      type: String,
      default: "pending",
    },
    currency: {
      type: String,
      required: true,
    },
    metadata: {
      type: Object,
    },
  },
  { timestamps: true }
);

PaymentSchema.index({ userId: 1, subscriptionId: 1 }, { unique: true });
PaymentSchema.index({ stripeInvoiceId: 1 }, { unique: true, sparse: true });

export const Payment = mongoose.model<IPayment>("Payment", PaymentSchema);