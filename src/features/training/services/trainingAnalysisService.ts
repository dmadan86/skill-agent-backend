// src/features/training/services/analysisService.ts
import OpenAI from "openai";
import config from "../../../shared/config";
import logger from "../../../shared/utils/logger";

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

// Define interfaces that match with our updated model structure
interface ITopicCovered {
  name: string;
  comprehensionLevel: "basic" | "intermediate" | "advanced";
  evidence: string;
}

interface IConceptUnderstood {
  name: string;
  evidence: string;
  applicationContext?: string;
}

interface ILearningGap {
  topic: string;
  description: string;
  recommendedAction: string;
}

interface INextLearningStep {
  title: string;
  description: string;
  type:
    | "concept_reinforcement"
    | "practical_application"
    | "knowledge_extension"
    | "assessment";
  priority: number;
}

export interface AnalysisResult {
  summary: string;
  progressPercentage: number;
  topicsCovered: ITopicCovered[];
  conceptsUnderstood: IConceptUnderstood[];
  learningGaps?: ILearningGap[];
  nextLearningSteps?: INextLearningStep[];
}

export const analyzeTrainingTranscript = async (
  transcript: string,
  agentContent: string,
  previousSummary: string | null = null,
  progressPercentage: number = 0
): Promise<AnalysisResult> => {
  try {
    // First, check if transcript has enough content for analysis
    if (!transcript || transcript.trim().length < 200) {
      return {
        summary: "Insufficient interaction for meaningful analysis.",
        progressPercentage: progressPercentage, // Maintain current progress
        topicsCovered: [],
        conceptsUnderstood: [],
        learningGaps: [
          {
            topic: "Training engagement",
            description:
              "Not enough meaningful interaction was detected to assess progress.",
            recommendedAction:
              "Complete a full training session with active participation.",
          },
        ],
        nextLearningSteps: [
          {
            title: "Begin training session",
            description:
              "Start the training process with active participation and engagement.",
            type: "concept_reinforcement",
            priority: 1,
          },
        ],
      };
    }

    // Detect potential fraud/gaming patterns
    const knowledgeClaimPatterns = [
      /I (already )?know (all|everything|this)/i,
      /I('m| am) (an expert|knowledgeable|familiar)/i,
      /I understand (all|everything|this)/i,
      /(very|quite) experienced/i,
    ];

    const containsKnowledgeClaims = knowledgeClaimPatterns.some((pattern) =>
      pattern.test(transcript)
    );

    // Check for verification of claimed knowledge
    const verificationPatterns = [
      /can you explain/i,
      /how would you/i,
      /demonstrate your understanding/i,
      /give an example/i,
      /prove that/i,
    ];

    const containsVerificationRequests = verificationPatterns.some((pattern) =>
      pattern.test(transcript)
    );

    const transcriptBase64 = Buffer.from(transcript).toString("base64");
    const transcriptData = `data:application/pdf;base64,${transcriptBase64}`;

    // Concise, human-like prompt with critical safeguards
    const prompt = `
# Training Analysis Guidelines

I need your honest assessment of this training session. This is IMPORTANT to me, as inflated progress metrics hurt our platform's credibility.

## What you're working with:

CONTENT FROM TRAINING: 
${agentContent}

PREVIOUS SUMMARY: 
${previousSummary ?? "None available"}

CURRENT PROGRESS: ${progressPercentage}%

## Critical rules I need you to follow:

1. EVIDENCE IS EVERYTHING. Don't give credit for claimed knowledge without proof in the transcript!

2. REAL PROGRESS REQUIRES:
   • Below 30% → Basic concept explanations
   • 30-50% → Applied examples of concepts
   • 50-70% → Integration of multiple concepts
   • 70-100% → Advanced synthesis/evaluation

3. SHORT SESSIONS HAVE LIMITS:
   • Under 300 words → Max 15% progress
   • 300-800 words → Max 30% progress 
   • 800-1500 words → Max 60% progress

4. NEVER DECREASE PROGRESS. Start from ${progressPercentage}% and only increase if warranted by evidence.

5. WARNING SIGNS (Cap progress at 10% if present):
   - User claims expertise without demonstration
   - User says "I know everything" without proving it
   - User gives minimal/generic responses

${
  containsKnowledgeClaims && !containsVerificationRequests
    ? `⚠️ ALERT: User claims knowledge without verification in this transcript!
- Do NOT award progress for unverified claims
- Maximum 10% progress increase if knowledge isn't demonstrated`
    : ""
}

## Required JSON format:

{
  "summary": string,              // 100-150 words exactly
  "progressPercentage": integer,  // Must be ≥ ${progressPercentage} must be equal to or greater than the current progress percentage
  "topicsCovered": [              // Only include topics with evidence
    {
      "name": string,             
      "comprehensionLevel": string, // "basic", "intermediate", or "advanced"
      "evidence": string           
    }
  ],
  "conceptsUnderstood": [         // Only include concepts with evidence
    {
      "name": string,             
      "evidence": string,         
      "applicationContext": string // Optional
    }
  ],
  "learningGaps": [               // 2-4 gaps
    {
      "topic": string,            
      "description": string,      
      "recommendedAction": string 
    }
  ],
  "nextLearningSteps": [          // 3-4 steps
    {
      "title": string,            
      "description": string,      
      "type": string,             // Use one of the required step types
      "priority": integer         // 1-3 (1=highest)
    }
  ]
}

Remember, honest assessment protects the integrity of our training platform. Only award progress when truly earned.
`;

    // API call
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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

    // Process API response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    // Parse and validate the response
    const result = JSON.parse(content);
    if (!result.summary || typeof result.progressPercentage !== "number") {
      throw new Error("Invalid response format from OpenAI");
    }

    // Code-level safeguards: transcript length enforcement
    const wordCount = transcript.split(/\s+/).length;
    logger.debug(`wordcount: ${wordCount}, progressPercentage: ${result.progressPercentage}`)
    // Calculate maximum allowed progress increase
    let maxProgressIncrease = 100;
    if (wordCount < 100) {
      maxProgressIncrease = 5;
    } else if (wordCount < 600) {
      maxProgressIncrease = 30;
    } else if (wordCount < 1500) {
      maxProgressIncrease = 60;
    }

    // Additional penalty for knowledge claims without verification
    if (containsKnowledgeClaims && !containsVerificationRequests) {
      maxProgressIncrease = Math.min(maxProgressIncrease, 10);
    }

    // Apply safeguards while ensuring progress never decreases
    const cappedProgress = Math.max(
      progressPercentage,
      Math.min(
        result.progressPercentage,
        progressPercentage + maxProgressIncrease
      )
    );

    // Normalize and return result with enforced progress cap
    return {
      summary: result.summary,
      progressPercentage: cappedProgress,
      topicsCovered: (result.topicsCovered ?? []).map((topic: any) => ({
        name: topic.name,
        comprehensionLevel: ["basic", "intermediate", "advanced"].includes(
          topic.comprehensionLevel
        )
          ? topic.comprehensionLevel
          : "basic",
        evidence: topic.evidence ?? "",
      })),
      conceptsUnderstood: (result.conceptsUnderstood ?? []).map(
        (concept: any) => ({
          name: concept.name ?? concept,
          evidence: concept.evidence ?? "",
          applicationContext: concept.applicationContext ?? undefined,
        })
      ),
      learningGaps: (result.learningGaps ?? []).map((gap: any) => ({
        topic: gap.topic,
        description: gap.description,
        recommendedAction: gap.recommendedAction,
      })),
      nextLearningSteps: (result.nextLearningSteps ?? []).map((step: any) => ({
        title: step.title,
        description: step.description,
        type: [
          "concept_reinforcement",
          "practical_application",
          "knowledge_extension",
          "assessment",
        ].includes(step.type)
          ? step.type
          : "concept_reinforcement",
        priority: Math.min(Math.max(step.priority ?? 2, 1), 3),
      })),
    };
  } catch (error) {
    // Error handling with fallback to maintain current progress
    console.error("Analysis error:", error);

    // On error, return current progress instead of failing
    return {
      summary:
        "Unable to analyze the training session due to technical issues.",
      progressPercentage: progressPercentage, // Maintain current progress
      topicsCovered: [],
      conceptsUnderstood: [],
      learningGaps: [
        {
          topic: "Technical issue",
          description:
            "The system encountered an error while analyzing the transcript.",
          recommendedAction:
            "Please try again or contact support if the issue persists.",
        },
      ],
      nextLearningSteps: [
        {
          title: "Continue training",
          description: "Resume your training where you left off.",
          type: "concept_reinforcement",
          priority: 1,
        },
      ],
    };
  }
};

/**
 * Helper function to convert new structured format back to legacy string format if needed
 * This provides backward compatibility with existing frontend components
 */
export const convertToLegacyFormat = (
  analysisResult: AnalysisResult
): {
  summary: string;
  progressPercentage: number;
  topicsCovered: string[];
  conceptsUnderstood: string[];
} => {
  return {
    summary: analysisResult.summary,
    progressPercentage: analysisResult.progressPercentage,
    topicsCovered: analysisResult.topicsCovered.map((topic) => topic.name),
    conceptsUnderstood: analysisResult.conceptsUnderstood.map((concept) =>
      typeof concept === "string" ? concept : concept.name
    ),
  };
};

/**
 * Fallback function to calculate progress when AI analysis fails
 */
export const calculateProgressFallback = (
  currentProgress: number,
  transcriptLength: number
): number => {
  const progressIncrement = Math.min(
    Math.floor(transcriptLength / 500), // About 1% per 500 characters
    20 // Cap at 20% increment per session
  );

  return Math.min(currentProgress + progressIncrement, 100);
};
