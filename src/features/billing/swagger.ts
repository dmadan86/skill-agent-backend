/**
 * @swagger
 * components:
 *   schemas:
 *     BillingPlan:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - monthlyPrice
 *         - yearlyPrice
 *         - currency
 *         - features
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the billing plan.
 *           example: "Freemium"
 *         description:
 *           type: string
 *           description: A brief description of the billing plan.
 *           example: "Perfect for getting started"
 *         monthlyPrice:
 *           type: number
 *           description: The monthly price of the billing plan.
 *           example: 0
 *         yearlyPrice:
 *           type: number
 *           description: The yearly price of the billing plan.
 *           example: 0
 *         currency:
 *           type: string
 *           description: The currency used for the billing plan.
 *           example: "USD"
 *         features:
 *           type: array
 *           description: Array of features in the billing plan.
 *           items:
 *             type: object
 *         isActive:
 *           type: boolean
 *           description: Whether the billing plan is active.
 *           example: false
 *         popular:
 *           type: boolean
 *           description: Whether the billing plan is marked as popular.
 *           example: false
 *         stripe_price_id:
 *           type: string
 *           description: The Stripe price ID associated with the plan.
 *           example: ""
 *         stripe_product_id:
 *           type: string
 *           description: The Stripe product ID associated with the plan.
 *           example: ""
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the plan was created.
 *           example: "2023-10-01T12:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the plan was last updated.
 *           example: "2023-10-01T12:00:00Z"
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   name: Billing
 *   description: Billing plan management
 */

/**
 * @swagger
 * /billing/plans:
 *   get:
 *     summary: List all billing plans
 *     tags: [Billing]
 *     responses:
 *       200:
 *         description: A list of billing plans
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BillingPlan'
 */

/**
 * @swagger
 * /billing/plans/{id}:
 *   get:
 *     summary: Get a billing plan by ID
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the billing plan
 *     responses:
 *       200:
 *         description: The billing plan details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BillingPlan'
 *       404:
 *         description: Billing plan not found
 */

/**
 * @swagger
 * /billing/plans:
 *   post:
 *     summary: Create a new billing plan
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BillingPlan'
 *     responses:
 *       201:
 *         description: The created billing plan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BillingPlan'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /billing/plans/{id}:
 *   put:
 *     summary: Update a billing plan
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the billing plan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BillingPlan'
 *     responses:
 *       200:
 *         description: The updated billing plan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BillingPlan'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Billing plan not found
 */

/**
 * @swagger
 * /billing/plans/{id}:
 *   delete:
 *     summary: Delete a billing plan
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the billing plan
 *     responses:
 *       200:
 *         description: Billing plan deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Billing plan not found
 */