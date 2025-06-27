import mongoose, { Document, Schema } from 'mongoose';

export interface IPerformanceData {
  month: string;
  evaluationScores: number;
  trainingCompletion: number;
  proficiencyLevels: number;
}

export interface ITeamMemberProgress {
  userId: mongoose.Types.ObjectId;
  name: string;
  trainingProgress: number;
  evaluationScore: number;
  skillGrowth: number;
}

export interface IDepartmentPerformance {
  departmentId: mongoose.Types.ObjectId | null;
  name: string;
  averageScore: number;
  completionRate: number;
  memberCount: number;
}

export interface ITrainingCategoryMetric {
  categoryName: string;
  completionRate: number;
  averageScore: number;
  timeSpent: number;
  userCount: number;
}

export interface ISkillAssessment {
  skillName: string;
  currentScore: number;
  previousScore: number;
}

export interface IScoreDistribution {
  excellent: number;
  good: number;
  average: number;
  needsImprovement: number;
}

export interface IAggregatedAnalytics extends Document {
  // Key fields for querying
  teamId: mongoose.Types.ObjectId;
  date: Date;
  
  // Overview metrics
  overviewMetrics: {
    avgTrainingScore: number;
    trainingCompletionRate: number;
    avgTimeToProficiency: number;
    activeTrainingSessions: number;
  };
  
  // Timeline data
  performanceTimeline: IPerformanceData[];
  
  // Team member progress
  teamMemberProgress: ITeamMemberProgress[];
  
  // Department performance
  departmentPerformance: IDepartmentPerformance[];
  
  // Training categories
  trainingCategoryMetrics: ITrainingCategoryMetric[];
  
  // Learning trends
  learningTrends: {
    topicsLearned: Array<{ topic: string; count: number }>;
    conceptsUnderstood: Array<{ concept: string; count: number }>;
    learningGaps: Array<{ gap: string; count: number }>;
  };
  
  // Evaluation analytics
  scoreDistribution: IScoreDistribution;
  
  // Skill assessment
  skillAssessment: ISkillAssessment[];
  
  // Assessment insights
  assessmentInsights: {
    strengths: string[];
    improvementAreas: string[];
    recommendedActions: string[];
  };
  
  // Status of aggregation
  status: 'completed' | 'partial' | 'failed';
  errorDetails?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const PerformanceDataSchema = new Schema<IPerformanceData>({
  month: { type: String, required: true },
  evaluationScores: { type: Number, default: 0 },
  trainingCompletion: { type: Number, default: 0 },
  proficiencyLevels: { type: Number, default: 0 },
}, { _id: false });

const TeamMemberProgressSchema = new Schema<ITeamMemberProgress>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  trainingProgress: { type: Number, default: 0 },
  evaluationScore: { type: Number, default: 0 },
  skillGrowth: { type: Number, default: 0 },
}, { _id: false });

const DepartmentPerformanceSchema = new Schema<IDepartmentPerformance>({
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
  name: { type: String, required: true },
  averageScore: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0 },
  memberCount: { type: Number, default: 0 },
}, { _id: false });

const TrainingCategoryMetricSchema = new Schema<ITrainingCategoryMetric>({
  categoryName: { type: String, required: true },
  completionRate: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  timeSpent: { type: Number, default: 0 },
  userCount: { type: Number, default: 0 },
}, { _id: false });

const SkillAssessmentSchema = new Schema<ISkillAssessment>({
  skillName: { type: String, required: true },
  currentScore: { type: Number, default: 0 },
  previousScore: { type: Number, default: 0 },
}, { _id: false });

const ScoreDistributionSchema = new Schema<IScoreDistribution>({
  excellent: { type: Number, default: 0 },
  good: { type: Number, default: 0 },
  average: { type: Number, default: 0 },
  needsImprovement: { type: Number, default: 0 },
}, { _id: false });

const AggregatedAnalyticsSchema = new Schema<IAggregatedAnalytics>(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    overviewMetrics: {
      avgTrainingScore: { type: Number, default: 0 },
      trainingCompletionRate: { type: Number, default: 0 },
      avgTimeToProficiency: { type: Number, default: 0 },
      activeTrainingSessions: { type: Number, default: 0 },
    },
    performanceTimeline: [PerformanceDataSchema],
    teamMemberProgress: [TeamMemberProgressSchema],
    departmentPerformance: [DepartmentPerformanceSchema],
    trainingCategoryMetrics: [TrainingCategoryMetricSchema],
    learningTrends: {
      topicsLearned: [{ 
        topic: { type: String, required: true }, 
        count: { type: Number, default: 0 } 
      }],
      conceptsUnderstood: [{ 
        concept: { type: String, required: true }, 
        count: { type: Number, default: 0 } 
      }],
      learningGaps: [{ 
        gap: { type: String, required: true }, 
        count: { type: Number, default: 0 } 
      }],
    },
    scoreDistribution: {
      type: ScoreDistributionSchema,
      default: () => ({}),
    },
    skillAssessment: [SkillAssessmentSchema],
    assessmentInsights: {
      strengths: [{ type: String }],
      improvementAreas: [{ type: String }],
      recommendedActions: [{ type: String }],
    },
    status: {
      type: String,
      enum: ['completed', 'partial', 'failed'],
      default: 'completed',
    },
    errorDetails: {
      type: String,
    },
  },
  { timestamps: true }
);

// Create indexes for efficient queries
AggregatedAnalyticsSchema.index({ teamId: 1, date: 1 }, { unique: true });
AggregatedAnalyticsSchema.index({ date: 1 });

export const AggregatedAnalytics = mongoose.model<IAggregatedAnalytics>('AggregatedAnalytics', AggregatedAnalyticsSchema); 