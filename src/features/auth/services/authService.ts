import User, { IUser } from "../../../shared/models/User";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getTokenExpirationDate,
} from "../../../shared/services/tokenService";
import {
  InvalidCredentialsError,
  EmailInUseError,
  AccountLockedError,
  InvalidTokenError,
  NotFoundError,
} from "../../../shared/errors/AppError";
import { Request } from "express";
import { Agent } from "../../../shared/models/Agent";
import { processTeamInvitesForUser } from "./authServiceExtension";
import { sendEmailVerification } from "./userManagementService";
import logger from "../../../shared/utils/logger";
import { getFileUrl } from "../../../shared/middleware/fileUpload";
import mongoose from "mongoose";
import { Organization } from "../../../shared/models/Organization";
import { AppError } from "../../../shared/errors/AppError";
import { CreateOnboardingInput } from "../validation/authSchema";
import { UserMetricActivityService } from "../../../shared/services/userMetricActivityService";
import { IUsageLogs, UsageLogs } from "../../../shared/models/UsageLogs";
import { BillingPlan } from "../../../shared/models/BillingPlan";
import { FREEMIUM_PLAN_ID } from "../../../shared/utils/constants";

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
  department?: string;
  position?: string;
  profilePicture?: string; // Filename of the uploaded profile
  company?: string;
  industry?: string;
}

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  profilePicture?: string; // Filename of the uploaded profile picture
  bio?: string;
}

interface LoginResult {
  user: IUser | null;
  accessToken: string;
  refreshToken: string;
}

export const register = async (userData: RegisterData): Promise<IUser> => {
  // Check if email already exists
  const existingUser = await User.findOne({
    email: userData.email.toLowerCase(),
  });
  if (existingUser) {
    throw new EmailInUseError();
  }

  // Process profile picture if provided
  let profilePictureUrl = undefined;
  if (userData.profilePicture) {
    profilePictureUrl = getFileUrl(userData.profilePicture, "profile-picture");
  }

  // Create new user
  const user = new User({
    ...userData,
    email: userData.email.toLowerCase(),
    role: userData.role ?? "admin",
    isEmailVerified: false,
    profilePicture: profilePictureUrl,
    hasOnBoarded: false,
  });

  // Set the user as their own manager initially
  user.managedBy = new mongoose.Types.ObjectId(user._id);

  const organization = new Organization({
    name: userData.company,
    industry: userData.industry,
    owner: user._id,
    members: [user._id],
  });

  user.organizationOwner.push(
    new mongoose.Types.ObjectId(organization._id as string),
  );
  user.organizationMember.push(
    new mongoose.Types.ObjectId(organization._id as string),
  );

  await organization.save();
  await user.save();

  // Process any team invites
  await processTeamInvitesForUser(user._id.toString(), user.email);

  // Track user registration activity
  await UserMetricActivityService.createActivity({
    userId: user._id.toString(),
    activityType: "user_signup",
    feature: "authentication",
    metadata: {
      method: "email",
      role: user.role,
      company: (user as any).company,
      industry: (user as any).industry,
    },
    status: "success",
  });

  // Send email verification
  try {
    await sendEmailVerification(user._id.toString());
  } catch (error) {
    logger.error(`Failed to send verification email: ${error}`);
    // Continue despite email failure - user can request verification email later
  }

  return user;
};

export const login = async (
  email: string,
  password: string,
  req: Request,
  isPilot?: boolean,
): Promise<LoginResult> => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new InvalidCredentialsError();
  }

  // Check if user is trying to login as admin through regular login
  if (user.role === "superadmin" && !isPilot) {
    throw new AppError(
      "Admin access not allowed through regular login",
      "ADMIN_ACCESS_RESTRICTED",
      403,
    );
  }

  // Check if non-admin is trying to login through pilot login
  if (isPilot && user.role !== "superadmin") {
    throw new AppError(
      "Only superadmin can access pilot login",
      "PILOT_ACCESS_RESTRICTED",
      403,
    );
  }

  if (user.isAccountLocked()) {
    throw new AccountLockedError({
      lockUntil: user.lockUntil,
    });
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    // Increment login attempts
    user.loginAttempts += 1;

    // Lock account after 5 failed attempts
    // if (user.loginAttempts >= 5 && !user.isAccountLocked()) {
    //   // Lock for 30 minutes
    //   const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
    //   user.lockUntil = lockUntil;
    // }

    await user.save();

    // Track failed login attempt
    await UserMetricActivityService.createActivity({
      userId: user._id.toString(),
      activityType: "login_failed",
      feature: "authentication",
      metadata: {
        method: "email",
        attempts: user.loginAttempts,
        isLocked: user.isAccountLocked(),
      },
      status: "failed",
    });

    throw new InvalidCredentialsError();
  }

  // Reset login attempts and lock
  user.loginAttempts = 0;
  user.lockUntil = undefined;

  // Update last login
  user.lastLogin = new Date();

  // Generate tokens
  const accessToken = generateAccessToken(user._id, user.email, user.role);
  const refreshToken = generateRefreshToken(user._id, user.email, user.role);

  // For superadmin, don't store refresh token
  if (user.role !== "superadmin") {
    // Store refresh token with user agent and IP info
    const userAgent = req.headers["user-agent"] ?? "";
    const ip = req.ip ?? "";

    user.refreshTokens.push({
      token: refreshToken,
      expiresAt: getTokenExpirationDate(refreshToken),
      userAgent,
      ip,
      createdAt: new Date(),
    });

    await user.save();

    // Track successful login
    await UserMetricActivityService.createActivity({
      userId: user._id.toString(),
      activityType: "user_login",
      feature: "authentication",
      metadata: {
        method: "email",
        isPilot,
        userAgent,
        ip,
      },
      status: "success",
    });
  }

  const savedUser: IUser | null = await User.findById(user._id)
    .select("-password -refreshTokens")
    .populate({ path: "organizationMember", select: "name industry" })
    .populate({ path: "managedBy", select: "firstName lastName email" })
    .populate({ path: "department", select: "name description" });

  return {
    user: savedUser,
    accessToken,
    refreshToken: user.role === "superadmin" ? "" : refreshToken, // Don't return refresh token for superadmin
  };
};

export const refreshToken = async (
  token: string,
  req: Request,
): Promise<{ accessToken: string; refreshToken: string }> => {
  // Verify the refresh token
  const payload = verifyRefreshToken(token);

  // // Find user and check if refresh token exists
  const user = await User.findById(payload.userId);

  if (!user) {
    throw new InvalidTokenError();
  }

  // // Find the token in the user's refresh tokens
  // const tokenIndex = user.refreshTokens.findIndex((t) => t.token === token);

  // if (tokenIndex === -1) {
  //   throw new InvalidTokenError({ message: "Token not found in user records" });
  // }

  // // Remove the old refresh token
  // user.refreshTokens.splice(tokenIndex, 1);

  // Generate new tokens
  const accessToken = generateAccessToken(
    user._id.toString(),
    user.email,
    user.role,
  );
  const newRefreshToken = generateRefreshToken(
    user._id.toString(),
    user.email,
    user.role,
  );

  // Store new refresh token
  const userAgent = req.headers["user-agent"] ?? "";
  const ip = req.ip ?? "";

  user.refreshTokens.push({
    token: newRefreshToken,
    expiresAt: getTokenExpirationDate(newRefreshToken),
    userAgent,
    ip,
    createdAt: new Date(),
  });

  await user.save();

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};

export const logout = async (
  userId: string,
  refreshToken?: string,
): Promise<void> => {
  const user = await User.findById(userId);

  if (!user) {
    return; // No user found, but we don't need to throw an error for logout
  }

  if (refreshToken) {
    // Remove specific refresh token
    user.refreshTokens = user.refreshTokens.filter(
      (t) => t.token !== refreshToken,
    );
  } else {
    // Remove all refresh tokens (logout from all devices)
    user.refreshTokens = [];
  }

  await user.save();

  // Track logout activity
  await UserMetricActivityService.createActivity({
    userId: user._id.toString(),
    activityType: "user_logout",
    feature: "authentication",
    metadata: {
      method: "token",
    },
    status: "success",
  });
};

export const completeOnboarding = async (
  userId: string,
): Promise<{
  type?: string;
  onboardingSteps: number[];
  interests?: string[];
  userId: string;
  hasOnBoarded: boolean;
}> => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return {
    type: user.type,
    onboardingSteps: user.onboardingSteps ?? [],
    interests: user.interests,
    userId: user._id.toString(),
    hasOnBoarded: user.hasOnBoarded,
  };
};

export const getUser = async (userId: string): Promise<IUser | null> => {
  return User.findById(userId).select("-password -refreshTokens");
};

export const googleAuth = async (
  googleId: string,
  email: string,
  firstName: string,
  lastName: string,
  req: Request,
): Promise<LoginResult> => {
  let user = await User.findOne({
    $or: [{ googleId }, { email: email.toLowerCase() }],
  });

  if (user) {
    user.googleId ??= googleId;
  } else {
    // Create new user
    user = new User({
      email: email.toLowerCase(),
      firstName,
      lastName,
      googleId,
      role: "admin",
      isEmailVerified: true,
      passwordChangeRequired: false,
    });

    // Track new user registration via Google
    await UserMetricActivityService.createActivity({
      userId: user._id.toString(),
      activityType: "user_signup",
      feature: "authentication",
      metadata: {
        method: "google",
        role: user.role,
      },
      status: "success",
    });
  }

  // Update last login
  user.lastLogin = new Date();

  // Generate tokens
  const accessToken = generateAccessToken(
    user._id.toString(),
    user.email,
    user.role,
  );
  const refreshToken = generateRefreshToken(
    user._id.toString(),
    user.email,
    user.role,
  );

  // Store refresh token with user agent and IP info
  const userAgent = req.headers["user-agent"] ?? "";
  const ip = req.ip ?? "";

  user.refreshTokens.push({
    token: refreshToken,
    expiresAt: getTokenExpirationDate(refreshToken),
    userAgent,
    ip,
    createdAt: new Date(),
  });

  await user.save();

  await processTeamInvitesForUser(user._id.toString(), user.email);

  // Track successful login
  await UserMetricActivityService.createActivity({
    userId: user._id.toString(),
    activityType: "user_login",
    feature: "authentication",
    metadata: {
      method: "google",
      userAgent,
      ip,
    },
    status: "success",
  });

  const savedUser: IUser | null = await User.findById(user._id)
    .select("-password -refreshTokens")
    .populate({ path: "organizationMember", select: "name industry" })
    .populate({ path: "managedBy", select: "firstName lastName email" })
    .populate({ path: "department", select: "name description" });

  return {
    user: savedUser,
    accessToken,
    refreshToken,
  };
};

export const facebookAuth = async (
  fbAccessToken: string,
  req: Request,
): Promise<LoginResult> => {
  // Verify the Facebook access token
  const response = await fetch(
    `https://graph.facebook.com/v19.0/me?fields=id,email,first_name,last_name&access_token=${fbAccessToken}`,
  );

  if (!response.ok) {
    throw new AppError("Invalid Facebook token", "FACEBOOK_AUTH_ERROR", 401);
  }

  const data = await response.json();

  if (!data.email || !data.id) {
    throw new AppError("Invalid Facebook token", "FACEBOOK_AUTH_ERROR", 401);
  }

  // Find or create user
  let user = await User.findOne({
    $or: [{ facebookId: data.id }, { email: data.email.toLowerCase() }],
  });

  if (user) {
    user.facebookId ??= data.id;
  } else {
    user = new User({
      email: data.email.toLowerCase(),
      firstName: data.first_name ?? "",
      lastName: data.last_name ?? "",
      facebookId: data.id,
      role: "admin",
      isEmailVerified: true,
      passwordChangeRequired: false,
    });

    // Track new user registration via Facebook
    await UserMetricActivityService.createActivity({
      userId: user._id.toString(),
      activityType: "user_signup",
      feature: "authentication",
      metadata: {
        method: "facebook",
        role: user.role,
      },
      status: "success",
    });
  }

  // Update last login
  user.lastLogin = new Date();

  // Generate tokens
  const accessToken = generateAccessToken(
    user._id.toString(),
    user.email,
    user.role,
  );
  const refreshToken = generateRefreshToken(
    user._id.toString(),
    user.email,
    user.role,
  );

  // Store refresh token with user agent and IP info
  const userAgent = req.headers["user-agent"] ?? "";
  const ip = req.ip ?? "";

  user.refreshTokens.push({
    token: refreshToken,
    expiresAt: getTokenExpirationDate(refreshToken),
    userAgent,
    ip,
    createdAt: new Date(),
  });

  await user.save();

  await processTeamInvitesForUser(user._id.toString(), user.email);

  // Track successful login
  await UserMetricActivityService.createActivity({
    userId: user._id.toString(),
    activityType: "user_login",
    feature: "authentication",
    metadata: {
      method: "facebook",
      userAgent,
      ip,
    },
    status: "success",
  });

  const savedUser: IUser | null = await User.findById(user._id)
    .select("-password -refreshTokens")
    .populate({ path: "organizationMember", select: "name industry" })
    .populate({ path: "managedBy", select: "firstName lastName email" })
    .populate({ path: "department", select: "name description" });

  return {
    user: savedUser,
    accessToken,
    refreshToken,
  };
};

export async function getAllUsers() {
  console.log(await Agent.collection.indexes());

  return User.find().select("-password -refreshTokens");
}

// Add new function to update user profile
export const updateUserProfile = async (
  userId: string,
  updateData: UpdateProfileData,
): Promise<IUser> => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Update user fields if provided
  if (updateData.firstName) {
    user.firstName = updateData.firstName;
  }

  if (updateData.lastName) {
    user.lastName = updateData.lastName;
  }

  if (updateData.bio) {
    user.bio = updateData.bio;
  }

  // Update profile picture if provided
  if (updateData.profilePicture) {
    user.profilePicture = getFileUrl(
      updateData.profilePicture,
      "profile-picture",
    );
  }

  await user.save();

  return user;
};

export const createOnboarding = async (
  userId: string,
  updateData: CreateOnboardingInput,
): Promise<{
  type?: string;
  onboardingSteps: number[];
  interests?: string[];
  userId: string;
  hasOnBoarded: boolean;
}> => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (updateData.type) {
    user.type = updateData.type;
  }
  if (updateData.onboardingStep !== undefined) {
    if (!user.onboardingSteps?.includes(updateData.onboardingStep)) {
      user.onboardingSteps?.push(updateData.onboardingStep);
    }
  }
  if (updateData.interests) {
    user.interests = updateData.interests;
  }

  const isOnboardingComplete =
    user.type === "individual"
      ? Boolean(
          user.type &&
            user.onboardingSteps?.length === 3 &&
            (user.interests?.length ?? 0) > 0,
        )
      : Boolean(
          user.type === "team" &&
            (user.onboardingSteps?.length === 4 ||
              user.onboardingSteps?.length === 3 ||
              user.onboardingSteps?.length === 2),
        );
  user.hasOnBoarded = isOnboardingComplete;

  await user.save();

  return {
    type: user.type,
    onboardingSteps: user.onboardingSteps ?? [],
    interests: user.interests,
    userId: user._id.toString(),
    hasOnBoarded: user.hasOnBoarded,
  };
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const isPasswordValid = await user.comparePassword(currentPassword);

  if (!isPasswordValid) {
    // Track failed password change attempt
    await UserMetricActivityService.createActivity({
      userId: user._id.toString(),
      activityType: "error_occurred",
      feature: "authentication",
      metadata: {
        reason: "invalid_current_password",
      },
      status: "failed",
    });

    throw new InvalidCredentialsError();
  }

  user.password = newPassword;
  user.passwordChangeRequired = false;
  await user.save();

  // Track successful password change
  await UserMetricActivityService.createActivity({
    userId: user._id.toString(),
    activityType: "user_login",
    feature: "authentication",
    metadata: {
      method: "manual",
    },
    status: "success",
  });
};

export const initializeFreemiumTrial = async (
  userId: string,
): Promise<void> => {
  // IMPORTANT: If the Freemium plan's _id changes in the database, update the FREEMIUM_PLAN_ID constant in `shared/utils/constants.ts`.
  const freemiumPlan = await BillingPlan.findById(FREEMIUM_PLAN_ID);

  if (!freemiumPlan) {
    throw new NotFoundError("Freemium plan not found");
  }

  const trialStartDate = new Date();
  const trialEndDate = new Date(trialStartDate);
  trialEndDate.setDate(trialEndDate.getDate() + 14);

  const usageLog = new UsageLogs({
    userId: new mongoose.Types.ObjectId(userId),
    is_subscribed: false,
    plan_status: "trialing",
    trial_start_date: trialStartDate,
    trial_end_date: trialEndDate,
    is_trial_used: false,
    agent_access_limit: 1,
    team_member_limit: 1,
    call_minutes_used: 0,
    call_minutes_limit: 60,
    call_minutes_remaining: 60,
    chat_tokens_used: 0,
    chat_tokens_limit: 5000,
    plan_id: freemiumPlan._id,
    customer_id: null,
    subscription_id: null,
  });

  await usageLog.save();
};

export const getUsageLogs = async (
  userId: string,
): Promise<IUsageLogs | null> => {
  return UsageLogs.findOne({ userId: new mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .exec();
};
