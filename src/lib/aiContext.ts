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

export function buildAIContext(
  task: TaskContextInput,
  targetFilesContent: TargetFileContent[],
  _project?: ProjectContextInput | null
): AIContext {
  const normalizedFiles = (targetFilesContent || []).map((file) => ({
    path: file.path.replace(/^\/+/, ""),
    content: (file.content || "")
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  }));

  return {
    taskOrder: task.order || 1,
    taskTitle: task.title || "Current Task",
    goal: task.goal || task.description || "",
    description: task.description || "",
    targetFiles: task.targetFiles || [],
    evaluationCriteria: task.evaluationCriteria || [],
    files: normalizedFiles,
  };
}
