import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from "bcrypt";
import { dbLogger } from "../utils/loggerUtils";

export interface IUser extends Document<string> {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: mongoose.Types.ObjectId; // Changed from string to ObjectId
  teams?: mongoose.Types.ObjectId[]; // New field to track team memberships
  position?: string;
  googleId?: string;
  profilePicture?: string; // URL to the profile picture
  isEmailVerified: boolean;
  isPasswordSet: boolean; // Whether user has set their password
  passwordChangeRequired: boolean; // Whether user needs to change password on next login
  lastLogin?: Date;
  refreshTokens: Array<{
    token: string;
    expiresAt: Date;
    userAgent?: string;
    ip?: string;
    createdAt: Date;
  }>;
  loginAttempts: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isAccountLocked(): boolean;
  isActive: boolean;
  failedLoginAttempts: number;
  creditLimit: number;
  creditBalance: number;
  managedBy?: mongoose.Types.ObjectId;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  verificationToken?: string;
  metadata?: {
    stripeCustomerId?: string;
    [key: string]: any;
  };
  hasOnBoarded: boolean;
  incrementLoginAttempts(): Promise<void>;
  lockAccount(): Promise<void>;
  unlockAccount(): Promise<void>;
  organizationOwner: mongoose.Types.ObjectId[];
  organizationMember: mongoose.Types.ObjectId[];
  facebookId?: string;
  type?: string;
  interests?: string[];
  bio?: string;
  onboardingSteps?: number[];
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId && !this.facebookId;
      },
      minlength: 8,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["admin", "manager", "employee", "superadmin"],
      default: "employee",
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    teams: [{
      type: Schema.Types.ObjectId,
      ref: 'Team',
    }],
    position: {
      type: String,
      trim: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    profilePicture: {
      type: String,
      trim: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPasswordSet: {
      type: Boolean,
      default: false,
    },
    passwordChangeRequired: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    refreshTokens: [
      {
        token: String,
        expiresAt: Date,
        userAgent: String,
        ip: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    managedBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    hasOnBoarded: {
      type: Boolean,
      default: false,
    },
    organizationOwner: [{
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    }],
    organizationMember: [{
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    }],
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    verificationToken: String,
    creditLimit: {
      type: Number,
      default: 0,
    },
    creditBalance: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: Object,
      default: {},
    },
    facebookId: {
      type: String,
      unique: true,
      sparse: true,
    },
    type: {
      type: String,
      enum: ['individual', 'team'],
      default: 'individual',
    },
    interests: {
      type: [String],
      default: [],
    },
    bio: {
      type: String,
      trim: true,
    },
    onboardingSteps: {
      type: [Number],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ lastLogin: -1 }); // For sorting recent logins

// Hash password before saving
UserSchema.pre("save", async function (next) {
  const user = this;
  
  // Log user creation
  if (user.isNew) {
    dbLogger.query("User", "create", { email: user.email });
  }
  
  // Hash password if modified
  if (!user.isModified("password") || !user.password) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    dbLogger.error("User", "password-hash", error);
    next(error as Error);
  }
});

// Log when a user is deleted
UserSchema.pre("deleteOne", { document: true, query: false }, function() {
  dbLogger.query("User", "delete", { userId: this._id });
});

// Log when a user is updated
UserSchema.pre("findOneAndUpdate", function() {
  const update = this.getUpdate();
  if (update) {
    dbLogger.query("User", "update", { query: this.getQuery(), update });
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    
    // Only log failed attempts to avoid logging sensitive information
    if (!isMatch) {
      dbLogger.query("User", "failed-login-attempt", { userId: this._id });
    }
    
    return isMatch;
  } catch (error) {
    dbLogger.error("User", "password-compare", error);
    return false;
  }
};

// Method to check if account is locked
UserSchema.methods.isAccountLocked = function (): boolean {
  const isLocked = !!(this.lockUntil && this.lockUntil > new Date());
  
  if (isLocked) {
    dbLogger.query("User", "account-locked", { userId: this._id, until: this.lockUntil });
  }
  
  return isLocked;
};

// Static method to find user by email
UserSchema.statics.findByEmail = function (email: string) {
  dbLogger.query("User", "findByEmail", { email: email.toLowerCase() });
  return this.findOne({ email: email.toLowerCase() });
};

const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);

export default User;
