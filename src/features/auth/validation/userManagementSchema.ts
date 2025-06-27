import { z } from 'zod';
import mongoose from 'mongoose';

// Helper function to validate MongoDB ObjectIds
const isValidObjectId = (value: string) => 
  mongoose.Types.ObjectId.isValid(value) || 'Invalid ID format';

// User ID parameter validation
export const userIdParam = z.object({
  userId: z.string().refine(isValidObjectId),
});

// Create new user validation
const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['admin', 'manager', 'employee'], {
    errorMap: () => ({ message: 'Role must be admin, manager, or employee' })
  }),
  department: z.string().refine(isValidObjectId).optional(),
  position: z.string().optional(),
});

// Update user validation
const updateUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  role: z.enum(['admin', 'manager', 'employee'], {
    errorMap: () => ({ message: 'Role must be admin, manager, or employee' })
  }).optional(),
  department: z.string().refine(isValidObjectId).optional(),
  position: z.string().optional(),
});

// Lock user account validation
const lockUserAccountSchema = z.object({
  lockDuration: z.number().int().positive().optional(),
});

// Email verification token validation
const emailVerificationSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

// Send verification email validation
const sendVerificationEmailSchema = z.object({
  email: z.string().email('Invalid email format'),
});

// Password reset request validation
const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
});

// Password reset validation
const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// Magic link verification and password setup validation
const magicLinkVerificationSchema = z.object({
  token: z.string().min(1, 'Magic link token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// Check password set status validation
const checkPasswordSetStatusSchema = z.object({
  token: z.string().min(1, 'Magic link token is required'),
});

// Change password validation
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// Export types for use in controllers
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserIdParams = z.infer<typeof userIdParam>;
export type LockUserAccountInput = z.infer<typeof lockUserAccountSchema>;
export type EmailVerificationInput = z.infer<typeof emailVerificationSchema>;
export type SendVerificationEmailInput = z.infer<typeof sendVerificationEmailSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type MagicLinkVerificationInput = z.infer<typeof magicLinkVerificationSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// Export schemas for validation middleware
export const userManagementSchemas = {
  createUserSchema: { body: createUserSchema },
  updateUserSchema: { 
    params: userIdParam,
    body: updateUserSchema
  },
  userIdSchema: { params: userIdParam },
  lockUserAccountSchema: { 
    params: userIdParam,
    body: lockUserAccountSchema
  },
  emailVerificationSchema: { body: emailVerificationSchema },
  sendVerificationEmailSchema: { body: sendVerificationEmailSchema },
  passwordResetRequestSchema: { body: passwordResetRequestSchema },
  passwordResetSchema: { body: passwordResetSchema },
  magicLinkVerificationSchema: { body: magicLinkVerificationSchema },
  checkPasswordSetStatusSchema: { body: checkPasswordSetStatusSchema },
  changePasswordSchema: { body: changePasswordSchema },
}; 