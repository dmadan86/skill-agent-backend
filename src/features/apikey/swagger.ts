// src/features/apiKey/routes.ts
/**
 * @swagger
 * components:
 *   schemas:
 *     ApiKey:
 *       type: object
 *       required:
 *         - name
 *         - userId
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the API key
 *         name:
 *           type: string
 *           description: The name of the API key
 *         key:
 *           type: string
 *           description: The generated API key (starts with "sk_")
 *         userId:
 *           type: string
 *           description: The ID of the user who created the API key
 *         isActive:
 *           type: boolean
 *           description: Whether the API key is active
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: The expiration date of the API key
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the API key was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the API key was last updated
 *     ApiKeyInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the API key
 *     ApiKeyResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "API key created successfully"
 *         data:
 *           $ref: '#/components/schemas/ApiKey'
 * 
 * @swagger
 * tags:
 *   name: API Keys
 *   description: API Key management
 */

/**
 * @swagger
 * /api-key:
 *   get:
 *     summary: Get active API keys
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active API keys
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
 *                     $ref: '#/components/schemas/ApiKey'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api-key/generate:
 *   post:
 *     summary: Generate a new API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiKeyInput'
 *     responses:
 *       201:
 *         description: API key generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiKeyResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api-key/{id}:
 *   delete:
 *     summary: Revoke an API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The API key ID
 *     responses:
 *       200:
 *         description: API key revoked successfully
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
 *                   example: "API key revoked successfully"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: API key not found
 *       500:
 *         description: Server error
 */