import mongoose, { Document, Schema } from "mongoose";

export interface IApiKey extends Document {
  key: string;
  name: string;
  userId: mongoose.Types.ObjectId;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true },
);

ApiKeySchema.index({ userId: 1 });
ApiKeySchema.index({ key: 1 }, { unique: true });

// Add a pre-save hook to ensure expiresAt is in the future
ApiKeySchema.pre("save", function (next) {
  if (this.expiresAt && this.expiresAt <= new Date()) {
    throw new Error("expiresAt must be in the future");
  }
  next();
});

export const ApiKey = mongoose.model<IApiKey>("ApiKey", ApiKeySchema);
