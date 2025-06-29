// src/features/analytics/routes/analyticsRoutes.ts
import { Router } from "express";
import * as analyticsController from "./controllers/analyticsController";
import * as superAdminAnalyticsController from "./controllers/superAdminAnalyticsController";
import {
  authenticate,
  requireRole,
} from "../../shared/middleware/authenticate";
import { validate } from "../../shared/middleware/validate";
import { analyticsSchemas } from "./validation/analyticsSchema";
import { schedulerService } from "../../shared/services/schedulerService";

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

// Route to manually trigger analytics aggregation (admin only)
router.post(
  "/aggregation/run",
  requireRole(["admin"]),
  async (req, res, next) => {
    try {
      await schedulerService.runAnalyticsAggregationNow();
      res.status(200).json({
        success: true,
        message: "Analytics aggregation triggered successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

// Overview metrics
router.get(
  "/teams/:teamId/overview",
  validate(analyticsSchemas.getOverviewSchema),
  analyticsController.getOverviewMetrics,
);

// Performance timeline
router.get(
  "/teams/:teamId/performance-timeline",
  validate(analyticsSchemas.getPerformanceTimelineSchema),
  analyticsController.getPerformanceTimeline,
);

// Team progress
router.get(
  "/teams/:teamId/member-progress",
  validate(analyticsSchemas.getTeamMemberProgressSchema),
  analyticsController.getTeamMemberProgress,
);

// Department performance
router.get(
  "/teams/:teamId/department-performance",
  validate(analyticsSchemas.getDepartmentPerformanceSchema),
  analyticsController.getDepartmentPerformance,
);

// Training analytics
router.get(
  "/teams/:teamId/training-categories",
  validate(analyticsSchemas.getTrainingCategoryMetricsSchema),
  analyticsController.getTrainingCategoryMetrics,
);

// Learning trends
router.get(
  "/teams/:teamId/learning-trends",
  validate(analyticsSchemas.getLearningTrendsSchema),
  analyticsController.getLearningTrends,
);

// Evaluation analytics
router.get(
  "/teams/:teamId/score-distribution",
  validate(analyticsSchemas.getScoreDistributionSchema),
  analyticsController.getScoreDistribution,
);

// Skill assessment
router.get(
  "/teams/:teamId/skill-assessment",
  validate(analyticsSchemas.getSkillAssessmentSchema),
  analyticsController.getSkillAssessment,
);

// Assessment insights
router.get(
  "/teams/:teamId/assessment-insights",
  validate(analyticsSchemas.getAssessmentInsightsSchema),
  analyticsController.getAssessmentInsights,
);

// Export analytics data
router.get(
  "/teams/:teamId/export",
  validate(analyticsSchemas.exportAnalyticsDataSchema),
  analyticsController.exportAnalyticsData,
);

router.get(
  "/super-admin/analytics",
  requireRole(["superadmin"]),
  superAdminAnalyticsController.getAnalytics,
);

router.get(
  "/super-admin/activities",
  requireRole(["superadmin"]),
  superAdminAnalyticsController.getActivities,
);

// Super admin analytics
router.get(
  "/super-admin/analytics",
  requireRole(["superadmin"]),
  superAdminAnalyticsController.getAnalytics,
);

export default router;
