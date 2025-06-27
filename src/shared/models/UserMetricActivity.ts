import mongoose, { Document, Schema } from "mongoose";

export interface IUserMetricActivity extends Document {
  userId: string;
  activityType: string;
  feature: string;
  metadata: Record<string, any>;
  timestamp: Date;
  status: 'success' | 'failed';
  duration?: number;
}

const UserMetricActivitySchema = new Schema<IUserMetricActivity>(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    activityType: {
      type: String,
      required: true,
      enum: [
        // User lifecycle events
        'user_signup',
        'user_login',
        'login_failed',
        'user_logout',
        
        // Feature usage events
        'training_started',
        'training_completed',
        'training_progress',
        'evaluation_started',
        'evaluation_completed',
        'evaluation_progress',
        'quickprep_started',
        'quickprep_completed',
        'team_created',
        'team_joined',
        'team_left',
        
        // System events
        'error_occurred',
        'support_ticket_created',
        'support_ticket_resolved'
      ]
    },
    feature: {
      type: String,
      required: true,
      enum: [
        'authentication',
        'training',
        'evaluation',
        'quickprep',
        'teams',
        'support',
        'system'
      ]
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      default: 'success'
    },
    duration: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient querying
UserMetricActivitySchema.index({ userId: 1, timestamp: -1 });
UserMetricActivitySchema.index({ feature: 1, timestamp: -1 });
UserMetricActivitySchema.index({ activityType: 1, timestamp: -1 });

export const UserMetricActivity = mongoose.model<IUserMetricActivity>(
  "UserMetricActivity",
  UserMetricActivitySchema
); 