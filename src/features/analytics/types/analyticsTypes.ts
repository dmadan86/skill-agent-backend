// src/features/analytics/types/analyticsTypes.ts
import { z } from 'zod';

// Common types for analytics
export interface TrendValue {
  value: number;
  change: number;
  unit?: string;
}

export interface OverviewMetrics {
  avgTrainingScore: number;
  trainingCompletionRate: number;
  avgTimeToProficiency: number;
  activeTrainingSessions: number;
  trends: {
    avgTrainingScore: { value: number; change: number };
    trainingCompletionRate: { value: number; change: number };
    avgTimeToProficiency: { value: number; change: number; unit: string };
    activeTrainingSessions: { value: number; change: number };
  };
}

export interface TimelineDataPoint {
  month: string;
  evaluationScores: number;
  trainingCompletion: number;
  proficiencyLevels: number;
}

export interface PerformanceTimeline {
  timeline: TimelineDataPoint[];
}

export interface TeamMemberProgress {
  userId: string;
  firstName: string;
  lastName: string;
  position: string;
  department?: string;
  trainingScore: number;
  trainingProgress: number;
}

export interface TeamProgressData {
  members: TeamMemberProgress[];
}

export interface DepartmentPerformance {
  departmentId: string;
  name: string;
  avgScore: number;
  trainingCompletion: number;
}

export interface DepartmentData {
  departments: DepartmentPerformance[];
}

export interface CategoryMetric {
  category: string;
  completionRate: number;
  timeSpent: number;
}

export interface TrainingCategoryData {
  categories: CategoryMetric[];
}

export interface LearningTrend {
  avgTrainingSessions: number;
  completionTime: number;
  engagementScore: number;
  changeVsPrevious: {
    avgTrainingSessions: number;
    completionTime: number;
    engagementScore: number;
  };
}

export interface ScoreDistribution {
  excellent: number; // 90-100%
  good: number;      // 75-89%
  average: number;   // 60-74%
  needsImprovement: number; // <60%
}

export interface SkillAssessment {
  skillName: string;
  currentScore: number;
  previousScore: number;
}

export interface SkillAssessmentData {
  skills: SkillAssessment[];
}

export interface AssessmentInsight {
  strengths: string[];
  improvementAreas: string[];
  recommendedActions: string[];
}

// Zod validation schemas for analytics requests
export const timeRangeSchema = z.union([
  z.enum(['last7days', 'last30days', 'last90days', 'ytd']),
  z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  })
]);

export const teamIdSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required')
});

export const overviewQuerySchema = z.object({
  timeRange: timeRangeSchema.optional().default('last30days')
});

export const performanceQuerySchema = z.object({
  timeRange: timeRangeSchema.optional().default('last30days')
});

export const teamProgressQuerySchema = z.object({
  timeRange: timeRangeSchema.optional().default('last30days')
});

export const departmentQuerySchema = z.object({
  timeRange: timeRangeSchema.optional().default('last30days')
});

export const trainingCategoryQuerySchema = z.object({
  timeRange: timeRangeSchema.optional().default('last30days')
});

export const learningTrendsQuerySchema = z.object({
  timeRange: timeRangeSchema.optional().default('last30days')
});

export const scoreDistributionQuerySchema = z.object({
  timeRange: timeRangeSchema.optional().default('last30days')
});

export const skillAssessmentQuerySchema = z.object({
  timeRange: timeRangeSchema.optional().default('last30days')
});

export const assessmentInsightsQuerySchema = z.object({
  timeRange: timeRangeSchema.optional().default('last30days')
});

// Export types for use in controllers
export type TimeRange = z.infer<typeof timeRangeSchema>;
export type OverviewQueryParams = z.infer<typeof overviewQuerySchema>;
export type PerformanceQueryParams = z.infer<typeof performanceQuerySchema>;
export type TeamProgressQueryParams = z.infer<typeof teamProgressQuerySchema>;
export type DepartmentQueryParams = z.infer<typeof departmentQuerySchema>;
export type TrainingCategoryQueryParams = z.infer<typeof trainingCategoryQuerySchema>;
export type LearningTrendsQueryParams = z.infer<typeof learningTrendsQuerySchema>;
export type ScoreDistributionQueryParams = z.infer<typeof scoreDistributionQuerySchema>;
export type SkillAssessmentQueryParams = z.infer<typeof skillAssessmentQuerySchema>;
export type AssessmentInsightsQueryParams = z.infer<typeof assessmentInsightsQuerySchema>;