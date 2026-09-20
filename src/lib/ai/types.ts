export type EvaluationStatus = "pass" | "fail" | "uncertain";

export interface CriterionResult {
  title: string;
  status: EvaluationStatus;
  evidence?: string;
  feedback?: string;
}

export interface EvaluationResult {
  status: EvaluationStatus;
  score: number;
  criteriaResults: CriterionResult[];
  overallFeedback: string;
  bugs?: string[];
  missingRequirements?: string[];
  conceptualIssues?: string[];
  nextStep?: string;
  shouldAskForNudge?: boolean;
}

export type NudgeLevel = 1 | 2 | 3 | 4 | 5;

export interface NudgeLevelInfo {
  level: NudgeLevel;
  name: string;
  description: string;
}

export const NUDGE_LEVELS: Record<NudgeLevel, NudgeLevelInfo> = {
  1: {
    level: 1,
    name: "Conceptual Spark",
    description: "Socratic orientation and foundational conceptual questions",
  },
  2: {
    level: 2,
    name: "Location Pointer",
    description: "Points to the specific file, function, or block needing attention",
  },
  3: {
    level: 3,
    name: "Diagnostic Clarity",
    description: "Explains the logical discrepancy or missing requirement",
  },
  4: {
    level: 4,
    name: "Algorithmic Outline",
    description: "Step-by-step pseudocode or logical blueprint",
  },
  5: {
    level: 5,
    name: "Targeted Code Hint",
    description: "A focused 1-3 line code example or syntax pattern",
  },
};

export interface NudgeResponse {
  level: NudgeLevel;
  levelName: string;
  title: string;
  hint: string;
  concept?: string;
  targetFile?: string;
  pseudocode?: string;
  codeSnippet?: string;
  nextLevelAvailable: boolean;
}

export interface MentorChatMessage {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

export interface FileSnapshot {
  path: string;
  content: string;
}

export interface TaskContext {
  id?: string;
  order: number;
  totalTasks: number;
  title: string;
  description: string;
  instructions?: string;
  goal: string;
  targetFiles: string[];
  evaluationCriteria: string[];
  concepts?: string[];
  difficulty?: string;
}
