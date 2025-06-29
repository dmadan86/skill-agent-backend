// src/features/evaluation/swagger.ts
/**
 * @swagger
 * components:
 *   responses:
 *     ValidationError:
 *       description: Invalid input parameters
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: VALIDATION_ERROR
 *               message:
 *                 type: string
 *                 example: Validation failed
 *               status:
 *                 type: integer
 *                 example: 400
 *               details:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     path:
 *                       type: array
 *                       items:
 *                         type: string
 *                     message:
 *                       type: string
 *                     code:
 *                       type: string
 *
 *     UnauthorizedError:
 *       description: Authentication information is missing or invalid
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: AUTH_REQUIRED
 *               message:
 *                 type: string
 *                 example: Authentication required
 *               status:
 *                 type: integer
 *                 example: 401
 *
 *     ForbiddenError:
 *       description: User does not have permission to access this resource
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: FORBIDDEN
 *               message:
 *                 type: string
 *                 example: You don't have permission to access this resource
 *               status:
 *                 type: integer
 *                 example: 403
 *
 *     NotFoundError:
 *       description: The requested resource was not found
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: NOT_FOUND
 *               message:
 *                 type: string
 *                 example: Resource not found
 *               status:
 *                 type: integer
 *                 example: 404
 *
 *     InternalServerError:
 *       description: An unexpected error occurred on the server
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: INTERNAL_SERVER_ERROR
 *               message:
 *                 type: string
 *                 example: An unexpected error occurred
 *               status:
 *                 type: integer
 *                 example: 500
 *
 *   schemas:
 *     SkillAssessment:
 *       type: object
 *       required:
 *         - skillName
 *         - score
 *       properties:
 *         skillName:
 *           type: string
 *           description: Name of the assessed skill
 *         score:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Score for the skill (0-100)
 *         weight:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Weight of this skill in the overall assessment
 *
 *     EvaluationTranscript:
 *       type: object
 *       required:
 *         - content
 *         - callId
 *       properties:
 *         content:
 *           type: string
 *           description: Transcript content
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When the transcript was created
 *         callId:
 *           type: string
 *           description: Retell call ID
 *
 *     NextStep:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - type
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the next step
 *         description:
 *           type: string
 *           description: Detailed description of the action
 *         type:
 *           type: string
 *           enum: [Training, Practice, Follow-up]
 *           description: Type of next step
 *
 *     EvaluationAssignee:
 *       type: object
 *       required:
 *         - userId
 *         - status
 *         - progress
 *       properties:
 *         userId:
 *           type: string
 *           description: ID of the assigned user
 *         status:
 *           type: string
 *           enum: [Pending, In Progress, Completed]
 *           description: Current status of this assignee
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: When the evaluation was started
 *         completedDate:
 *           type: string
 *           format: date-time
 *           description: When the evaluation was completed
 *         progress:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Percentage progress through the evaluation
 *         overallScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Overall evaluation score
 *         skillAssessments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SkillAssessment'
 *         strengths:
 *           type: array
 *           items:
 *             type: string
 *           description: Identified strengths
 *         improvementAreas:
 *           type: array
 *           items:
 *             type: string
 *           description: Areas for improvement
 *         transcripts:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EvaluationTranscript'
 *         timeSpent:
 *           type: number
 *           description: Total time spent in minutes
 *
 *     Evaluation:
 *       type: object
 *       required:
 *         - title
 *         - agentId
 *         - createdBy
 *         - scheduledDate
 *         - status
 *         - assignees
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the evaluation
 *         title:
 *           type: string
 *           description: Title of the evaluation
 *         agentId:
 *           type: string
 *           description: ID of the evaluation agent
 *         description:
 *           type: string
 *           description: Optional description
 *         createdBy:
 *           type: string
 *           description: ID of the user who created the evaluation
 *         assignees:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EvaluationAssignee'
 *         status:
 *           type: string
 *           enum: [Pending, In Progress, Completed]
 *           description: Current status of the evaluation
 *         scheduledDate:
 *           type: string
 *           format: date-time
 *           description: When the evaluation is scheduled
 *         recommendation:
 *           type: string
 *           description: Overall recommendation
 *         nextSteps:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/NextStep'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the evaluation was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the evaluation was last updated
 *
 *     UserBasicInfo:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: User ID
 *         firstName:
 *           type: string
 *           description: User's first name
 *         lastName:
 *           type: string
 *           description: User's last name
 *         email:
 *           type: string
 *           description: User's email
 *         position:
 *           type: string
 *           description: User's position
 *
 *     AgentBasicInfo:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Agent ID
 *         name:
 *           type: string
 *           description: Agent name
 *         description:
 *           type: string
 *           description: Agent description
 *
 * @swagger
 * tags:
 *   name: Evaluations
 *   description: Evaluation management
 */

/**
 * @swagger
 * /evaluation:
 *   post:
 *     summary: Create a new evaluation
 *     tags: [Evaluations]
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
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: Evaluation title
 *               agentId:
 *                 type: string
 *                 pattern: ^[0-9a-fA-F]{24}$
 *                 description: ID of the evaluation agent (24-character hex string)
 *               description:
 *                 type: string
 *                 description: Optional description of the evaluation
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   pattern: ^[0-9a-fA-F]{24}$
 *                 description: IDs of users to initially assign to this evaluation
 *               departmentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   pattern: ^[0-9a-fA-F]{24}$
 *                 description: IDs of departments to initially assign to this evaluation
 *     responses:
 *       201:
 *         description: Evaluation created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Evaluation created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Evaluation'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   get:
 *     summary: List evaluations created by the current user
 *     tags: [Evaluations]
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
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, In Progress, Completed]
 *         description: Filter by status
 *       - in: query
 *         name: agentId
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: Filter by agent ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: Filter by assigned user ID
 *     responses:
 *       200:
 *         description: List of evaluations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Evaluation'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /evaluation/{id}:
 *   get:
 *     summary: Get an evaluation by ID
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: Evaluation ID (24-character hex string)
 *     responses:
 *       200:
 *         description: Evaluation details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Evaluation'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   put:
 *     summary: Update an evaluation
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: Evaluation ID (24-character hex string)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: Evaluation title
 *               description:
 *                 type: string
 *                 description: Optional description of the evaluation
 *     responses:
 *       200:
 *         description: Evaluation updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Evaluation updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Evaluation'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   delete:
 *     summary: Delete an evaluation
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: Evaluation ID (24-character hex string)
 *     responses:
 *       200:
 *         description: Evaluation deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Evaluation deleted successfully
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
 * /evaluation/{id}/assign:
 *   post:
 *     summary: Assign users to an evaluation
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: Evaluation ID (24-character hex string)
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
 *                   pattern: ^[0-9a-fA-F]{24}$
 *                 description: IDs of users to assign
 *               departmentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   pattern: ^[0-9a-fA-F]{24}$
 *                 description: IDs of departments to assign
 *     responses:
 *       200:
 *         description: Users assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Users assigned successfully
 *                 data:
 *                   $ref: '#/components/schemas/Evaluation'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
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
 * /evaluation/{evaluationId}/assignees/{userId}:
 *   delete:
 *     summary: Remove an assignee from an evaluation
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: evaluationId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: Evaluation ID (24-character hex string)
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: User ID to remove (24-character hex string)
 *     responses:
 *       200:
 *         description: Assignee removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Assignee removed successfully
 *                 data:
 *                   $ref: '#/components/schemas/Evaluation'
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
 * /evaluation/progress/{evaluationId}:
 *   put:
 *     summary: Update evaluation progress after completing a session
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: evaluationId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: Evaluation ID (24-character hex string)
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
 *                 description: Retell call ID for tracking the evaluation session
 *     responses:
 *       200:
 *         description: Progress updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Evaluation progress updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/EvaluationAssignee'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   get:
 *     summary: Get evaluation progress for the current user
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: evaluationId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: Evaluation ID (24-character hex string)
 *     responses:
 *       200:
 *         description: Evaluation progress details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/EvaluationAssignee'
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
 * /evaluation/progress:
 *   get:
 *     summary: List all evaluation progress for the current user
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of evaluation progress for the current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       evaluationId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           scheduledDate:
 *                             type: string
 *                             format: date-time
 *                           agentId:
 *                             $ref: '#/components/schemas/AgentBasicInfo'
 *                       userId:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [Pending, In Progress, Completed]
 *                       progress:
 *                         type: number
 *                       startDate:
 *                         type: string
 *                         format: date-time
 *                       completedDate:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /evaluation/employee/progress/{progressId}:
 *   get:
 *     summary: Get evaluation progress for a specific progressId
 *     tags: [Evaluations]
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
 *         description: Evaluation progress details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/EvaluationAssignee'
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
 * /evaluation/{evaluationId}/report/{userId}:
 *   get:
 *     summary: Download evaluation report as PDF
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: evaluationId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: Evaluation ID (24-character hex string)
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: User ID (24-character hex string)
 *     responses:
 *       200:
 *         description: PDF file containing the evaluation report
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
