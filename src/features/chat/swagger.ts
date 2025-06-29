/**
 * @swagger
 * components:
 *   schemas:
 *     ChatSession:
 *       type: object
 *       required:
 *         - userId
 *         - agentId
 *         - sessionType
 *         - status
 *         - startTime
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the chat session
 *         userId:
 *           type: string
 *           description: User ID who owns the session
 *         agentId:
 *           type: string
 *           description: Agent ID associated with the session
 *         sessionType:
 *           type: string
 *           enum: [TRAINING, EVALUATION, QUICK_PREP]
 *           description: Type of the chat session
 *         status:
 *           type: string
 *           enum: [active, completed]
 *           description: Current status of the session
 *         startTime:
 *           type: string
 *           format: date-time
 *           description: When the session started
 *         endTime:
 *           type: string
 *           format: date-time
 *           description: When the session ended (if completed)
 *         summary:
 *           type: string
 *           description: Summary of the chat session (generated when session ends)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the session was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the session was last updated
 *
 *     CreateChatSessionRequest:
 *       type: object
 *       required:
 *         - agentId
 *         - sessionType
 *       properties:
 *         agentId:
 *           type: string
 *           description: ID of the agent to chat with
 *         sessionType:
 *           type: string
 *           enum: [TRAINING, EVALUATION, QUICK_PREP]
 *           description: Type of chat session
 *
 *     ChatSessionResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Response message
 *         data:
 *           type: object
 *           properties:
 *             sessionId:
 *               type: string
 *               description: ID of the created session
 *             agentId:
 *               type: string
 *               description: ID of the agent in the session
 *             sessionType:
 *               type: string
 *               description: Type of the session
 *             status:
 *               type: string
 *               description: Status of the session
 *
 *     ChatSessionSummaryResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Response message
 *         data:
 *           type: object
 *           properties:
 *             summary:
 *               type: string
 *               description: Summary of the chat session
 *
 * tags:
 *   name: Chat
 *   description: API for chat sessions and real-time communication
 *
 * /api/chat:
 *   post:
 *     summary: Create a new chat session
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateChatSessionRequest'
 *     responses:
 *       201:
 *         description: Chat session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatSessionResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *
 *   get:
 *     summary: List user's chat sessions
 *     tags: [Chat]
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
 *     responses:
 *       200:
 *         description: List of chat sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ChatSession'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *
 * /api/chat/{id}:
 *   get:
 *     summary: Get a specific chat session
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Chat session ID
 *     responses:
 *       200:
 *         description: Chat session details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ChatSession'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Chat session not found
 *       500:
 *         description: Server error
 *
 * /api/chat/{id}/end:
 *   post:
 *     summary: End a chat session
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Chat session ID
 *     responses:
 *       200:
 *         description: Chat session ended successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatSessionSummaryResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chat session not found
 *       500:
 *         description: Server error
 *
 * @swagger
 * components:
 *   schemas:
 *     WebSocketEvents:
 *       type: object
 *       description: WebSocket events for real-time chat
 *       properties:
 *         connectionEvents:
 *           type: object
 *           properties:
 *             connect:
 *               type: object
 *               description: Connect to the WebSocket server
 *               properties:
 *                 auth:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: Authentication token
 *             clientEvents:
 *               type: object
 *               properties:
 *                 'join-session':
 *                   type: object
 *                   description: Join a chat session
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                       description: ID of the session to join
 *                     userName:
 *                       type: string
 *                       description: User's name
 *                     userPosition:
 *                       type: string
 *                       description: User's position
 *                     userDepartment:
 *                       type: string
 *                       description: User's department
 *                     previousSessionSummary:
 *                       type: string
 *                       description: Summary of previous session (if any)
 *                 'send-message':
 *                   type: object
 *                   description: Send a message to the chat
 *                   properties:
 *                     content:
 *                       type: string
 *                       description: Message content
 *                     sessionId:
 *                       type: string
 *                       description: ID of the session
 *                 'end-session':
 *                   type: object
 *                   description: End a chat session
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                       description: ID of the session to end
 *             serverEvents:
 *               type: object
 *               properties:
 *                 'session-joined':
 *                   type: object
 *                   description: User has joined the session
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                       description: ID of the joined session
 *                 'greeting':
 *                   type: object
 *                   description: Initial greeting message (non-streaming)
 *                   properties:
 *                     messageId:
 *                       type: string
 *                       description: ID of the greeting message
 *                     content:
 *                       type: string
 *                       description: Content of the greeting message
 *                 'greeting-stream-start':
 *                   type: object
 *                   description: Start of streaming greeting
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                       description: Session ID
 *                     messageId:
 *                       type: string
 *                       description: Message ID
 *                 'greeting-token':
 *                   type: object
 *                   description: Token from streaming greeting
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                       description: Session ID
 *                     messageId:
 *                       type: string
 *                       description: Message ID
 *                     token:
 *                       type: string
 *                       description: Single token of content
 *                 'greeting-stream-complete':
 *                   type: object
 *                   description: End of streaming greeting
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                       description: Session ID
 *                     messageId:
 *                       type: string
 *                       description: Message ID
 *                     fullMessage:
 *                       type: string
 *                       description: Complete message content
 *                 'message-received':
 *                   type: object
 *                   description: Message has been received and processed
 */
