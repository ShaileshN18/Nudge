/**
 * Project-Agnostic AI Context Selection System.
 */

export interface TargetFileContent {
  path: string;
  content: string;
}

export interface TaskContextInput {
  order?: number;
  title?: string;
  goal?: string;
  description?: string;
  targetFiles: string[];
  evaluationCriteria?: string[];
}

export interface ProjectContextInput {
  title?: string;
  description?: string;
  track?: string;
}

export interface AIContext {
  taskOrder: number;
  taskTitle: string;
  goal: string;
  description: string;
  targetFiles: string[];
  evaluationCriteria: string[];
  files: TargetFileContent[];
}
