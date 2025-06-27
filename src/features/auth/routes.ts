import { Router } from 'express';
import * as authController from './controllers/authController';
import * as userManagementController from './controllers/userManagementController';
import { authenticate, requireRole } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  googleAuthSchema,
  updateProfileSchema,
  facebookAuthSchema,
  createOnboardingSchema,
} from './validation/authSchema';
import { userManagementSchemas } from './validation/userManagementSchema';
import { profilePictureUpload } from '../../shared/middleware/fileUpload';

const router = Router();

// Public auth routes
router.post(
  '/register',
  profilePictureUpload.single('profilePicture'),
  validate({ body: registerSchema }),
  authController.register
);

router.post(
  '/login',
  validate({ body: loginSchema }),
  authController.login
);

router.post(
  '/refresh-token',
  validate({ body: refreshTokenSchema }),
  authController.refreshToken
);

router.post(
  '/google',
  validate({ body: googleAuthSchema }),
  authController.googleAuth
);

// Add Facebook auth route
router.post(
  '/facebook',
  validate({ body: facebookAuthSchema }),
  authController.facebookAuth
);

// Protected auth routes
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getUser);

// Public user management routes
// Email verification
router.post(
  '/verify-email',
  validate(userManagementSchemas.emailVerificationSchema),
  userManagementController.verifyEmail
);

router.get(
  '/complete-onboarding',
  authenticate,
  authController.completeOnboarding
);


// Request email verification link
router.post(
  '/send-verification',
  validate(userManagementSchemas.sendVerificationEmailSchema),
  userManagementController.sendVerificationEmail
);

// Request password reset
router.post(
  '/request-password-reset',
  validate(userManagementSchemas.passwordResetRequestSchema),
  userManagementController.requestPasswordReset
);

// Reset password with token
router.post(
  '/reset-password',
  validate(userManagementSchemas.passwordResetSchema),
  userManagementController.resetPassword
);

// Magic link verification and password setup
router.post(
  '/verify-magic-link',
  validate(userManagementSchemas.magicLinkVerificationSchema),
  userManagementController.verifyMagicLinkAndSetupPassword
);

// Check password set status
router.post(
  '/check-password-set-status',
  validate(userManagementSchemas.checkPasswordSetStatusSchema),
  userManagementController.checkPasswordSetStatus
);

// Authenticated user management routes
// Change password (requires authentication)
router.post(
  '/change-password',
  authenticate,
  validate(userManagementSchemas.changePasswordSchema),
  userManagementController.changePassword
);

// Admin routes (requires admin role)
// Get all users
router.get(
  '/users',
  authenticate,
  requireRole(['admin']),
  userManagementController.getAllUsers
);

// Get user by ID
router.get(
  '/users/:userId',
  authenticate,
  requireRole(['admin']),
  validate(userManagementSchemas.userIdSchema),
  userManagementController.getUserById
);

// Create new user
router.post(
  '/users',
  authenticate,
  requireRole(['admin']),
  validate(userManagementSchemas.createUserSchema),
  userManagementController.createUser
);

// Update user
router.put(
  '/users/:userId',
  authenticate,
  requireRole(['admin']),
  validate(userManagementSchemas.updateUserSchema),
  userManagementController.updateUser
);

// Delete user
router.delete(
  '/users/:userId',
  authenticate,
  requireRole(['admin']),
  validate(userManagementSchemas.userIdSchema),
  userManagementController.deleteUser
);

// Lock user account
router.post(
  '/users/:userId/lock',
  authenticate,
  requireRole(['admin']),
  validate(userManagementSchemas.lockUserAccountSchema),
  userManagementController.lockUserAccount
);

// Unlock user account
router.post(
  '/users/:userId/unlock',
  authenticate,
  requireRole(['admin']),
  validate(userManagementSchemas.userIdSchema),
  userManagementController.unlockUserAccount
);

// Reset user password (generate temporary password)
router.post(
  '/users/:userId/reset-password',
  authenticate,
  requireRole(['admin']),
  validate(userManagementSchemas.userIdSchema),
  userManagementController.resetUserPassword
);

// User profile routes (requires authentication)
router.put(
  '/profile',
  authenticate,
  profilePictureUpload.single('profilePicture'),
  validate({ body: updateProfileSchema }),
  authController.updateProfile
);

router.put(
  '/complete-onboarding',
  authenticate,
  validate({ body: createOnboardingSchema }),
  authController.createOnboarding
);

router.get("/usage-logs", authenticate, authController.getUsageLogs);

export default router;