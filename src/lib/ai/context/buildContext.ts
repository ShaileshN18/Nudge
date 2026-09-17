import type { MentorContext, MentorMessage, HintRecord, EvaluationResult, ProjectFileContent, TaskDefinition } from "@/lib/ai/types";
import { selectRelevantFiles } from "./selectFiles";

export function cleanFileContent(content: string, maxLines = 350) {
  const lines = (content || "").replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim().split("\n");
  return lines.length > maxLines ? `${lines.slice(0, maxLines).join("\n")}\n// ... [truncated]` : lines.join("\n");
}

export function buildMentorContext(input: {
  task: TaskDefinition; files: ProjectFileContent[]; activeFilePath?: string;
  evaluation?: EvaluationResult | null; previousHints?: HintRecord[]; conversation?: MentorMessage[];
}): MentorContext {
  const relevantFiles = selectRelevantFiles(input.task, input.files, input.activeFilePath)
    .map((file) => ({ ...file, path: file.path.replace(/^\/+/, ""), content: cleanFileContent(file.content) }));
  const activeFile = relevantFiles.find((file) => file.path === input.activeFilePath?.replace(/^\/+/, ""));
  return { task: input.task, activeFile, relevantFiles, evaluation: input.evaluation || null,
    previousHints: input.previousHints || [], conversation: input.conversation || [] };
}
