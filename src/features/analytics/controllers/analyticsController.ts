// src/features/analytics/controllers/analyticsController.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../shared/middleware/authenticate';
import { sendSuccess } from '../../../shared/utils/response.utils';
import * as analyticsService from '../services/analyticsService';
import * as teamProgressService from '../services/progressAnalyticsService';
import * as trainingAnalyticsService from '../services/trainingAnalyticsService';
import * as evaluationAnalyticsService from '../services/evaluationAnalyticsService';
import {
  TeamIdParams,
  OverviewQueryParams,
  PerformanceQueryParams,
  TeamProgressQueryParams,
  DepartmentQueryParams,
  TrainingCategoryQueryParams,
  LearningTrendsQueryParams,
  ScoreDistributionQueryParams,
  SkillAssessmentQueryParams,
  AssessmentInsightsQueryParams
} from '../validation/analyticsSchema';
import { AppError } from '../../../shared/errors/AppError';

/**
 * Get overview metrics for dashboard
 */
export const getOverviewMetrics = async (
  req: AuthenticatedRequest<TeamIdParams, {}, {}, OverviewQueryParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { teamId } = req.params;
    const { timeRange } = req.query;
    
    const metrics = await analyticsService.getOverviewMetrics(
      teamId,
      timeRange || 'last30days',
      req.user.userId
    );

    sendSuccess(res, metrics);
  } catch (error) {
    next(error);
  }
};

/**
 * Get performance timeline data
 */
export const getPerformanceTimeline = async (
  req: AuthenticatedRequest<TeamIdParams, {}, {}, PerformanceQueryParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { teamId } = req.params;
    const { timeRange } = req.query;
    
    const timeline = await analyticsService.getPerformanceTimeline(
      teamId,
      timeRange || 'last30days',
      req.user.userId
    );

    sendSuccess(res, timeline);
  } catch (error) {
    next(error);
  }
};

/**
 * Get team member progress data
 */
export const getTeamMemberProgress = async (
  req: AuthenticatedRequest<TeamIdParams, {}, {}, TeamProgressQueryParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { teamId } = req.params;
    const { timeRange } = req.query;
    
    const progress = await teamProgressService.getTeamMemberProgress(
      teamId,
      timeRange || 'last30days',
      req.user.userId
    );

    sendSuccess(res, progress);
  } catch (error) {
    next(error);
  }
};

/**
 * Get department performance data
 */
export const getDepartmentPerformance = async (
  req: AuthenticatedRequest<TeamIdParams, {}, {}, DepartmentQueryParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { teamId } = req.params;
    const { timeRange } = req.query;
    
    const departments = await teamProgressService.getDepartmentPerformance(
      teamId,
      timeRange || 'last30days',
      req.user.userId
    );

    sendSuccess(res, departments);
  } catch (error) {
    next(error);
  }
};

/**
 * Get training category analytics
 */
export const getTrainingCategoryMetrics = async (
  req: AuthenticatedRequest<TeamIdParams, {}, {}, TrainingCategoryQueryParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { teamId } = req.params;
    const { timeRange } = req.query;
    
    const categories = await trainingAnalyticsService.getTrainingAgentTypeMetrics(
      teamId,
      timeRange || 'last30days',
      req.user.userId
    );

    sendSuccess(res, categories);
  } catch (error) {
    next(error);
  }
};

/**
 * Get learning trends data
 */
export const getLearningTrends = async (
  req: AuthenticatedRequest<TeamIdParams, {}, {}, LearningTrendsQueryParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { teamId } = req.params;
    const { timeRange } = req.query;
    
    const trends = await trainingAnalyticsService.getLearningTrends(
      teamId,
      timeRange || 'last30days',
      req.user.userId
    );

    sendSuccess(res, trends);
  } catch (error) {
    next(error);
  }
};

/**
 * Get evaluation score distribution
 */
export const getScoreDistribution = async (
  req: AuthenticatedRequest<TeamIdParams, {}, {}, ScoreDistributionQueryParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { teamId } = req.params;
    const { timeRange } = req.query;
    
    const distribution = await evaluationAnalyticsService.getScoreDistribution(
      teamId,
      timeRange || 'last30days',
      req.user.userId
    );

    sendSuccess(res, distribution);
  } catch (error) {
    next(error);
  }
};

/**
 * Get skill assessment comparison
 */
export const getSkillAssessment = async (
  req: AuthenticatedRequest<TeamIdParams, {}, {}, SkillAssessmentQueryParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { teamId } = req.params;
    const { timeRange } = req.query;
    
    const skills = await evaluationAnalyticsService.getSkillAssessment(
      teamId,
      timeRange || 'last30days',
      req.user.userId
    );

    sendSuccess(res, skills);
  } catch (error) {
    next(error);
  }
};

/**
 * Get assessment insights
 */
export const getAssessmentInsights = async (
  req: AuthenticatedRequest<TeamIdParams, {}, {}, AssessmentInsightsQueryParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { teamId } = req.params;
    const { timeRange } = req.query;
    
    const insights = await evaluationAnalyticsService.getAssessmentInsights(
      teamId,
      timeRange || 'last30days',
      req.user.userId
    );

    sendSuccess(res, insights);
  } catch (error) {
    next(error);
  }
};

/**
 * Export analytics data
 */
export const exportAnalyticsData = async (
  req: AuthenticatedRequest<TeamIdParams, {}, {}, { timeRange?: string; format?: 'csv' | 'json' }>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { teamId } = req.params;
    const { timeRange = 'last30days', format = 'json' } = req.query;

    // In a real implementation, this would fetch all relevant analytics data
    // and format it appropriately for export.
    // For now, we'll just return a success message
    sendSuccess(res, {
      message: `Analytics data for team ${teamId} exported as ${format}`,
      // In a real implementation, this would be a download URL or the data itself
      exportData: `Team ${teamId} analytics export (${timeRange})`
    });
  } catch (error) {
    next(error);
  }
};