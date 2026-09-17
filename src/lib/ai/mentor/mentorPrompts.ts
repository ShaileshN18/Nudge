import type { MentorContext, MentorInteractionType } from "@/lib/ai/types";

export function buildMentorPrompt(type: MentorInteractionType, context: MentorContext, level: number, message?: string) {
  const files = context.relevantFiles.map((f) => `--- ${f.path} ---\n${f.content}`).join("\n\n");
  const evaluation = context.evaluation ? JSON.stringify(context.evaluation) : "No evaluation has been run.";
  return `You are a Socratic coding mentor. Do not provide a complete implementation.\nTask: ${context.task.title}\nGoal: ${context.task.goal || context.task.description}\nCriteria: ${(context.task.evaluationCriteria || []).join(" | ")}\nInteraction: ${type}\nRequested level: ${level} (1 conceptual, 2 relevant location, 3 specific area, 4 near-solution guidance).\nLatest evaluation: ${evaluation}\nStudent question: ${message || "None"}\nRelevant files:\n${files}\nReturn JSON only. For nudge/debug return {"message":"...","hint":{"concept":"...","targetFile":"...","startLine":1,"endLine":1,"text":"..."}}. For chat/explain return {"message":"..."}. Line numbers must be valid for the named file.`;
}
