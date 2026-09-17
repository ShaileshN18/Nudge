import { buildMentorContext } from "@/lib/ai/context/buildContext";
import type { EvaluationResult, ProjectFileContent, TaskDefinition } from "@/lib/ai/types";

export async function evaluateTask(task: TaskDefinition, files: ProjectFileContent[], activeFilePath?: string): Promise<EvaluationResult> {
  const context = buildMentorContext({ task, files, activeFilePath });
  const response = await fetch("/api/ai/evaluate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ context }) });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.error || "Evaluation failed");
  return data.evaluation;
}
