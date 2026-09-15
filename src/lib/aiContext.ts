/**
 * Project-Agnostic AI Context Selection System.
 *
 * Takes task metadata and the target files read directly from the student's
 * live WebContainer runtime (the single source of truth).
 * Contains ZERO project-specific strings, hardcoded paths, or stack assumptions.
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

/**
 * Builds the minimal, targeted AI context for evaluator or mentor.
 * ONLY includes the target files supplied from the WebContainer runtime.
 * Never includes unrelated workspace files.
 */
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

/**
 * Normalizes file content, collapses excessive blank lines, and caps line count for token efficiency.
 */
export function cleanFileContent(content: string, maxLines = 350): string {
  if (!content) return "";
  const normalized = content.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const lines = normalized.split("\n");
  if (lines.length > maxLines) {
    return (
      lines.slice(0, maxLines).join("\n") +
      `\n// ... [truncated ${lines.length - maxLines} lines for token efficiency]`
    );
  }
  return normalized;
}

/**
 * Robust JSON parser for AI model responses.
 * Handles markdown code fences, preambles/postambles, and extracts outermost JSON object or array.
 */
export function extractAndParseJson<T = any>(text: string): T {
  if (!text || typeof text !== "string") {
    throw new Error("Empty response text from AI model");
  }

  const trimmed = text.trim();

  // 1. Direct parse attempt
  try {
    return JSON.parse(trimmed);
  } catch {}

  // 2. Strip markdown code fences (```json ... ``` or ``` ...)
  const stripped = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(stripped);
  } catch {}

  // 3. Extract outermost JSON object { ... }
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = text.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {}
  }

  // 4. Extract outermost JSON array [ ... ]
  const firstBracket = text.indexOf("[");
  const lastBracket = text.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const candidate = text.slice(firstBracket, lastBracket + 1);
    try {
      return JSON.parse(candidate);
    } catch {}
  }

  throw new Error("Invalid JSON structure in model response");
}
