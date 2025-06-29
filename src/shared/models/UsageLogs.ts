import mongoose, { Document, Schema } from "mongoose";

export interface IUsageLogs extends Document {
  userId: mongoose.Types.ObjectId;
  is_subscribed: boolean;
  subscription_id?: string;
  subscription_expiry?: Date;
  customer_id?: string;
  stripe_price_id?: string;
  plan_status?: string;
  cancellation_date?: Date;
  cancelled_in_trial?: boolean;
  trial_start_date?: Date;
  trial_end_date?: Date;
  is_trial_used?: boolean;
  trial_ended_early?: boolean;
  trial_minutes_remaining?: number;
  call_id?: string;
  call_type?: "inbound" | "outbound";
  call_status?: "completed" | "failed" | "missed";
  calculated_calls?: number;
  durationms?: number;
  call_minutes_used?: number;
  call_minutes_limit?: number;
  call_minutes_remaining?: number;
  direction?: "inbound" | "outbound";
  disconnection_reason?: string;
  date?: Date;
  total_minutes_used?: number;
  current_billing_cycle_cost?: number;
  cost?: number;
  pland_id?: string;
  chat_tokens_used?: number;
  chat_tokens_limit?: number;
  agent_access_limit?: number;
  team_member_limit?: number;
  plan_id?: string;
  trial_end_notification_sent?: boolean;
  trial_end_notification_date?: Date;
}

const UsageLogsSchema = new Schema<IUsageLogs>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    is_subscribed: {
      type: Boolean,
      default: false,
    },
    subscription_id: {
      type: String,
    },
    subscription_expiry: {
      type: Date,
    },
    customer_id: {
      type: String,
    },
    stripe_price_id: {
      type: String,
    },
    plan_status: {
      type: String,
      default: "trialing",
    },
    cancellation_date: {
      type: Date,
    },
    cancelled_in_trial: {
      type: Boolean,
    },
    trial_start_date: {
      type: Date,
    },
    trial_end_date: {
      type: Date,
    },
    is_trial_used: {
      type: Boolean,
    },
    trial_ended_early: {
      type: Boolean,
    },
    trial_minutes_remaining: {
      type: Number,
    },
    call_id: {
      type: String,
    },
    call_type: {
      type: String,
      enum: ["inbound", "outbound"],
    },
    call_status: {
      type: String,
      enum: ["completed", "failed", "missed"],
    },
    calculated_calls: {
      type: Number,
    },
    durationms: {
      type: Number,
    },
    call_minutes_used: {
      type: Number,
      default: 0,
    },
    call_minutes_limit: {
      type: Number,
      default: 60,
    },
    call_minutes_remaining: {
      type: Number,
      default: 60,
    },
    direction: {
      type: String,
      enum: ["inbound", "outbound"],
    },
    disconnection_reason: {
      type: String,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    total_minutes_used: {
      type: Number,
    },
    current_billing_cycle_cost: {
      type: Number,
    },
    cost: {
      type: Number,
    },
    pland_id: {
      type: String,
    },
    chat_tokens_used: {
      type: Number,
      default: 0,
    },
    chat_tokens_limit: {
      type: Number,
      default: 5000,
    },
    agent_access_limit: {
      type: Number,
      default: 1,
    },
    team_member_limit: {
      type: Number,
      default: 1,
    },
    plan_id: {
      type: String,
    },
    trial_end_notification_sent: {
      type: Boolean,
      default: false,
    },
    trial_end_notification_date: {
      type: Date,
    },
  },
  { timestamps: true },
);

UsageLogsSchema.index({ userId: 1, date: -1 });
UsageLogsSchema.index({ call_id: 1 });
UsageLogsSchema.index({ subscription_id: 1 });
UsageLogsSchema.index({ plan_status: 1 });

export const UsageLogs = mongoose.model<IUsageLogs>(
  "UsageLogs",
  UsageLogsSchema,
);
