// src/features/evaluation/services/evaluationAnalysisService.ts
import OpenAI from "openai";
import config from "../../../shared/config";
import {
  IImprovementArea,
  INextStep,
  ISkillAssessment,
  IStrengthItem,
} from "../../../shared/models/EvaluationProgress";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export interface AnalysisResult {
  summary: string;
  progressPercentage: number;
  overallScore?: number;
  skillAssessments?: ISkillAssessment[];
  strengths: IStrengthItem[];
  improvementAreas: IImprovementArea[];
  recommendation?: string;
  nextSteps?: INextStep[];
}

/**
 * Analyze an evaluation transcript to generate assessments, strengths, and areas for improvement
 */
export const analyzeEvaluationTranscript = async (
  transcript: string,
  agentContent: string,
  previousSummary: string | null = null,
  skillsToEvaluate: string[] = [],
  progressPercentage: number = 0
): Promise<AnalysisResult> => {
  try {
    // First, check if transcript has enough content for analysis
    if (!transcript || transcript.trim().length < 200) {
      return {
        summary: "Insufficient interaction for meaningful evaluation.",
        progressPercentage: progressPercentage, // Maintain current progress
        strengths: [
          {
            title: "Insufficient data",
            description:
              "Not enough interaction to identify specific strengths.",
            evidence:
              "The transcript contains limited engagement for proper analysis.",
          },
        ],
        improvementAreas: [
          {
            title: "Engagement level",
            description:
              "More active participation needed for comprehensive evaluation.",
            evidence: "The transcript shows minimal interaction.",
          },
        ],
        nextSteps: [
          {
            title: "Complete full evaluation session",
            description:
              "Participate in a complete evaluation session with sufficient interaction to enable proper assessment.",
            type: "assessment",
            priority: 1,
          },
        ],
      };
    }

    // Check for low engagement patterns
    const lowEngagementPatterns = [
      /I don['']t know/i,
      /not sure/i,
      /no idea/i,
      /can't answer/i,
      /don't understand/i,
      /confused/i,
      /what do you mean/i,
      /unclear/i,
    ];

    let lowEngagementCount = 0;
    lowEngagementPatterns.forEach((pattern) => {
      const matches = transcript.match(pattern) || [];
      lowEngagementCount += matches.length;
    });

    // Calculate user participation ratio (simplified method)
    const userLines = transcript.match(/User:|Trainee:|Student:/gi) || [];
    const agentLines =
      transcript.match(/Agent:|Trainer:|Instructor:|Evaluator:/gi) || [];
    const participationRatio =
      userLines.length / (userLines.length + agentLines.length);

    // Word count for length-based caps
    const wordCount = transcript.split(/\s+/).length;

    const transcriptBase64 = Buffer.from(transcript).toString("base64");
    const transcriptData = `data:application/pdf;base64,${transcriptBase64}`;

    // More concise, human-like prompt
    const prompt = `
# Evaluation Assessment Guidelines

I need your expert evaluation of this transcript. Accurate assessment is critical - inflated scores undermine our evaluation system's credibility.

## Context & Materials:

EVALUATION FRAMEWORK:
${agentContent}

SKILLS TO ASSESS:
${
  skillsToEvaluate.length > 0
    ? skillsToEvaluate.join("\n- ")
    : "Extract relevant skills from agent content only. Don't invent skills."
}

PREVIOUS EVALUATION:
${previousSummary ?? "None available"}

CURRENT PROGRESS: ${progressPercentage}%

## Critical Rules:

1. EVIDENCE IS MANDATORY. Every assessment needs transcript evidence!

2. PROGRESS & SCORING STANDARDS:
   • 0-20% → Fundamentally flawed performance
   • 21-40% → Significant deficiencies
   • 41-60% → Meets basic requirements
   • 61-80% → Demonstrates proficiency
   • 81-100% → Exemplary performance

3. NEVER DECREASE PROGRESS. Start from ${progressPercentage}% and only increase if warranted.

If the assistant has already provided a score, use that as the final score and set the progressPercentage to 100%. Otherwise, analyze the transcript to ensure there is approximately 15–20 minutes of conversation or that all major topics have been covered. Based on the transcript content and any available previous summary, calculate a final score out of 100 and set the progressPercentage to 100%.

## Required JSON format:

{
  "summary": string,              // 100-150 words exactly
  "progressPercentage": integer,  // Must be ≥ ${progressPercentage}
  "overallScore": integer,        // Optional: 0-100 score (only if sufficient evidence or when assistant message has overall score use that)
  "skillAssessments": [           // Only skills with clear evidence
    {
      "skillName": string,        // Must match framework
      "score": integer,           // 0-100 score
      "weight": integer,          // 1-10 importance
      "evidence": string          // Direct reference to transcript
    }
  ],
  "strengths": [                  // Exactly 3-5 strengths
    {
      "title": string,            // Short label
      "description": string,      // 1-2 sentence explanation
      "evidence": string          // Transcript reference
    }
  ],
  "improvementAreas": [           // Exactly 3-5 areas
    {
      "title": string,            // Short label
      "description": string,      // 1-2 sentence explanation
      "evidence": string          // Transcript reference
    }
  ],
  "recommendation": string,       // Optional: 1-3 sentence guidance
  "nextSteps": [                  // Exactly 3-5 actions
    {
      "title": string,            // Brief title
      "description": string,      // 2-3 sentence description
      "type": string,             // "skill_development", "knowledge_acquisition", "practical_application", or "assessment"
      "priority": integer         // 1-3 (1=highest)
    }
  ]
}

Remember: Honest assessment maintains the integrity of our evaluation platform.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "file",
              file: { filename: "transcript.pdf", file_data: transcriptData },
            } as any,
            prompt,
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    const result = JSON.parse(content);
    if (!result.summary || typeof result.progressPercentage !== "number") {
      throw new Error("Invalid response format from OpenAI");
    }

    // Calculate maximum allowed progress increase based on transcript quality
    let maxProgressIncrease = 100;

    // Apply low engagement caps
    if (lowEngagementCount > 5 || participationRatio < 0.25) {
      maxProgressIncrease = Math.min(maxProgressIncrease, 10);
    } else if (lowEngagementCount > 2 || participationRatio < 0.3) {
      maxProgressIncrease = Math.min(maxProgressIncrease, 30);
    }

    // Apply the progress cap while ensuring progress never decreases
    const cappedProgress = Math.max(
      progressPercentage,
      Math.min(
        result.progressPercentage,
        progressPercentage + maxProgressIncrease
      )
    );

    return {
      summary: result.summary,
      progressPercentage: cappedProgress,
      overallScore:
        typeof result.overallScore === "number"
          ? Math.min(Math.max(result.overallScore, 0), 100)
          : undefined,
      skillAssessments: (result.skillAssessments ?? []).map(
        (s: ISkillAssessment) => ({
          skillName: s.skillName,
          score: Math.min(Math.max(s.score, 0), 100),
          weight: Math.min(Math.max(s.weight || 1, 1), 10),
          evidence: s.evidence,
        })
      ),
      strengths: result.strengths ?? [
        {
          title: "Evaluation in progress",
          description:
            "Further interaction needed to identify clear strengths.",
          evidence: "Limited evidence available in current transcript.",
        },
      ],
      improvementAreas: result.improvementAreas ?? [
        {
          title: "Evaluation engagement",
          description:
            "More active participation needed for comprehensive evaluation.",
          evidence:
            "Current transcript provides insufficient data for detailed assessment.",
        },
      ],
      recommendation: result.recommendation,
      nextSteps: result.nextSteps ?? [
        {
          title: "Complete evaluation session",
          description:
            "Continue the evaluation process with more active engagement.",
          type: "assessment",
          priority: 1,
        },
      ],
    };
  } catch (error) {
    console.error("Evaluation analysis error:", error);

    // Return graceful fallback that maintains current progress
    return {
      summary:
        "Unable to analyze the evaluation session due to technical issues.",
      progressPercentage: progressPercentage, // Maintain current progress
      strengths: [
        {
          title: "Analysis unavailable",
          description:
            "Technical issue prevented proper analysis of strengths.",
          evidence: "System error occurred during transcript processing.",
        },
      ],
      improvementAreas: [
        {
          title: "Technical issue",
          description:
            "The system encountered an error while analyzing the transcript.",
          evidence: "Error during evaluation processing.",
        },
      ],
      nextSteps: [
        {
          title: "Retry evaluation",
          description: "Try again or contact support if the issue persists.",
          type: "assessment",
          priority: 1,
        },
      ],
    };
  }
};

/**
 * Fallback function to calculate progress when AI analysis fails
 */
export const calculateProgressFallback = (
  currentProgress: number,
  transcriptLength: number
): number => {
  const progressIncrement = Math.min(
    Math.floor(transcriptLength / 500), // ~1% per 500 chars
    25 // cap per session
  );

  return Math.min(currentProgress + progressIncrement, 100);
};
