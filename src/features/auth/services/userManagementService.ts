import User, { IUser } from "../../../shared/models/User";
import { AppError, NotFoundError } from "../../../shared/errors/AppError";
import mongoose from "mongoose";
import {
  sendEmailVerificationEmail,
  sendPasswordResetEmail,
  sendTemporaryPasswordEmail,
  sendAccountLockEmail,
  sendMagicLinkSetupEmail,
} from "../../../shared/services/emailService";
import {
  generateEmailToken,
  verifyEmailToken,
} from "../../../shared/services/tokenService";
import config from "../../../shared/config";
import crypto from "crypto";
import logger from "../../../shared/utils/logger";
import { Department } from "../../../shared/models/Department";
import { useWebhookTrigger } from "../../../shared/services/webhookService";

interface UserUpdateData {
  firstName?: string;
  lastName?: string;
  department?: string;
  position?: string;
  role?: string;
}

interface NewUserData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  type?: string;
  department?: string;
  position?: string;
  managedBy?: string;
  hasOnBoarded?: boolean;
}

/**
 * Generate a secure random temporary password
 * @returns Temporary password
 */
export const generateTemporaryPassword = (): string => {
  // Generate a random password with letters, numbers, and special characters
  const length = 12;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+";
  let password = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }

  return password;
};

/**
 * Find user by email
 * @param email - User email
 * @returns User or null if not found
 */
export const findUserByEmail = async (email: string): Promise<IUser | null> => {
  return User.findOne({ email: email.toLowerCase() }).select(
    "-password -refreshTokens",
  );
};

/**
 * Get all users (admin only)
 * @returns List of all users
 */
export const getAllUsers = async (userId: string): Promise<IUser[]> => {
  const managedByQuery = { managedBy: new mongoose.Types.ObjectId(userId) };

  const [managedUsers, loggedInUser] = await Promise.all([
    User.find(managedByQuery)
      .select("-password -refreshTokens")
      .populate("department", "name"),
    User.findById(userId)
      .select("-password -refreshTokens")
      .populate("department", "name"),
  ]);

  const allUsers = [...managedUsers];

  // Only add the logged-in user if not already in the managedUsers list
  if (!managedUsers.some((user) => user._id == userId)) {
    allUsers.unshift(loggedInUser as any);
  }

  return allUsers as any;
};

/**
 * Get user by ID (admin only)
 * @param userId - User ID
 * @returns User object
 */
export const getUserById = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId)
    .select("-password -refreshTokens")
    .populate("department", "name");

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return user;
};

/**
 * Update user details (admin only)
 * @param userId - User ID
 * @param updateData - Data to update
 * @returns Updated user
 */
export const updateUser = async (
  userId: string,
  updateData: UserUpdateData,
): Promise<IUser> => {
  // Validate userId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user ID", "INVALID_ID", 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Update user fields
  if (updateData.firstName) user.firstName = updateData.firstName;
  if (updateData.lastName) user.lastName = updateData.lastName;
  if (updateData.role) user.role = updateData.role;

  if (updateData.department) {
    user.department = updateData.department
      ? new mongoose.Types.ObjectId(updateData.department)
      : undefined;
  }

  if (updateData.position) user.position = updateData.position;

  await user.save();
  await useWebhookTrigger("user.updated", user, userId);
  return user;
};

/**
 * Create a new user with temporary password (admin only)
 * @param userData - New user data
 * @returns Created user
 */
export const createUserWithTemporaryPassword = async (
  userData: NewUserData,
): Promise<IUser> => {
  // Check if email already exists
  const existingUser: any = await User.findOne({
    email: userData.email.toLowerCase(),
  });

  if (userData.role === "admin") {
    throw new AppError(
      "Admin role is not allowed to be created",
      "ADMIN_ROLE_NOT_ALLOWED",
      400,
    );
  }

  if (existingUser) {
    const isManageAlready = existingUser?.managedBy?.some(
      (managedBy: any) => managedBy.toString() === userData.managedBy,
    );
    if (!isManageAlready) {
      console.log("Rumming here", userData.managedBy);
      if (!existingUser.managedBy) {
        existingUser.managedBy = [];
      }
      existingUser.managedBy.push(
        new mongoose.Types.ObjectId(userData.managedBy),
      );
      await existingUser.save();
      const userWithoutPassword = existingUser;
      delete userWithoutPassword.password;
      return userWithoutPassword as IUser;
    }
    throw new AppError("User already exists", "USER_ALREADY_EXISTS", 400);
  } else {
    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();

    // Create new user
    const user = new User({
      email: userData.email.toLowerCase(),
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      password: temporaryPassword,
      isEmailVerified: false, // User will be verified after changing password
      passwordChangeRequired: true, // Require password change on first login
      type: userData.type,
      hasOnBoarded: userData?.hasOnBoarded ?? false,
      department: userData.department
        ? new mongoose.Types.ObjectId(userData.department)
        : undefined,
      position: userData.position,
      managedBy: [new mongoose.Types.ObjectId(userData.managedBy)],
    });

    await user.save();

    //add user to department
    if (userData.department) {
      await Department.findByIdAndUpdate(userData.department, {
        $push: { members: user._id },
      });
    }

    // Generate magic link token for password setup
    const magicLinkToken = generateEmailToken(
      user._id.toString(),
      user.email,
      "magic_link_setup",
    );

    // Create magic link that redirects to password setup page
    const magicLink = `${config.frontendUrl}/set-password?token=${magicLinkToken}`;

    // Send email with magic link
    await sendMagicLinkSetupEmail(
      user.email,
      `${user.firstName} ${user.lastName}`,
      magicLink,
    );

    await useWebhookTrigger(
      "user.created",
      user,
      userData.managedBy?.toString() || "",
    );

    // Return user without password
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;
    return userWithoutPassword as IUser;
  }
};

/**
 * Delete user (admin only)
 * @param userId - User ID
 * @returns Success status
 */
export const deleteUser = async (
  userId: string,
): Promise<{ success: boolean }> => {
  // Validate userId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user ID", "INVALID_ID", 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Instead of hard delete, consider soft delete in production applications
  await User.deleteOne({ _id: userId });
  await useWebhookTrigger(
    "user.deleted",
    { message: `User Deleted with ID ${userId} Successfully`, id: userId },
    userId,
  );

  return { success: true };
};

/**
 * Lock user account (admin only)
 * @param userId - User ID
 * @param lockDuration - Lock duration in minutes (default 30 minutes)
 * @returns Locked user
 */
export const lockUserAccount = async (
  userId: string,
  lockDuration: number = 30,
): Promise<IUser> => {
  // Validate userId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user ID", "INVALID_ID", 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Lock account
  const lockUntil = new Date(Date.now() + lockDuration * 60 * 1000);
  user.lockUntil = lockUntil;

  await user.save();

  // Send email notification
  await sendAccountLockEmail(
    user.email,
    `${user.firstName} ${user.lastName}`,
    lockUntil,
  );

  return user;
};

/**
 * Unlock user account (admin only)
 * @param userId - User ID
 * @returns Unlocked user
 */
export const unlockUserAccount = async (userId: string): Promise<IUser> => {
  // Validate userId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user ID", "INVALID_ID", 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Unlock account
  user.lockUntil = undefined;
  user.loginAttempts = 0;

  await user.save();

  return user;
};

/**
 * Reset user password with generated temporary password (admin only)
 * @param userId - User ID
 * @returns Success status
 */
export const resetUserPassword = async (
  userId: string,
): Promise<{ success: boolean }> => {
  // Validate userId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user ID", "INVALID_ID", 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Generate temporary password
  const temporaryPassword = generateTemporaryPassword();

  // Update user password
  user.password = temporaryPassword;

  // Require password change on next login
  user.passwordChangeRequired = true;

  await user.save();

  // Send email with temporary password
  const loginLink = `${config.frontendUrl}/login`;
  await sendTemporaryPasswordEmail(
    user.email,
    `${user.firstName} ${user.lastName}`,
    temporaryPassword,
    loginLink,
  );

  return { success: true };
};

/**
 * Send email verification link
 * @param userId - User ID
 * @returns Success status
 */
export const sendEmailVerification = async (
  userId: string,
): Promise<{ success: boolean }> => {
  // Validate userId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user ID", "INVALID_ID", 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Generate verification token
  const verificationToken = generateEmailToken(
    user._id.toString(),
    user.email,
    "email_verification",
  );

  // Create verification link
  const verificationLink = `${config.frontendUrl}/verify-email?token=${verificationToken}`;

  // Send verification email
  const sent = await sendEmailVerificationEmail(
    user.email,
    `${user.firstName} ${user.lastName}`,
    verificationLink,
  );

  if (!sent) {
    logger.error(`Failed to send verification email to ${user.email}`);
    throw new AppError(
      "Failed to send verification email",
      "EMAIL_SEND_FAILED",
      500,
    );
  }

  return { success: true };
};

/**
 * Verify email with token
 * @param token - Verification token
 * @returns Success status
 */
export const verifyEmail = async (
  token: string,
): Promise<{ success: boolean }> => {
  try {
    // Verify token
    const payload = verifyEmailToken(token, "email_verification");

    // Find user
    const user = await User.findById(payload.userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Check if email matches
    if (user.email !== payload.email) {
      throw new AppError("Invalid token", "INVALID_TOKEN", 400);
    }

    // Mark email as verified
    user.isEmailVerified = true;

    await user.save();

    return { success: true };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Email verification failed", "VERIFICATION_FAILED", 400);
  }
};

/**
 * Send password reset link
 * @param email - User email
 * @returns Success status
 */
export const sendPasswordResetLink = async (
  email: string,
): Promise<{ success: boolean }> => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // For security reasons, don't reveal that the user doesn't exist
    return { success: true };
  }

  // Generate reset token
  const resetToken = generateEmailToken(
    user._id.toString(),
    user.email,
    "password_reset",
  );

  // Create reset link
  const resetLink = `${config.frontendUrl}/reset-password?token=${resetToken}`;

  // Send reset email
  const sent = await sendPasswordResetEmail(
    user.email,
    `${user.firstName} ${user.lastName}`,
    resetLink,
  );

  if (!sent) {
    logger.error(`Failed to send password reset email to ${user.email}`);
    throw new AppError(
      "Failed to send password reset email",
      "EMAIL_SEND_FAILED",
      500,
    );
  }

  return { success: true };
};

/**
 * Reset password with token
 * @param token - Reset token
 * @param newPassword - New password
 * @returns Success status
 */
export const resetPassword = async (
  token: string,
  newPassword: string,
): Promise<{ success: boolean }> => {
  try {
    // Verify token
    const payload = verifyEmailToken(token, "password_reset");

    // Find user
    const user = await User.findById(payload.userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Check if email matches
    if (user.email !== payload.email) {
      throw new AppError("Invalid token", "INVALID_TOKEN", 400);
    }

    // Validate password
    if (!newPassword || newPassword.length < 8) {
      throw new AppError(
        "Password must be at least 8 characters",
        "INVALID_PASSWORD",
        400,
      );
    }

    // Update password
    user.password = newPassword;

    // Mark email as verified since user has access to their email
    user.isEmailVerified = true;

    // Clear the password change requirement flag
    user.passwordChangeRequired = false;

    // Reset login attempts and unlock account
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    // Clear refresh tokens to invalidate all sessions
    user.refreshTokens = [];

    await user.save();

    return { success: true };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Password reset failed", "RESET_FAILED", 400);
  }
};

/**
 * Change password for current user
 * @param userId - User ID
 * @param currentPassword - Current password
 * @param newPassword - New password
 * @returns Success status
 */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean }> => {
  // Validate userId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user ID", "INVALID_ID", 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);

  if (!isPasswordValid) {
    throw new AppError(
      "Current password is incorrect",
      "INVALID_PASSWORD",
      400,
    );
  }

  // Validate new password
  if (!newPassword || newPassword.length < 8) {
    throw new AppError(
      "New password must be at least 8 characters",
      "INVALID_PASSWORD",
      400,
    );
  }

  // Update password
  user.password = newPassword;

  // Mark email as verified when user changes password
  // This helps with admin-created accounts where users are required to
  // change their temporary password on first login
  user.isEmailVerified = true;

  // Clear the password change requirement flag
  user.passwordChangeRequired = false;

  await user.save();

  return { success: true };
};

/**
 * Verify magic link and set up password for new user
 * @param token - Magic link token
 * @param newPassword - New password to set
 * @returns Success status
 */
export const verifyMagicLinkAndSetupPassword = async (
  token: string,
  newPassword: string,
): Promise<{ success: boolean }> => {
  try {
    // Verify token
    const payload = verifyEmailToken(token, "magic_link_setup");

    // Find user
    const user = await User.findById(payload.userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Check if email matches
    if (user.email !== payload.email) {
      throw new AppError("Invalid token", "INVALID_TOKEN", 400);
    }

    // Validate password
    if (!newPassword || newPassword.length < 8) {
      throw new AppError(
        "Password must be at least 8 characters",
        "INVALID_PASSWORD",
        400,
      );
    }

    // Update password
    user.password = newPassword;

    // Mark email as verified since user has access to their email
    user.isEmailVerified = true;

    // Clear the password change requirement flag
    user.passwordChangeRequired = false;

    // Reset login attempts and unlock account
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    // Clear refresh tokens to invalidate all sessions
    user.refreshTokens = [];

    await user.save();

    return { success: true };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      "Magic link verification failed",
      "VERIFICATION_FAILED",
      400,
    );
  }
};

/**
 * Check if user has already set their password using magic link token
 * @param token - Magic link token
 * @returns Object indicating if password is already set
 */
export const checkPasswordSetStatus = async (
  token: string,
): Promise<{
  success: boolean;
  passwordAlreadySet: boolean;
  user?: { email: string; firstName: string; lastName: string };
}> => {
  try {
    // Verify token
    const payload = verifyEmailToken(token, "magic_link_setup");

    // Find user
    const user = await User.findById(payload.userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Check if email matches
    if (user.email !== payload.email) {
      throw new AppError("Invalid token", "INVALID_TOKEN", 400);
    }

    // Check if password is already set (user has changed from temporary password)
    const passwordAlreadySet =
      !user.passwordChangeRequired && user.isEmailVerified;

    return {
      success: true,
      passwordAlreadySet,
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Token verification failed", "VERIFICATION_FAILED", 400);
  }
};
