// src/shared/models/Team.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IOrganization extends Document {
  name: string;
  description?: string;
  members: mongoose.Types.ObjectId[];
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  industry: string;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    industry: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

// Create indexes for efficient queries
OrganizationSchema.index({ owner: 1 });
OrganizationSchema.index({ members: 1 });

export const Organization = mongoose.model<IOrganization>(
  "Organization",
  OrganizationSchema,
);
