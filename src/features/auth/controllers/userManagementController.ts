import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../shared/middleware/authenticate';
import { sendSuccess } from '../../../shared/utils/response.utils';
import * as userManagementService from '../services/userManagementService';
import {
  UserIdParams,
  CreateUserInput,
  UpdateUserInput,
  LockUserAccountInput,
  EmailVerificationInput,
  SendVerificationEmailInput,
  PasswordResetRequestInput,
  PasswordResetInput,
  MagicLinkVerificationInput,
  ChangePasswordInput,
} from '../validation/userManagementSchema';
import { AppError } from '../../../shared/errors/AppError';
import logger from '../../../shared/utils/logger';

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User ID is required', 'USER_ID_REQUIRED', 400);
    }
    const users = await userManagementService.getAllUsers(userId);
    sendSuccess(res, users);
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID (admin only)
 */
export const getUserById = async (
  req: AuthenticatedRequest<UserIdParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const user = await userManagementService.getUserById(userId);
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new user with temporary password (admin only)
 */
export const createUser = async (
  req: AuthenticatedRequest<{}, {}, CreateUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userData : CreateUserInput & { managedBy?: string } = req.body;
    userData.managedBy = req.user?.userId;
    const user = await userManagementService.createUserWithTemporaryPassword(userData);
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

/**
 * Update user details (admin only)
 */
export const updateUser = async (
  req: AuthenticatedRequest<UserIdParams, {}, UpdateUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    const user = await userManagementService.updateUser(userId, updateData);
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user (admin only)
 */
export const deleteUser = async (
  req: AuthenticatedRequest<UserIdParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const result = await userManagementService.deleteUser(userId);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Lock user account (admin only)
 */
export const lockUserAccount = async (
  req: AuthenticatedRequest<UserIdParams, {}, LockUserAccountInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const { lockDuration } = req.body;
    const user = await userManagementService.lockUserAccount(userId, lockDuration);
    sendSuccess(res, { userId: user._id, locked: true, lockUntil: user.lockUntil });
  } catch (error) {
    next(error);
  }
};

/**
 * Unlock user account (admin only)
 */
export const unlockUserAccount = async (
  req: AuthenticatedRequest<UserIdParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const user = await userManagementService.unlockUserAccount(userId);
    sendSuccess(res, { userId: user._id, locked: false });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset user password (admin only)
 */
export const resetUserPassword = async (
  req: AuthenticatedRequest<UserIdParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const result = await userManagementService.resetUserPassword(userId);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Verify email with token (public)
 */
export const verifyEmail = async (
  req: Request<{}, {}, EmailVerificationInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.body;
    const result = await userManagementService.verifyEmail(token);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Send verification email (public)
 */
export const sendVerificationEmail = async (
  req: Request<{}, {}, SendVerificationEmailInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    
    // Find user by email first
    const user = await userManagementService.findUserByEmail(email);
    
    if (!user) {
      // For security, don't reveal that the email doesn't exist
      sendSuccess(res, { success: true });
      return;
    }
    
    if (user.isEmailVerified) {
      sendSuccess(res, { success: true, message: 'Email already verified' });
      return;
    }
    
    const result = await userManagementService.sendEmailVerification(user._id.toString());
    sendSuccess(res, result);
  } catch (error) {
    logger.error("Error sending verification email ");
    logger.error(error);
    sendSuccess(res, { success: true });
  }
};

/**
 * Request password reset (public)
 */
export const requestPasswordReset = async (
  req: Request<{}, {}, PasswordResetRequestInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    const result = await userManagementService.sendPasswordResetLink(email);
    sendSuccess(res, result);
  } catch (error) {
    logger.error("Error sending password reset link");
    logger.error(error);
    sendSuccess(res, { success: true });
  }
};

/**
 * Reset password with token (public)
 */
export const resetPassword = async (
  req: Request<{}, {}, PasswordResetInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, newPassword } = req.body;
    const result = await userManagementService.resetPassword(token, newPassword);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Change password (authenticated)
 */
export const changePassword = async (
  req: AuthenticatedRequest<{}, {}, ChangePasswordInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { currentPassword, newPassword } = req.body;
    const result = await userManagementService.changePassword(
      req.user.userId,
      currentPassword,
      newPassword
    );
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Verify magic link and set up password (public)
 */
export const verifyMagicLinkAndSetupPassword = async (
  req: Request<{}, {}, MagicLinkVerificationInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, newPassword } = req.body;
    const result = await userManagementService.verifyMagicLinkAndSetupPassword(token, newPassword);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Check password set status with magic link token (public)
 */
export const checkPasswordSetStatus = async (
  req: Request<{}, {}, { token: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.body;
    const result = await userManagementService.checkPasswordSetStatus(token);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}; 