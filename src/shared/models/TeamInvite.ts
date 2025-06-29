// src/shared/models/TeamInvite.ts
import mongoose, { Document, Schema } from "mongoose";

export interface ITeamInvite extends Document {
  email: string;
  team: mongoose.Types.ObjectId;
  invitedBy: mongoose.Types.ObjectId;
  token: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TeamInviteSchema = new Schema<ITeamInvite>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    team: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "expired"],
      default: "pending",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

TeamInviteSchema.index({ email: 1, team: 1 }, { unique: true }); // Prevent duplicate invites
TeamInviteSchema.index({ team: 1 });
TeamInviteSchema.index({ expiresAt: 1 }); // For cleaning up expired invites

export const TeamInvite = mongoose.model<ITeamInvite>(
  "TeamInvite",
  TeamInviteSchema,
);
