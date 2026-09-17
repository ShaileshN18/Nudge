export type MentorInteractionType = "nudge" | "chat" | "debug" | "explain";

export interface TaskDefinition {
  _id?: string;
  order: number;
  title: string;
  description: string;
  goal?: string;
  targetFiles: string[];
  evaluationCriteria?: string[];
}

export interface ProjectFileContent { path: string; content: string; }
export interface EvaluationCriterion { title: string; passed: boolean; feedback?: string; }
export interface EvaluationResult { passed: boolean; criteriaStatus: EvaluationCriterion[]; overallFeedback?: string; }
export interface MentorMessage { id: string; role: "user" | "assistant"; content: string; timestamp: string; }
export interface HintRecord {
  id: string; level: number; concept: string; targetFile: string;
  startLine: number; endLine: number; text: string; timestamp: string;
}
export interface MentorAnnotation { targetFile: string; startLine: number; endLine: number; hint: string; concept?: string; isError?: boolean; }
export interface MentorContext {
  task: TaskDefinition; activeFile?: ProjectFileContent; relevantFiles: ProjectFileContent[];
  evaluation?: EvaluationResult | null; previousHints: HintRecord[]; conversation: MentorMessage[];
}
export interface MentorResponse {
  type: MentorInteractionType; message?: string; hint?: HintRecord; diagnosis?: string;
}
