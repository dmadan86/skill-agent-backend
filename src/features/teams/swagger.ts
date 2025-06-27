// src/features/teams/documentation/teamSwagger.ts

/**
 * @swagger
 * components:
 *   schemas:
 *     Team:
 *       type: object
 *       required:
 *         - name
 *         - owner
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the team
 *         name:
 *           type: string
 *           description: The team name
 *         description:
 *           type: string
 *           description: Optional team description
 *         members:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs who are members of the team
 *         owner:
 *           type: string
 *           description: User ID of the team owner
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the team was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the team was last updated
 *       example:
 *         _id: 60d21b4667d0d8992e610c85
 *         name: Product Development
 *         description: Team responsible for core product features
 *         members: [60d21b4667d0d8992e610c80, 60d21b4667d0d8992e610c81]
 *         owner: 60d21b4667d0d8992e610c80
 *         createdAt: 2023-01-01T00:00:00.000Z
 *         updatedAt: 2023-01-01T00:00:00.000Z
 *     
 *     TeamInvite:
 *       type: object
 *       required:
 *         - email
 *         - team
 *         - invitedBy
 *         - token
 *         - status
 *         - expiresAt
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the invitation
 *         email:
 *           type: string
 *           description: Email address of the invitee
 *         team:
 *           type: string
 *           description: Team ID the invitation is for
 *         invitedBy:
 *           type: string
 *           description: User ID of the person who sent the invitation
 *         token:
 *           type: string
 *           description: Unique token for accepting the invitation
 *         status:
 *           type: string
 *           enum: [pending, accepted, rejected, expired]
 *           description: Current status of the invitation
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Expiration date of the invitation
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the invitation was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the invitation was last updated
 *       example:
 *         _id: 60d21b4667d0d8992e610c86
 *         email: user@example.com
 *         team: 60d21b4667d0d8992e610c85
 *         invitedBy: 60d21b4667d0d8992e610c80
 *         token: a1b2c3d4e5f6
 *         status: pending
 *         expiresAt: 2023-01-08T00:00:00.000Z
 *         createdAt: 2023-01-01T00:00:00.000Z
 *         updatedAt: 2023-01-01T00:00:00.000Z
 *     
 *     CreateTeamRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: The team name
 *         description:
 *           type: string
 *           description: Optional team description
 *       example:
 *         name: Product Development
 *         description: Team responsible for core product features
 *     
 *     UpdateTeamRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: The team name
 *         description:
 *           type: string
 *           description: Optional team description
 *       example:
 *         name: Product Development Team
 *         description: Team responsible for core product features and innovation
 *     
 *     AddTeamMembersRequest:
 *       type: object
 *       required:
 *         - userIds
 *       properties:
 *         userIds:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs to add to the team
 *       example:
 *         userIds: [60d21b4667d0d8992e610c81, 60d21b4667d0d8992e610c82]
 *     
 *     RemoveTeamMembersRequest:
 *       type: object
 *       required:
 *         - userIds
 *       properties:
 *         userIds:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs to remove from the team
 *       example:
 *         userIds: [60d21b4667d0d8992e610c81, 60d21b4667d0d8992e610c82]
 *     
 *     InviteToTeamRequest:
 *       type: object
 *       required:
 *         - emails
 *       properties:
 *         emails:
 *           type: array
 *           items:
 *             type: string
 *             format: email
 *           description: Array of email addresses to invite
 *       example:
 *         emails: [user1@example.com, user2@example.com]
 *     
 *     AcceptInviteRequest:
 *       type: object
 *       required:
 *         - token
 *       properties:
 *         token:
 *           type: string
 *           description: The invitation token
 *       example:
 *         token: a1b2c3d4e5f6
 *     
 *     SuccessItem:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: User ID for the success item
 *         email:
 *           type: string
 *           description: Email address for the success item
 *         message:
 *           type: string
 *           description: Success message
 *       example:
 *         userId: 60d21b4667d0d8992e610c81
 *         message: User added successfully
 *
 *     FailureItem:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: User ID for the failure item
 *         email:
 *           type: string
 *           description: Email address for the failure item
 *         error:
 *           type: string
 *           description: Error message
 *       example:
 *         userId: 60d21b4667d0d8992e610c82
 *         error: User is already a team member
 *
 *     PartialSuccessResponse:
 *       type: object
 *       properties:
 *         team:
 *           $ref: '#/components/schemas/Team'
 *         results:
 *           type: object
 *           properties:
 *             success:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SuccessItem'
 *             failure:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FailureItem'
 *       example:
 *         team:
 *           _id: 60d21b4667d0d8992e610c85
 *           name: Product Development
 *           description: Team responsible for core product features
 *           members: [60d21b4667d0d8992e610c80, 60d21b4667d0d8992e610c81]
 *           owner: 60d21b4667d0d8992e610c80
 *         results:
 *           success:
 *             - userId: 60d21b4667d0d8992e610c81
 *               message: User added successfully
 *           failure:
 *             - userId: 60d21b4667d0d8992e610c82
 *               error: User is already a team member
 *
 *     InvitationResponse:
 *       type: object
 *       properties:
 *         invitations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TeamInvite'
 *         results:
 *           type: object
 *           properties:
 *             success:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                   message:
 *                     type: string
 *             failure:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                   error:
 *                     type: string
 *       example:
 *         invitations: [
 *           {
 *             _id: 60d21b4667d0d8992e610c86,
 *             email: user1@example.com,
 *             team: 60d21b4667d0d8992e610c85,
 *             invitedBy: 60d21b4667d0d8992e610c80,
 *             token: a1b2c3d4e5f6,
 *             status: pending,
 *             expiresAt: 2023-01-08T00:00:00.000Z
 *           }
 *         ]
 *         results:
 *           success:
 *             - email: user1@example.com
 *               message: Invitation sent successfully
 *           failure:
 *             - email: user2@example.com
 *               error: An invitation has already been sent to this email
 *     
 *     BulkImportResult:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Total number of records processed
 *         successful:
 *           type: integer
 *           description: Number of records successfully processed
 *         failed:
 *           type: integer
 *           description: Number of records that failed processing
 *         results:
 *           type: object
 *           properties:
 *             success:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                   message:
 *                     type: string
 *             failure:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                   error:
 *                     type: string
 *       example:
 *         total: 3
 *         successful: 2
 *         failed: 1
 *         results: {
 *           success: [
 *             {
 *               email: "user1@example.com",
 *               message: "User added to team successfully"
 *             },
 *             {
 *               email: "user2@example.com",
 *               message: "Invitation sent successfully"
 *             }
 *           ],
 *           failure: [
 *             {
 *               email: "user3@example.com",
 *               error: "User is already a team member"
 *             }
 *           ]
 *         }
 *     
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *               description: Error code
 *             message:
 *               type: string
 *               description: Error message
 *       example:
 *         success: false
 *         error:
 *           code: UNAUTHORIZED
 *           message: Only the team owner can update the team
 */

/**
 * @swagger
 * tags:
 *   name: Teams
 *   description: Team management endpoints
 */

/**
 * @swagger
 * /teams:
 *   post:
 *     summary: Create a new team
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTeamRequest'
 *     responses:
 *       201:
 *         description: Team created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Team'
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   get:
 *     summary: Get all teams for the current user
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of teams
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
 *                     $ref: '#/components/schemas/Team'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /teams/{teamId}:
 *   get:
 *     summary: Get team details
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         schema:
 *           type: string
 *         required: true
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Team'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - user is not a team member
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Team not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   put:
 *     summary: Update team details
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         schema:
 *           type: string
 *         required: true
 *         description: Team ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTeamRequest'
 *     responses:
 *       200:
 *         description: Team updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Team'
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - user is not the team owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Team not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Delete a team
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         schema:
 *           type: string
 *         required: true
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team deleted successfully
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
 *                     message:
 *                       type: string
 *                       example: Team deleted successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - user is not the team owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Team not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /teams/{teamId}/members:
 *   post:
 *     summary: Add multiple members to the team
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         schema:
 *           type: string
 *         required: true
 *         description: Team ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddTeamMembersRequest'
 *     responses:
 *       200:
 *         description: Members processed with partial success information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PartialSuccessResponse'
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - user is not the team owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Team not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Remove multiple members from the team
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         schema:
 *           type: string
 *         required: true
 *         description: Team ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RemoveTeamMembersRequest'
 *     responses:
 *       200:
 *         description: Members removed with partial success information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PartialSuccessResponse'
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - user is not the team owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Team not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /teams/{teamId}/invites:
 *   post:
 *     summary: Invite multiple users to the team by email
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         schema:
 *           type: string
 *         required: true
 *         description: Team ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InviteToTeamRequest'
 *     responses:
 *       200:
 *         description: Invitations processed with partial success information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/InvitationResponse'
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - user is not the team owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Team not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   get:
 *     summary: Get all invitations for a team
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         schema:
 *           type: string
 *         required: true
 *         description: Team ID
 *     responses:
 *       200:
 *         description: List of pending invitations
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
 *                     $ref: '#/components/schemas/TeamInvite'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - user is not the team owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Team not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /teams/user/invites:
 *   get:
 *     summary: Get all pending invitations for the current user
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending invitations
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
 *                     $ref: '#/components/schemas/TeamInvite'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /teams/invites/accept:
 *   post:
 *     summary: Accept a team invitation
 *     tags: [Teams]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AcceptInviteRequest'
 *     responses:
 *       200:
 *         description: Invitation accepted successfully
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
 *                     team:
 *                       $ref: '#/components/schemas/Team'
 *                     userId:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c81
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Invitation not found or expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /teams/invites/reject:
 *   post:
 *     summary: Reject a team invitation
 *     tags: [Teams]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AcceptInviteRequest'
 *     responses:
 *       200:
 *         description: Invitation rejected successfully
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
 *                     message:
 *                       type: string
 *                       example: Invitation rejected successfully
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Invitation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /teams/invites/{inviteId}:
 *   delete:
 *     summary: Cancel a team invitation
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inviteId
 *         schema:
 *           type: string
 *         required: true
 *         description: Invitation ID
 *     responses:
 *       200:
 *         description: Invitation cancelled successfully
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
 *                     message:
 *                       type: string
 *                       example: Invitation cancelled successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - user is not the team owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Invitation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /teams/{teamId}/bulk-import:
 *   post:
 *     summary: Import multiple team members from a CSV file
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         schema:
 *           type: string
 *         required: true
 *         description: Team ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file with team member data (Email, FirstName, LastName required columns)
 *     responses:
 *       200:
 *         description: CSV processed successfully with partial success information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/BulkImportResult'
 *       400:
 *         description: Invalid CSV file, missing file, or missing required columns
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - user is not the team owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Team not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /teams/bulk-import/template:
 *   get:
 *     summary: Download CSV template for bulk import
 *     tags: [Teams]
 *     responses:
 *       200:
 *         description: CSV template file
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 */

export default {};