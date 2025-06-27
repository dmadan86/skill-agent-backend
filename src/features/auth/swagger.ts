/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: API endpoints for user authentication
 * 
 * @swagger
 * tags:
 *   name: User Management
 *   description: API endpoints for user management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           example: SecurePass123
 *           description: User's password, minimum 8 characters
 *         firstName:
 *           type: string
 *           example: John
 *           description: User's first name
 *         lastName:
 *           type: string
 *           example: Doe
 *           description: User's last name
 *         role:
 *           type: string
 *           enum: [admin, manager, employee]
 *           default: employee
 *           description: User's role
 *         department:
 *           type: string
 *           example: Sales
 *           description: User's department
 *         position:
 *           type: string
 *           example: Sales Representative
 *           description: User's position
 *     
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: SecurePass123
 *     
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: 60d21b4667d0d8992e610c85
 *                 email:
 *                   type: string
 *                   example: user@example.com
 *                 firstName:
 *                   type: string
 *                   example: John
 *                 lastName:
 *                   type: string
 *                   example: Doe
 *                 role:
 *                   type: string
 *                   enum: [admin, manager, employee]
 *                   example: employee
 *                 department:
 *                   type: string
 *                   example: Sales
 *                 position:
 *                   type: string
 *                   example: Sales Representative
 *                 profilePicture:
 *                   type: string
 *                   example: /uploads/profile-pictures/1234567890.jpg
 *                   description: URL to the user's profile picture
 *                 passwordChangeRequired:
 *                   type: boolean
 *                   example: false
 *                   description: Indicates if the user needs to change their password
 *             accessToken:
 *               type: string
 *               example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 *     UpdateProfileRequest:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           example: John
 *         lastName:
 *           type: string
 *           example: Doe
 *       description: Profile picture is sent as multipart/form-data
 *
 *     UserResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: 60d21b4667d0d8992e610c85
 *             email:
 *               type: string
 *               example: user@example.com
 *             firstName:
 *               type: string
 *               example: John
 *             lastName:
 *               type: string
 *               example: Doe
 *             role:
 *               type: string
 *               enum: [admin, manager, employee]
 *               example: employee
 *             department:
 *               type: string
 *               example: Sales
 *             position:
 *               type: string
 *               example: Sales Representative
 *             profilePicture:
 *               type: string
 *               example: /uploads/profile-pictures/1234567890.jpg
 *               description: URL to the user's profile picture
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with optional profile picture
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, manager, employee]
 *               department:
 *                 type: string
 *               position:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: User's profile picture (jpg, jpeg, png, gif, webp)
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     firstName:
 *                       type: string
 *                       example: John
 *                     lastName:
 *                       type: string
 *                       example: Doe
 *                     role:
 *                       type: string
 *                       example: employee
 *                     profilePicture:
 *                       type: string
 *                       example: /uploads/profile-pictures/1234567890.jpg
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Email already in use
 * 
 * /auth/login:
 *   post:
 *     summary: Login to the system
 *     description: Authenticate with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account locked
 *
 * /auth/profile:
 *   put:
 *     summary: Update user profile
 *     description: Update user's profile information including optional profile picture
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: User's profile picture (jpg, jpeg, png, gif, webp)
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid input
 *
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the profile of the currently authenticated user
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Unauthorized
 *
 * /auth/google:
 *   post:
 *     summary: Login with Google
 *     description: Authenticate using Google OAuth
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid token
 *
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     description: Get a new access token using a valid refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token (optional if sent in cookie)
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Invalid refresh token
 *
 * /auth/logout:
 *   post:
 *     summary: Logout
 *     description: Invalidate the current refresh token and logout
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 *
 * /auth/change-password:
 *   post:
 *     summary: Change password
 *     description: Change the current user's password
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password (min 8 characters)
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized or current password is incorrect
 */

/**
 * @swagger
 * /auth/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /auth/users/{userId}:
 *   get:
 *     summary: Get user by ID (admin only)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to retrieve
 *     responses:
 *       200:
 *         description: User information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: User not found
 *   put:
 *     summary: Update user (admin only)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               role:
 *                 type: string
 *                 enum: [admin, manager, employee]
 *                 example: manager
 *               department:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c85
 *               position:
 *                 type: string
 *                 example: Team Lead
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: User not found
 *   delete:
 *     summary: Delete user (admin only)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /auth/users:
 *   post:
 *     summary: Create new user with temporary password (admin only)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - firstName
 *               - lastName
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newuser@example.com
 *               firstName:
 *                 type: string
 *                 example: Jane
 *               lastName:
 *                 type: string
 *                 example: Smith
 *               role:
 *                 type: string
 *                 enum: [admin, manager, employee]
 *                 example: employee
 *               department:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c85
 *               position:
 *                 type: string
 *                 example: Sales Representative
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       409:
 *         description: Email already in use
 */

/**
 * @swagger
 * /auth/users/{userId}/lock:
 *   post:
 *     summary: Lock user account (admin only)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to lock
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lockDuration:
 *                 type: integer
 *                 description: Lock duration in minutes
 *                 example: 30
 *     responses:
 *       200:
 *         description: User account locked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     locked:
 *                       type: boolean
 *                       example: true
 *                     lockUntil:
 *                       type: string
 *                       format: date-time
 *                       example: 2023-06-30T14:30:00Z
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /auth/users/{userId}/unlock:
 *   post:
 *     summary: Unlock user account (admin only)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to unlock
 *     responses:
 *       200:
 *         description: User account unlocked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     locked:
 *                       type: boolean
 *                       example: false
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /auth/users/{userId}/reset-password:
 *   post:
 *     summary: Reset user password (admin only)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to reset password
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify email with token
 *     tags: [User Management]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Invalid or expired token
 */

/**
 * @swagger
 * /auth/send-verification:
 *   post:
 *     summary: Send email verification link
 *     tags: [User Management]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Verification email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: Email verification link sent successfully
 */

/**
 * @swagger
 * /auth/request-password-reset:
 *   post:
 *     summary: Request password reset link
 *     tags: [User Management]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 */

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [User Management]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: NewPassword123
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Invalid or expired token
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 60d21b4667d0d8992e610c85
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         firstName:
 *           type: string
 *           example: John
 *         lastName:
 *           type: string
 *           example: Doe
 *         role:
 *           type: string
 *           enum: [admin, manager, employee]
 *           example: manager
 *         department:
 *           type: string
 *           example: 60d21b4667d0d8992e610c85
 *         position:
 *           type: string
 *           example: Team Lead
 *         isEmailVerified:
 *           type: boolean
 *           example: true
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           example: 2023-06-29T14:30:00Z
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2023-06-01T10:00:00Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2023-06-29T14:30:00Z
 * 
 *   responses:
 *     UnauthorizedError:
 *       description: Access token is missing or invalid
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               error:
 *                 type: object
 *                 properties:
 *                   code:
 *                     type: string
 *                     example: AUTH_TOKEN_INVALID
 *                   message:
 *                     type: string
 *                     example: Invalid or malformed token
 *                   status:
 *                     type: integer
 *                     example: 401
 * 
 *     ForbiddenError:
 *       description: User does not have required permissions
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               error:
 *                 type: object
 *                 properties:
 *                   code:
 *                     type: string
 *                     example: FORBIDDEN
 *                   message:
 *                     type: string
 *                     example: You do not have permission to access this resource
 *                   status:
 *                     type: integer
 *                     example: 403
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

