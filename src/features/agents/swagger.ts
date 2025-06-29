// src/features/agents/swagger.ts
/**
 * @swagger
 * components:
 *   schemas:
 *     Agent:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - description
 *         - industry
 *         - content
 *         - owner
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the agent
 *         name:
 *           type: string
 *           description: The name of the agent
 *         type:
 *           type: string
 *           enum: [Training, Evaluation,  Simulation, Onboarding]
 *           description: The type of the agent
 *         agentType:
 *           type: string
 *           enum: [TRAINING, EVALUATION, QUICK_PREP]
 *           description: The specific function of the agent
 *         description:
 *           type: string
 *           description: A brief description of the agent
 *         industry:
 *           type: string
 *           description: The industry the agent is designed for
 *         content:
 *           type: string
 *           description: The main content/configuration of the agent
 *         instructions:
 *           type: string
 *           description: Optional instructions for the agent
 *         owner:
 *           type: string
 *           description: Reference to the user who created the agent
 *         retellAgentId:
 *           type: string
 *           description: The ID of the agent in Retell AI
 *         retellLlmId:
 *           type: string
 *           description: The ID of the LLM in Retell AI
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the agent was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the agent was last updated
 *     AgentInput:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - description
 *         - industry
 *         - content
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the agent
 *         type:
 *           type: string
 *           enum: [Training, Evaluation,  Simulation, Onboarding]
 *           description: The type of the agent
 *         description:
 *           type: string
 *           description: A brief description of the agent
 *         industry:
 *           type: string
 *           description: The industry the agent is designed for
 *         content:
 *           type: string
 *           description: The main content/configuration of the agent
 *         instructions:
 *           type: string
 *           description: Optional instructions for the agent
 *     AgentUpdateInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the agent
 *         type:
 *           type: string
 *           enum: [Training, Evaluation,  Simulation, Onboarding]
 *           description: The type of the agent
 *         description:
 *           type: string
 *           description: A brief description of the agent
 *         industry:
 *           type: string
 *           description: The industry the agent is designed for
 *         content:
 *           type: string
 *           description: The main content/configuration of the agent
 *         instructions:
 *           type: string
 *           description: Optional instructions for the agent
 *     StartWebCallInput:
 *       type: object
 *       required:
 *         - agentId
 *         - userName
 *         - userPosition
 *         - userDepartment
 *       properties:
 *         agentId:
 *           type: string
 *           description: The ID of the agent to start a call with
 *         userName:
 *           type: string
 *           description: The name of the user
 *         userPosition:
 *           type: string
 *           description: The position of the user
 *         userDepartment:
 *           type: string
 *           description: The department of the user
 *         previousSessionSummary:
 *           type: string
 *           description: Optional summary of previous session
 *
 * @swagger
 * tags:
 *   name: Agents
 *   description: Agent management APIs
 */

/**
 * @swagger
 * /agents:
 *   post:
 *     summary: Create a new agent
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AgentInput'
 *     responses:
 *       201:
 *         description: Agents created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Agents created successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Agent'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *
 *   get:
 *     summary: Get all agents (paginated and filtered)
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [Training, Evaluation,  Simulation, Onboarding]
 *         description: Filter by agent type
 *       - in: query
 *         name: industry
 *         schema:
 *           type: string
 *         description: Filter by industry
 *     responses:
 *       200:
 *         description: A list of agents
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
 *                     $ref: '#/components/schemas/Agent'
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
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /agents/{id}:
 *   get:
 *     summary: Get an agent by ID
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The agent ID
 *     responses:
 *       200:
 *         description: Agent found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Agent'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Agent not found
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update an agent
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The agent ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AgentUpdateInput'
 *     responses:
 *       200:
 *         description: Agent updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Agent updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Agent'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Agent not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete an agent
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The agent ID
 *     responses:
 *       200:
 *         description: Agent deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Agent deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Agent not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /agents/start-web-call:
 *   post:
 *     summary: Start a web call with an agent
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StartWebCallInput'
 *     responses:
 *       200:
 *         description: Web call started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Web call started successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     call_id:
 *                       type: string
 *                     access_token:
 *                       type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
