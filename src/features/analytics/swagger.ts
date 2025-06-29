// src/features/analytics/documentation/analyticsSwagger.ts

/**
 * @swagger
 * components:
 *   schemas:
 *     OverviewMetrics:
 *       type: object
 *       properties:
 *         avgTrainingScore:
 *           type: number
 *           description: Average training score across the team
 *           example: 79.5
 *         trainingCompletionRate:
 *           type: number
 *           description: Percentage of completed training assignments
 *           example: 68.3
 *         avgTimeToProficiency:
 *           type: number
 *           description: Average days to reach proficiency threshold
 *           example: 14.3
 *         activeTrainingSessions:
 *           type: number
 *           description: Number of currently active training sessions
 *           example: 12
 *         trends:
 *           type: object
 *           properties:
 *             avgTrainingScore:
 *               type: object
 *               properties:
 *                 value:
 *                   type: number
 *                   example: 79.5
 *                 change:
 *                   type: number
 *                   example: 5.2
 *             trainingCompletionRate:
 *               type: object
 *               properties:
 *                 value:
 *                   type: number
 *                   example: 68.3
 *                 change:
 *                   type: number
 *                   example: 12.1
 *             avgTimeToProficiency:
 *               type: object
 *               properties:
 *                 value:
 *                   type: number
 *                   example: 14.3
 *                 change:
 *                   type: number
 *                   example: -3.5
 *                 unit:
 *                   type: string
 *                   example: days
 *             activeTrainingSessions:
 *               type: object
 *               properties:
 *                 value:
 *                   type: number
 *                   example: 12
 *                 change:
 *                   type: number
 *                   example: -2
 *
 *     PerformanceTimeline:
 *       type: object
 *       properties:
 *         timeline:
 *           type: array
 *           description: Monthly performance data
 *           items:
 *             type: object
 *             properties:
 *               month:
 *                 type: string
 *                 example: Jan 2023
 *               evaluationScores:
 *                 type: number
 *                 example: 65
 *               trainingCompletion:
 *                 type: number
 *                 example: 55
 *               proficiencyLevels:
 *                 type: number
 *                 example: 60
 *
 *     TeamMemberProgress:
 *       type: object
 *       properties:
 *         members:
 *           type: array
 *           description: Progress data for team members
 *           items:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c81
 *               firstName:
 *                 type: string
 *                 example: Sarah
 *               lastName:
 *                 type: string
 *                 example: Johnson
 *               position:
 *                 type: string
 *                 example: Sales Director
 *               department:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c90
 *               trainingScore:
 *                 type: number
 *                 example: 79
 *               trainingProgress:
 *                 type: number
 *                 example: 86
 *
 *     DepartmentPerformance:
 *       type: object
 *       properties:
 *         departments:
 *           type: array
 *           description: Performance data by department
 *           items:
 *             type: object
 *             properties:
 *               departmentId:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c90
 *               name:
 *                 type: string
 *                 example: Sales
 *               avgScore:
 *                 type: number
 *                 example: 86
 *               trainingCompletion:
 *                 type: number
 *                 example: 67
 *
 *     TrainingCategoryMetrics:
 *       type: object
 *       properties:
 *         categories:
 *           type: array
 *           description: Training metrics by category
 *           items:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *                 example: Product Knowledge
 *               completionRate:
 *                 type: number
 *                 example: 75
 *               timeSpent:
 *                 type: number
 *                 description: Hours spent on this category
 *                 example: 27.5
 *
 *     LearningTrends:
 *       type: object
 *       properties:
 *         avgTrainingSessions:
 *           type: number
 *           description: Average training sessions per week
 *           example: 3.2
 *         completionTime:
 *           type: number
 *           description: Average hours to complete a module
 *           example: 4.5
 *         engagementScore:
 *           type: number
 *           description: Engagement score out of 100
 *           example: 83
 *         changeVsPrevious:
 *           type: object
 *           properties:
 *             avgTrainingSessions:
 *               type: number
 *               example: 0.8
 *             completionTime:
 *               type: number
 *               example: -0.7
 *             engagementScore:
 *               type: number
 *               example: 5
 *
 *     ScoreDistribution:
 *       type: object
 *       properties:
 *         excellent:
 *           type: number
 *           description: Percentage of excellent scores (90-100%)
 *           example: 20
 *         good:
 *           type: number
 *           description: Percentage of good scores (75-89%)
 *           example: 40
 *         average:
 *           type: number
 *           description: Percentage of average scores (60-74%)
 *           example: 30
 *         needsImprovement:
 *           type: number
 *           description: Percentage of scores needing improvement (<60%)
 *           example: 10
 *
 *     SkillAssessment:
 *       type: object
 *       properties:
 *         skills:
 *           type: array
 *           description: Assessment data by skill
 *           items:
 *             type: object
 *             properties:
 *               skillName:
 *                 type: string
 *                 example: Product Knowledge
 *               currentScore:
 *                 type: number
 *                 example: 82
 *               previousScore:
 *                 type: number
 *                 example: 75
 *
 *     AssessmentInsight:
 *       type: object
 *       properties:
 *         strengths:
 *           type: array
 *           description: Team strengths identified from evaluations
 *           items:
 *             type: string
 *           example:
 *             - Customer service skills consistently score highest across all teams
 *             - Product knowledge has improved by 15% since last quarter
 *         improvementAreas:
 *           type: array
 *           description: Areas for improvement
 *           items:
 *             type: string
 *           example:
 *             - Technical skills remain the lowest scoring category overall
 *             - Closing ability scores show wide variation across team members
 *         recommendedActions:
 *           type: array
 *           description: Recommended actions based on insights
 *           items:
 *             type: string
 *           example:
 *             - Schedule technical skills workshops for all team members
 *             - Pair lower-performing team members with mentors in closing techniques
 */

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Team analytics and performance metrics endpoints
 */

/**
 * @swagger
 * /analytics/teams/{teamId}/overview:
 *   get:
 *     summary: Get team overview metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         schema:
 *           type: string
 *         required: true
 *         description: Team ID
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [last7days, last30days, last90days, ytd]
 *         description: Time range for analytics (default last30days)
 *     responses:
 *       200:
 *         description: Overview metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/OverviewMetrics'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - user does not have access to team analytics
 *       404:
 *         description: Team not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /analytics/teams/{teamId}/performance-timeline:
 *   get:
 *     summary: Get performance timeline data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         schema:
 *           type: string
 *         required: true
 *         description: Team ID
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [last7days, last30days, last90days, ytd]
 *         description: Time range for analytics (default last30days)
 *     responses:
 *       200:
 *         description: Performance timeline retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PerformanceTimeline'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - user does not have access to team analytics
 *       404:
 *         description: Team not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /analytics/teams/{teamId}/member-progress:
 *   get:
 *     summary: Get team member progress data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         schema:
 *           type: string
 *         required: true
 *         description: Team ID
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [last7days, last30days, last90days, ytd]
 *         description: Time range for analytics (default last30days)
 *     responses:
 *       200:
 *         description: Team member progress retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TeamMemberProgress'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - user does not have access to team analytics
 *       404:
 *         description: Team not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /analytics/teams/{teamId}/department-performance:
 *   get:
 *     summary: Get department performance data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         schema:
 *           type: string
 *         required: true
 *         description: Team ID
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [last7days, last30days, last90days, ytd]
 *         description: Time range for analytics (default last30days)
 *     responses:
 *       200:
 *         description: Department performance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DepartmentPerformance'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - user does not have access to team analytics
 *       404:
 *         description: Team not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /analytics/teams/{teamId}/training-categories:
 *   get:
 *     summary: Get training analytics by category
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         schema:
 *           type: string
 *         required: true
 *         description: Team ID
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [last7days, last30days, last90days, ytd]
 *         description: Time range for analytics (default last30days)
 *     responses:
 *       200:
 *         description: Training category metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TrainingCategoryMetrics'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - user does not have access to team analytics
 *       404:
 *         description: Team not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /analytics/teams/{teamId}/learning-trends:
 *   get:
 *     summary: Get learning trends data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         schema:
 *           type: string
 *         required: true
 *         description: Team ID
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [last7days, last30days, last90days, ytd]
 *         description: Time range for analytics (default last30days)
 *     responses:
 *       200:
 *         description: Learning trends retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/LearningTrends'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - user does not have access to team analytics
 *       404:
 *         description: Team not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /analytics/teams/{teamId}/score-distribution:
 *   get:
 *     summary: Get evaluation score distribution
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         schema:
 *           type: string
 *         required: true
 *         description: Team ID
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [last7days, last30days, last90days, ytd]
 *         description: Time range for analytics (default last30days)
 *     responses:
 *       200:
 *         description: Score distribution retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ScoreDistribution'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - user does not have access to team analytics
 *       404:
 *         description: Team not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /analytics/teams/{teamId}/skill-assessment:
 *   get:
 *     summary: Get skill assessment comparison
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         schema:
 *           type: string
 *         required: true
 *         description: Team ID
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [last7days, last30days, last90days, ytd]
 *         description: Time range for analytics (default last30days)
 *     responses:
 *       200:
 *         description: Skill assessment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SkillAssessment'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - user does not have access to team analytics
 *       404:
 *         description: Team not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /analytics/teams/{teamId}/assessment-insights:
 *   get:
 *     summary: Get assessment insights and recommendations
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         schema:
 *           type: string
 *         required: true
 *         description: Team ID
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [last7days, last30days, last90days, ytd]
 *         description: Time range for analytics (default last30days)
 *     responses:
 *       200:
 *         description: Assessment insights retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AssessmentInsight'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - user does not have access to team analytics
 *       404:
 *         description: Team not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /analytics/teams/{teamId}/export:
 *   get:
 *     summary: Export analytics data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         schema:
 *           type: string
 *         required: true
 *         description: Team ID
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [last7days, last30days, last90days, ytd]
 *         description: Time range for analytics (default last30days)
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, json]
 *         description: Export format (default json)
 *     responses:
 *       200:
 *         description: Analytics data exported successfully
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
 *                       example: Analytics data exported successfully
 *                     exportData:
 *                       type: string
 *                       example: Team analytics export data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - user does not have access to team analytics
 *       404:
 *         description: Team not found
 *       500:
 *         description: Server error
 */

export default {};
