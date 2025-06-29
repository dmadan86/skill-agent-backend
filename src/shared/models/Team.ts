// src/shared/models/Team.ts
import mongoose, { Document, Schema } from "mongoose";

export interface ITeam extends Document {
  name: string;
  description?: string;
  members: mongoose.Types.ObjectId[];
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>(
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
  },
  { timestamps: true },
);

// Create indexes for efficient queries
TeamSchema.index({ owner: 1 });
TeamSchema.index({ members: 1 });

export const Team = mongoose.model<ITeam>("Team", TeamSchema);
