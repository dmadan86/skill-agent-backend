// src/features/analytics/validation/analyticsSchema.ts
import { z } from "zod";

// Team ID parameter
export const teamIdSchema = z.object({
  teamId: z
    .string()
    .min(1, "Team ID is required")
    .refine((id) => /^[0-9a-fA-F]{24}$/.test(id), {
      message: "Invalid team ID format",
    }),
});

// Time range parameter
export const timeRangeSchema = z.union([
  z.enum(["last7days", "last30days", "last90days", "ytd"]),
  z
    .object({
      startDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD"),
      endDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD"),
    })
    .refine(
      (data) => {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        return start <= end;
      },
      {
        message: "Start date must be before or equal to end date",
        path: ["startDate"],
      },
    ),
]);

// Query parameter schemas
export const overviewQuerySchema = z.object({
  timeRange: timeRangeSchema.optional().default("last30days"),
});

export const performanceQuerySchema = z.object({
  timeRange: timeRangeSchema.optional().default("last30days"),
});

export const teamProgressQuerySchema = z.object({
  timeRange: timeRangeSchema.optional().default("last30days"),
});

export const departmentQuerySchema = z.object({
  timeRange: timeRangeSchema.optional().default("last30days"),
});

export const trainingCategoryQuerySchema = z.object({
  timeRange: timeRangeSchema.optional().default("last30days"),
});

export const learningTrendsQuerySchema = z.object({
  timeRange: timeRangeSchema.optional().default("last30days"),
});

export const scoreDistributionQuerySchema = z.object({
  timeRange: timeRangeSchema.optional().default("last30days"),
});

export const skillAssessmentQuerySchema = z.object({
  timeRange: timeRangeSchema.optional().default("last30days"),
});

export const assessmentInsightsQuerySchema = z.object({
  timeRange: timeRangeSchema.optional().default("last30days"),
});

export const exportQuerySchema = z.object({
  timeRange: timeRangeSchema.optional().default("last30days"),
  format: z.enum(["csv", "json"]).optional().default("json"),
});

// Export types for use in controllers
export type TeamIdParams = z.infer<typeof teamIdSchema>;
export type OverviewQueryParams = z.infer<typeof overviewQuerySchema>;
export type PerformanceQueryParams = z.infer<typeof performanceQuerySchema>;
export type TeamProgressQueryParams = z.infer<typeof teamProgressQuerySchema>;
export type DepartmentQueryParams = z.infer<typeof departmentQuerySchema>;
export type TrainingCategoryQueryParams = z.infer<
  typeof trainingCategoryQuerySchema
>;
export type LearningTrendsQueryParams = z.infer<
  typeof learningTrendsQuerySchema
>;
export type ScoreDistributionQueryParams = z.infer<
  typeof scoreDistributionQuerySchema
>;
export type SkillAssessmentQueryParams = z.infer<
  typeof skillAssessmentQuerySchema
>;
export type AssessmentInsightsQueryParams = z.infer<
  typeof assessmentInsightsQuerySchema
>;
export type ExportQueryParams = z.infer<typeof exportQuerySchema>;

// Combined schemas for route validation
export const analyticsSchemas = {
  getOverviewSchema: {
    params: teamIdSchema,
    query: overviewQuerySchema,
  },
  getPerformanceTimelineSchema: {
    params: teamIdSchema,
    query: performanceQuerySchema,
  },
  getTeamMemberProgressSchema: {
    params: teamIdSchema,
    query: teamProgressQuerySchema,
  },
  getDepartmentPerformanceSchema: {
    params: teamIdSchema,
    query: departmentQuerySchema,
  },
  getTrainingCategoryMetricsSchema: {
    params: teamIdSchema,
    query: trainingCategoryQuerySchema,
  },
  getLearningTrendsSchema: {
    params: teamIdSchema,
    query: learningTrendsQuerySchema,
  },
  getScoreDistributionSchema: {
    params: teamIdSchema,
    query: scoreDistributionQuerySchema,
  },
  getSkillAssessmentSchema: {
    params: teamIdSchema,
    query: skillAssessmentQuerySchema,
  },
  getAssessmentInsightsSchema: {
    params: teamIdSchema,
    query: assessmentInsightsQuerySchema,
  },
  exportAnalyticsDataSchema: {
    params: teamIdSchema,
    query: exportQuerySchema,
  },
};
