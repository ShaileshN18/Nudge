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
