// src/shared/models/TrainingProgress.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ISessionSummary {
  content: string;
  timestamp: Date;
  callId?: string;
  transcript: string;
}

export interface IEvaluation {
  score: number;
  feedback: string;
  evaluatedAt: Date;
}

export interface ITopicCovered {
  name: string;
  comprehensionLevel: 'basic' | 'intermediate' | 'advanced';
  evidence: string;
}

export interface IConceptUnderstood {
  name: string;
  evidence: string;
  applicationContext?: string;
}

export interface ILearningGap {
  topic: string;
  description: string;
  recommendedAction: string;
}

export interface INextLearningStep {
  title: string;
  description: string;
  type: 'concept_reinforcement' | 'practical_application' | 'knowledge_extension' | 'assessment';
  priority: number;
}

export interface ITrainingProgress extends Document {
  sessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  summaries: ISessionSummary[];
  progress: number;
  status: 'Not Started' | 'In Progress' | 'Completed';
  timeSpent: number;
  lastAccessDate: Date;
  evaluations: IEvaluation[];
  topicsCovered: ITopicCovered[] | string[]; // Support both legacy and new format
  conceptsUnderstood: IConceptUnderstood[] | string[]; // Support both legacy and new format
  learningGaps?: ILearningGap[];
  nextLearningSteps?: INextLearningStep[];
  chatSessionId?: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSummarySchema = new Schema<ISessionSummary>({
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  callId: {
    type: String,
    required: true,
  },
  transcript: {
    type: String,
    required: true,
  },
});

const EvaluationSchema = new Schema<IEvaluation>({
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  feedback: {
    type: String,
    required: true,
  },
  evaluatedAt: {
    type: Date,
    default: Date.now,
  },
});

const TopicCoveredSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  comprehensionLevel: {
    type: String,
    enum: ['basic', 'intermediate', 'advanced'],
    default: 'basic',
  },
  evidence: {
    type: String,
  },
}, { _id: false, strict: false }); // Use strict: false for backward compatibility

const ConceptUnderstoodSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  evidence: {
    type: String,
  },
  applicationContext: {
    type: String,
  },
}, { _id: false, strict: false }); // Use strict: false for backward compatibility

const LearningGapSchema = new Schema<ILearningGap>({
  topic: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  recommendedAction: {
    type: String,
    required: true,
  },
}, { _id: false });

const NextLearningStepSchema = new Schema<INextLearningStep>({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['concept_reinforcement', 'practical_application', 'knowledge_extension', 'assessment'],
    required: true,
  },
  priority: {
    type: Number,
    min: 1,
    max: 3,
    default: 2,
  },
}, { _id: false });

const TrainingProgressSchema = new Schema<ITrainingProgress>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'TrainingSession',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    summaries: [SessionSummarySchema],
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
      default: 'Not Started',
    },
    timeSpent: {
      type: Number,
      default: 0,
      min: 0, // minutes
    },
    chatSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'ChatSession'
    },
    lastAccessDate: {
      type: Date,
      default: Date.now,
    },
    evaluations: [EvaluationSchema],
    topicsCovered: {
      type: [TopicCoveredSchema], // Mixed type to support both string and object formats
      default: [],
    },
    conceptsUnderstood: {
      type: [ConceptUnderstoodSchema], // Mixed type to support both string and object formats
      default: [],
    },
    learningGaps: {
      type: [LearningGapSchema],
      default: [],
    },
    nextLearningSteps: {
      type: [NextLearningStepSchema],
      default: [],
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Create indexes for efficient queries
TrainingProgressSchema.index({ sessionId: 1, userId: 1 }, { unique: true });
TrainingProgressSchema.index({ userId: 1 });
TrainingProgressSchema.index({ status: 1 });
TrainingProgressSchema.index({ updatedAt: -1 });

export const TrainingProgress = mongoose.model<ITrainingProgress>('TrainingProgress', TrainingProgressSchema);