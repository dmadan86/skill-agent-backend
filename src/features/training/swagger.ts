// src/features/training/swagger.ts
/**
 * @swagger
 * components:
 *   schemas:
 *     TrainingSession:
 *       type: object
 *       required:
 *         - title
 *         - agentId
 *         - createdBy
 *         - trainees
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the training session
 *         title:
 *           type: string
 *           description: The title of the training session
 *         description:
 *           type: string
 *           description: Optional description of the training session
 *         agentId:
 *           type: string
 *           description: Reference to the training agent
 *         createdBy:
 *           type: string
 *           description: User who created the session
 *         trainees:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Reference to the trainee user
 *               status:
 *                 type: string
 *                 enum: [Not Started, In Progress, Completed]
 *                 description: Trainee's status in this session
 *               progress:
 *                 type: number
 *                 description: Percentage progress (0-100)
 *               lastAccessDate:
 *                 type: string
 *                 format: date-time
 *                 description: When the trainee last accessed this session
 *               timeSpent:
 *                 type: number
 *                 description: Total time spent in minutes
 *               assignedDate:
 *                 type: string
 *                 format: date-time
 *                 description: When the trainee was assigned to this session
 *               completedDate:
 *                 type: string
 *                 format: date-time
 *                 description: When the trainee completed the session
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the session was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the session was last updated
 *          
 *     TrainingProgress:
 *       type: object
 *       required:
 *         - sessionId
 *         - userId
 *         - status
 *         - progress
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the progress record
 *         sessionId:
 *           type: string
 *           description: Reference to the training session
 *         userId:
 *           type: string
 *           description: User who is taking the training
 *         summaries:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Summary content
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: When the summary was created
 *               callId:
 *                 type: string
 *                 description: Retell call ID
 *         progress:
 *           type: number
 *           description: Percentage progress (0-100)
 *         status:
 *           type: string
 *           enum: [Not Started, In Progress, Completed]
 *           description: Current status of the progress
 *         timeSpent:
 *           type: number
 *           description: Total time spent in minutes
 *         lastAccessDate:
 *           type: string
 *           format: date-time
 *           description: When the user last accessed the training
 *         evaluations:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               score:
 *                 type: number
 *                 description: Evaluation score (0-100)
 *               feedback:
 *                 type: string
 *                 description: Feedback message
 *               evaluatedAt:
 *                 type: string
 *                 format: date-time
 *                 description: When the evaluation was submitted
 *         topicsCovered:
 *           type: array
 *           items:
 *             type: string
 *           description: Topics covered in the training
 *         conceptsUnderstood:
 *           type: array
 *           items:
 *             type: string
 *           description: Concepts the user has understood
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the progress record was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the progress record was last updated
 *
 *
 * @swagger
 * tags:
 *   name: Training
 *   description: Training session management
 * 
 * @swagger
 * tags:
 *   name: Progress
 *   description: Training progress tracking
 * 
 */

/**
 * @swagger
 * /training:
 *   post:
 *     summary: Create a new training session
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - agentId
 *               - startDate
 *             properties:
 *               title:
 *                 type: string
 *                 description: The title of the training session
 *               agentId:
 *                 type: string
 *                 description: ID of the training agent
 *               description:
 *                 type: string
 *                 description: Optional description
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs of users to assign
 *               departmentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs of departments to assign
 *     responses:
 *       201:
 *         description: Training session created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *
 *   get:
 *     summary: List training sessions
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Not Started, In Progress, Completed]
 *         description: Filter by status
 *       - in: query
 *         name: agentId
 *         schema:
 *           type: string
 *         description: Filter by agent ID
 *     responses:
 *       200:
 *         description: List of training sessions
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /training/{id}:
 *   get:
 *     summary: Get a training session by ID
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Training session ID
 *     responses:
 *       200:
 *         description: Training session details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Training session not found
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update a training session
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Training session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The title of the training session
 *               description:
 *                 type: string
 *                 description: Optional description
 *     responses:
 *       200:
 *         description: Training session updated
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Training session not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete a training session
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Training session ID
 *     responses:
 *       200:
 *         description: Training session deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Training session not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /training/{id}/trainees:
 *   post:
 *     summary: Assign trainees to a training session
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Training session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs of users to assign
 *               departmentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs of departments to assign
 *     responses:
 *       200:
 *         description: Trainees assigned successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Training session not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /training/{sessionId}/trainees/{userId}:
 *   delete:
 *     summary: Remove a trainee from a training session
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Training session ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to remove
 *     responses:
 *       200:
 *         description: Trainee removed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Training session or user not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /training/progress/{sessionId}:
 *   put:
 *     summary: Update training progress after a session
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Training session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - callId
 *             properties:
 *               callId:
 *                 type: string
 *                 description: The Retell call ID
 *     responses:
 *       200:
 *         description: Progress updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Training session not found
 *       500:
 *         description: Server error
 *
 *   get:
 *     summary: Get training progress for a session
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Training session ID
 *     responses:
 *       200:
 *         description: Training progress details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Training progress not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /training/progress/{sessionId}/evaluations:
 *   post:
 *     summary: Submit an evaluation for a training session
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Training session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - score
 *               - feedback
 *             properties:
 *               score:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Evaluation score (0-100)
 *               feedback:
 *                 type: string
 *                 description: Feedback message
 *     responses:
 *       200:
 *         description: Evaluation submitted successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Training session not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /training/progress:
 *   get:
 *     summary: List all training progress for the current user
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of training progress
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /training/employee/progress/{progressId}:
 *   get:
 *     summary: Get training progress for a specific progressId
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: progressId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: Progress ID (24-character hex string)
 *     responses:
 *       200:
 *         description: Training progress details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/TrainingProgress'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /training/overview/{sessionId}:
 *   get:
 *     summary: Get training session overview with progress details
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Training session ID
 *     responses:
 *       200:
 *         description: Training session overview
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Training session not found
 *       500:
 *         description: Server error
 */