import mongoose, { Document, Schema } from "mongoose";

export interface IEvaluationSummary {
  content: string;
  timestamp: Date;
  transcript: string;
  callId?: string;
}

export interface ISkillAssessment {
  skillName: string;
  score: number;
  weight: number;
  evidence?: string; // Added evidence field
}

export interface IStrengthItem {
  title: string;
  description: string;
  evidence?: string; // Added evidence field
}

export interface IImprovementArea {
  title: string;
  description: string;
  evidence?: string; // Added evidence field
}

export interface INextStep {
  title: string;
  description: string;
  type:
    | "skill_development"
    | "knowledge_acquisition"
    | "practical_application"
    | "assessment";
  priority: number; // Added priority field
}

export interface IEvaluationProgress extends Document {
  evaluationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  summaries: IEvaluationSummary[];
  progress: number;
  status: "Not Started" | "In Progress" | "Completed";
  timeSpent: number;
  lastAccessDate: Date;
  overallScore?: number;
  skillAssessments?: ISkillAssessment[];
  strengths?: IStrengthItem[]; // Changed to structured items
  improvementAreas?: IImprovementArea[]; // Changed to structured items
  recommendation?: string;
  nextSteps?: INextStep[];
  assignedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EvaluationSummarySchema = new Schema<IEvaluationSummary>({
  content: {
    type: String,
    required: true,
  },
  transcript: {
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
});

const SkillAssessmentSchema = new Schema<ISkillAssessment>({
  skillName: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  weight: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 1,
  },
  evidence: {
    type: String,
    required: false, // Optional but recommended
  },
});

const StrengthItemSchema = new Schema<IStrengthItem>({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  evidence: {
    type: String,
    required: false, // Optional but recommended
  },
});

const ImprovementAreaSchema = new Schema<IImprovementArea>({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  evidence: {
    type: String,
    required: false, // Optional but recommended
  },
});

const NextStepSchema = new Schema<INextStep>({
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
    enum: [
      "skill_development",
      "knowledge_acquisition",
      "practical_application",
      "assessment",
    ],
    required: true,
  },
  priority: {
    type: Number,
    required: true,
    min: 1,
    max: 3,
    default: 2,
  },
});

const EvaluationProgressSchema = new Schema<IEvaluationProgress>(
  {
    evaluationId: {
      type: Schema.Types.ObjectId,
      ref: "Evaluation",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    summaries: [EvaluationSummarySchema],
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ["Not Started", "In Progress", "Completed"],
      default: "Not Started",
    },
    timeSpent: {
      type: Number,
      default: 0,
      min: 0, // minutes
    },
    lastAccessDate: {
      type: Date,
      default: Date.now,
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    skillAssessments: [SkillAssessmentSchema],
    strengths: [StrengthItemSchema], // Using structured schema
    improvementAreas: [ImprovementAreaSchema], // Using structured schema
    recommendation: {
      type: String,
    },
    nextSteps: [NextStepSchema],
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Add compound index to efficiently query progress by user and status
EvaluationProgressSchema.index({ userId: 1, status: 1 });
// Add index for efficiently finding recent evaluations
EvaluationProgressSchema.index({ updatedAt: -1 });

export const EvaluationProgress = mongoose.model<IEvaluationProgress>(
  "EvaluationProgress",
  EvaluationProgressSchema,
);
