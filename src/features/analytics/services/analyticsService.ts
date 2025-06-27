// src/features/analytics/services/analyticsService.ts
import { Types } from 'mongoose';
import { TrainingSession } from '../../../shared/models/TrainingSession';
import { TrainingProgress } from '../../../shared/models/TrainingProgress';
import { EvaluationProgress } from '../../../shared/models/EvaluationProgress';
import { Team } from '../../../shared/models/Team';
import User from '../../../shared/models/User';
import { NotFoundError, ForbiddenError, AppError } from '../../../shared/errors/AppError';
import { getAggregatedAnalytics } from './analyticsAggregationService';

/**
 * Parse and validate the time range parameter
 */
export const getDateRange = (timeRange: string | { startDate: string, endDate: string }): { startDate: Date, endDate: Date } => {
  const now = new Date();
  let startDate: Date;
  let endDate = now;

  if (typeof timeRange === 'object' && timeRange.startDate && timeRange.endDate) {
    startDate = new Date(timeRange.startDate);
    endDate = new Date(timeRange.endDate);
    
    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new AppError('Invalid date format', 'INVALID_DATE_FORMAT', 400);
    }
    
    if (startDate > endDate) {
      throw new AppError('Start date must be before end date', 'INVALID_DATE_RANGE', 400);
    }
  } else {
    startDate = new Date(now);
    switch (timeRange) {
      case 'last7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'last30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'last90days':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'ytd': 
        startDate = new Date(now.getFullYear(), 0, 1); 
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }
  }
  
  return { startDate, endDate };
};

/**
 * Get array of months between two dates in format 'YYYY-MM'
 */
export const getMonthsBetweenDates = (startDate: Date, endDate: Date): string[] => {
  const months: string[] = [];
  let currentDate = new Date(startDate);
  
  // Set to first day of month for consistent comparison
  currentDate.setDate(1);
  const lastDate = new Date(endDate);
  lastDate.setDate(1);
  
  while (currentDate <= lastDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // JavaScript months are 0-based
    months.push(`${year}-${month.toString().padStart(2, '0')}`);
    
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return months;
};

/**
 * Verify team access for a user, considering user's membership in multiple teams
 */
export const verifyTeamAccess = async (teamId: string, userId: string, requireOwnership = false): Promise<void> => {
  const team = await Team.findById(teamId);
  
  if (!team) {
    throw new AppError('Team not found', 'TEAM_NOT_FOUND', 404);
  }
  
  // If requiring ownership, check if user is the owner
  if (requireOwnership && team.owner.toString() !== userId) {
    throw new ForbiddenError('You do not have permission to access team analytics');
  }
  
  // If not requiring ownership, check if user is owner or a member
  if (!requireOwnership) {
    const isOwner = team.owner.toString() === userId;
    const isMember = team.members.some(member => member.toString() === userId);
    
    if (!isOwner && !isMember) {
      throw new ForbiddenError('You do not have permission to access team analytics');
    }
  }
};

/**
 * Get all team IDs that a user has access to
 */
export const getUserTeamIds = async (userId: string): Promise<string[]> => {
  // Find user to check if they have teams assigned
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  // Get all teams where the user is either a member or the owner
  const teams = await Team.find({
    $or: [
      { members: { $in: [userId] } },
      { owner: userId }
    ]
  });
  
  return teams.map(team => team._id ? team._id.toString() : '');
};

/**
 * Get overview metrics for dashboard
 */
export const getOverviewMetrics = async (
  teamId: string,
  timeRange: string | { startDate: string, endDate: string },
  userId: string
): Promise<{
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
}> => {
  await verifyTeamAccess(teamId, userId);
  
  // Check if we have aggregated data available
  if (typeof timeRange === 'string') {
    const aggregatedData = await getAggregatedAnalytics(teamId, timeRange, 'overview');
    if (aggregatedData) {
      return {
        ...aggregatedData,
        trends: {
          avgTrainingScore: { value: aggregatedData.avgTrainingScore, change: 0 },
          trainingCompletionRate: { value: aggregatedData.trainingCompletionRate, change: 0 },
          avgTimeToProficiency: { value: aggregatedData.avgTimeToProficiency, change: 0, unit: 'days' },
          activeTrainingSessions: { value: aggregatedData.activeTrainingSessions, change: 0 }
        }
      };
    }
  }
  
  // If no aggregated data or using custom date range, calculate on-the-fly
  const { startDate, endDate } = getDateRange(timeRange);
  
  // Calculate overview metrics
  const avgTrainingScore = await calculateAverageTrainingScore(teamId, startDate, endDate);
  const trainingCompletionRate = await calculateCompletionRate(teamId, startDate, endDate);
  const avgTimeToProficiency = await calculateAverageTimeToProficiency(teamId, startDate, endDate);
  const activeTrainingSessions = await countActiveTrainingSessions(teamId);
  
  // Calculate metrics for previous period for trend analysis
  const periodDuration = endDate.getTime() - startDate.getTime();
  const prevStartDate = new Date(startDate.getTime() - periodDuration);
  const prevEndDate = new Date(endDate.getTime() - periodDuration);
  
  const prevAvgTrainingScore = await calculateAverageTrainingScore(teamId, prevStartDate, prevEndDate);
  const prevTrainingCompletionRate = await calculateCompletionRate(teamId, prevStartDate, prevEndDate);
  const prevAvgTimeToProficiency = await calculateAverageTimeToProficiency(teamId, prevStartDate, prevEndDate);
  const prevActiveTrainingSessions = await countActiveTrainingSessions(teamId, prevEndDate);
  
  // Calculate percentage changes
  const avgTrainingScoreChange = calculatePercentageChange(avgTrainingScore, prevAvgTrainingScore);
  const trainingCompletionRateChange = calculatePercentageChange(trainingCompletionRate, prevTrainingCompletionRate);
  const avgTimeToProficiencyChange = calculateDayChange(avgTimeToProficiency, prevAvgTimeToProficiency);
  const activeTrainingSessionsChange = activeTrainingSessions - prevActiveTrainingSessions;
  
  return {
    avgTrainingScore,
    trainingCompletionRate,
    avgTimeToProficiency,
    activeTrainingSessions,
    trends: {
      avgTrainingScore: { value: avgTrainingScore, change: avgTrainingScoreChange },
      trainingCompletionRate: { value: trainingCompletionRate, change: trainingCompletionRateChange },
      avgTimeToProficiency: { value: avgTimeToProficiency, change: avgTimeToProficiencyChange, unit: 'days' },
      activeTrainingSessions: { value: activeTrainingSessions, change: activeTrainingSessionsChange }
    }
  };
};

/**
 * Calculate percentage change between current and previous values
 */
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return parseFloat(((current - previous) / previous * 100).toFixed(1));
};

/**
 * Calculate day difference for time metrics
 */
export const calculateDayChange = (current: number, previous: number): number => {
  return parseFloat((current - previous).toFixed(1));
};

/**
 * Calculate average training score for a team
 */
export const calculateAverageTrainingScore = async (
  teamId: string,
  startDate: Date,
  endDate: Date
): Promise<number> => {
  const team = await Team.findById(teamId);
  
  if (!team) {
    throw new NotFoundError('Team not found');
  }
  
  // Get unique list of team members including the owner
  const memberIds = [team.owner.toString(), ...team.members.map(id => id.toString())];
  const uniqueMemberIds = [...new Set(memberIds)];
  
  // Find all training progress records for team members
  const progressRecords = await TrainingProgress.aggregate([
    {
      $match: {
        userId: { $in: uniqueMemberIds.map(id => new Types.ObjectId(id)) },
        updatedAt: { $gte: startDate, $lte: endDate },
        'evaluations.0': { $exists: true } // Make sure there are evaluations
      }
    },
    {
      $unwind: '$evaluations'
    },
    {
      $group: {
        _id: '$userId',
        avgScore: { $avg: '$evaluations.score' }
      }
    },
    {
      $group: {
        _id: null,
        teamAvgScore: { $avg: '$avgScore' }
      }
    }
  ]);
  
  return progressRecords.length > 0 ? parseFloat(progressRecords[0].teamAvgScore.toFixed(1)) : 0;
};

/**
 * Calculate completion rate for a team
 */
export const calculateCompletionRate = async (
  teamId: string,
  startDate: Date,
  endDate: Date
): Promise<number> => {
  const team = await Team.findById(teamId);
  
  if (!team) {
    throw new NotFoundError('Team not found');
  }
  
  // Get unique list of team members including the owner
  const memberIds = [team.owner.toString(), ...team.members.map(id => id.toString())];
  const uniqueMemberIds = [...new Set(memberIds)];
  
  // Get all training sessions for the team's members
  const trainingSessions = await TrainingSession.find({
    'trainees.userId': { $in: uniqueMemberIds.map(id => new Types.ObjectId(id)) },
    createdAt: { $lte: endDate }
  });
  
  if (trainingSessions.length === 0) {
    return 0;
  }
  
  // Count completed trainings
  let totalAssignments = 0;
  let completedAssignments = 0;
  
  trainingSessions.forEach(session => {
    session.trainees.forEach(trainee => {
      if (uniqueMemberIds.includes(trainee.userId.toString())) {
        totalAssignments++;
        
        if (trainee.status === 'Completed' && 
            trainee.completedDate && 
            trainee.completedDate >= startDate && 
            trainee.completedDate <= endDate) {
          completedAssignments++;
        }
      }
    });
  });
  
  return totalAssignments > 0 ? parseFloat(((completedAssignments / totalAssignments) * 100).toFixed(1)) : 0;
};

/**
 * Calculate average time to proficiency for a team
 */
export const calculateAverageTimeToProficiency = async (
  teamId: string,
  startDate: Date,
  endDate: Date,
  proficiencyThreshold = 80
): Promise<number> => {
  const team = await Team.findById(teamId);
  
  if (!team) {
    throw new NotFoundError('Team not found');
  }
  
  const memberIds = [team.owner, ...team.members].map(id => id.toString());
  
  // Calculate time to proficiency for each member
  const memberProficiencyTimes: number[] = [];
  
  for (const memberId of memberIds) {
    const timeToProficiency = await calculateUserTimeToProficiency(
      memberId, 
      startDate, 
      endDate, 
      proficiencyThreshold
    );
    
    if (timeToProficiency !== null) {
      memberProficiencyTimes.push(timeToProficiency);
    }
  }
  
  // Calculate average
  if (memberProficiencyTimes.length === 0) return 0;
  
  const sum = memberProficiencyTimes.reduce((acc, time) => acc + time, 0);
  return parseFloat((sum / memberProficiencyTimes.length).toFixed(1));
};

/**
 * Calculate time to proficiency for a single user
 */
export const calculateUserTimeToProficiency = async (
  userId: string,
  startDate: Date,
  endDate: Date,
  proficiencyThreshold = 80
): Promise<number | null> => {
  const firstTraining = await TrainingSession.findOne({
    'trainees.userId': new Types.ObjectId(userId),
    'trainees.assignedDate': { $gte: startDate, $lte: endDate }
  }).sort({ 'trainees.assignedDate': 1 });
  
  if (!firstTraining) return null;
  
  const assignedDate = firstTraining.trainees.find(
    t => t.userId.toString() === userId
  )?.assignedDate;
  
  if (!assignedDate) return null;
  
  // Find first evaluation that meets the proficiency threshold
  const firstProficientEval = await EvaluationProgress.findOne({
    userId: new Types.ObjectId(userId),
    overallScore: { $gte: proficiencyThreshold },
    updatedAt: { $gte: assignedDate, $lte: endDate }
  }).sort({ updatedAt: 1 });
  
  if (!firstProficientEval) return null;
  
  // Calculate days between assignment and proficiency
  const proficiencyDate = firstProficientEval.updatedAt;
  
  return Math.ceil((proficiencyDate.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * Count active training sessions for a team
 */
export const countActiveTrainingSessions = async (
  teamId: string,
  currentDate: Date = new Date()
): Promise<number> => {
  const team = await Team.findById(teamId);
  
  if (!team) {
    throw new NotFoundError('Team not found');
  }
  
  const memberIds = [team.owner, ...team.members].map(id => id.toString());
  
  // Count training sessions with status "In Progress"
  const activeSessions = await TrainingSession.countDocuments({
    'trainees.userId': { $in: memberIds.map(id => new Types.ObjectId(id)) },
    'trainees.status': 'In Progress'
  });
  
  return activeSessions;
};

/**
 * Get performance timeline data
 */
export const getPerformanceTimeline = async (
  teamId: string,
  timeRange: string | { startDate: string, endDate: string },
  userId: string
): Promise<{
  timeline: Array<{
    month: string;
    evaluationScores: number;
    trainingCompletion: number;
    proficiencyLevels: number;
  }>;
}> => {
  await verifyTeamAccess(teamId, userId);
  
  // Check if we have aggregated data available
  if (typeof timeRange === 'string') {
    const aggregatedData = await getAggregatedAnalytics(teamId, timeRange, 'performanceTimeline');
    if (aggregatedData) {
      return aggregatedData;
    }
  }
  
  // If no aggregated data or using custom date range, calculate on-the-fly
  const { startDate, endDate } = getDateRange(timeRange);
  
  const team = await Team.findById(teamId);
  if (!team) {
    throw new NotFoundError('Team not found');
  }
  
  // Get unique list of team members including the owner
  const memberIds = [team.owner.toString(), ...team.members.map(id => id.toString())];
  const uniqueMemberIds = [...new Set(memberIds)];
  
  // Get months between start and end date
  const months = getMonthsBetweenDates(startDate, endDate);
  
  // Initialize timeline data
  const timeline = months.map((month: string) => ({
    month,
    evaluationScores: 0,
    trainingCompletion: 0,
    proficiencyLevels: 0,
  }));
  
  // Calculate monthly evaluation scores
  for (const entry of timeline) {
    const [year, month] = entry.month.split('-').map((n: string) => parseInt(n, 10));
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);
    
    // Get evaluation scores for this month
    const monthlyEvalScore = await calculateAverageEvaluationScore(
      teamId,
      startOfMonth,
      endOfMonth
    );
    
    // Get training completion for this month
    const monthlyCompletionRate = await calculateCompletionRate(
      teamId,
      startOfMonth,
      endOfMonth
    );
    
    // Get proficiency levels for this month
    const monthlyProficiencyLevel = await calculateAverageProficiencyLevel(
      teamId,
      startOfMonth,
      endOfMonth
    );
    
    entry.evaluationScores = monthlyEvalScore;
    entry.trainingCompletion = monthlyCompletionRate;
    entry.proficiencyLevels = monthlyProficiencyLevel;
  }
  
  return { timeline };
};

/**
 * Calculate average evaluation score for a team
 */
export const calculateAverageEvaluationScore = async (
  teamId: string,
  startDate: Date,
  endDate: Date
): Promise<number> => {
  const team = await Team.findById(teamId);
  
  if (!team) {
    throw new NotFoundError('Team not found');
  }
  
  const memberIds = [team.owner, ...team.members].map(id => id.toString());
  
  // Find all evaluation progress records for team members
  const progressRecords = await EvaluationProgress.aggregate([
    {
      $match: {
        userId: { $in: memberIds.map(id => new Types.ObjectId(id)) },
        updatedAt: { $gte: startDate, $lte: endDate },
        overallScore: { $exists: true }
      }
    },
    {
      $group: {
        _id: null,
        avgScore: { $avg: '$overallScore' }
      }
    }
  ]);
  
  return progressRecords.length > 0 ? parseFloat(progressRecords[0].avgScore.toFixed(1)) : 0;
};

/**
 * Calculate average proficiency level for a team
 */
export const calculateAverageProficiencyLevel = async (
  teamId: string,
  startDate: Date,
  endDate: Date
): Promise<number> => {
  const team = await Team.findById(teamId);
  
  if (!team) {
    throw new NotFoundError('Team not found');
  }
  
  const memberIds = [team.owner, ...team.members].map(id => id.toString());
  
  // Calculate proficiency as a combined metric from training and evaluation scores
  const trainingScores = await TrainingProgress.aggregate([
    {
      $match: {
        userId: { $in: memberIds.map(id => new Types.ObjectId(id)) },
        updatedAt: { $gte: startDate, $lte: endDate },
        'evaluations.0': { $exists: true }
      }
    },
    {
      $unwind: '$evaluations'
    },
    {
      $group: {
        _id: '$userId',
        avgScore: { $avg: '$evaluations.score' }
      }
    },
    {
      $group: {
        _id: null,
        avgTrainingScore: { $avg: '$avgScore' }
      }
    }
  ]);
  
  const evaluationScores = await EvaluationProgress.aggregate([
    {
      $match: {
        userId: { $in: memberIds.map(id => new Types.ObjectId(id)) },
        updatedAt: { $gte: startDate, $lte: endDate },
        overallScore: { $exists: true }
      }
    },
    {
      $group: {
        _id: null,
        avgScore: { $avg: '$overallScore' }
      }
    }
  ]);
  
  const avgTrainingScore = trainingScores.length > 0 ? trainingScores[0].avgTrainingScore : 0;
  const avgEvalScore = evaluationScores.length > 0 ? evaluationScores[0].avgScore : 0;
  
  // Combine scores (weighted average)
  let proficiencyLevel = 0;
  let divisor = 0;
  
  if (avgTrainingScore > 0) {
    proficiencyLevel += avgTrainingScore * 0.4; // 40% weight
    divisor += 0.4;
  }
  
  if (avgEvalScore > 0) {
    proficiencyLevel += avgEvalScore * 0.6; // 60% weight
    divisor += 0.6;
  }
  
  return divisor > 0 ? parseFloat((proficiencyLevel / divisor).toFixed(1)) : 0;
};