import mongoose, { Document, Schema } from "mongoose";

export interface IInvoice extends Document {
  customer_id: string;
  subscriptionId?: string;
  stripeInvoiceId: string;
  invoiceNumber?: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: Date;
  paidAt: Date | null;
  billingPeriod: {
    start: Date;
    end: Date;
  };
  invoiceUrl: string;
  invoicePdf: string;
  metadata: Record<string, any>;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    customer_id: {
      type: String,
    },
    subscriptionId: {
      type: String,
    },
    stripeInvoiceId: {
      type: String,
      required: true,
      unique: true,
    },
    invoiceNumber: {
      type: String,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    status: {
      type: String,
    },
    dueDate: {
      type: Date,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    billingPeriod: {
      start: {
        type: Date,
        required: true,
      },
      end: {
        type: Date,
        required: true,
      },
    },
    invoiceUrl: {
      type: String,
    },
    invoicePdf: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

InvoiceSchema.index({ stripeInvoiceId: 1 }, { unique: true });
InvoiceSchema.index({ invoiceNumber: 1 }, { unique: true });

export const Invoice = mongoose.model<IInvoice>("Invoice", InvoiceSchema); 