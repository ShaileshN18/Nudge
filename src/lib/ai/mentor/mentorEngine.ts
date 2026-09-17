import type { HintRecord, MentorContext, MentorInteractionType, MentorResponse } from "@/lib/ai/types";
import { geminiProvider } from "@/lib/ai/providers/gemini";
import { chooseHintLevel } from "./mentorPolicy";
import { buildMentorPrompt } from "./mentorPrompts";

export async function runMentor(type: MentorInteractionType, context: MentorContext, message?: string): Promise<MentorResponse> {
  const level = chooseHintLevel(context);
  const raw = await geminiProvider.generateJson<{ message?: string; hint?: Omit<HintRecord, "id" | "level" | "timestamp"> }>(buildMentorPrompt(type, context, level, message));
  const target = raw.hint?.targetFile || context.activeFile?.path || context.task.targetFiles[0] || "";
  const line = Math.max(1, Math.floor(raw.hint?.startLine || 1));
  return { type, message: raw.message || "Consider the task requirements and the highlighted area.", hint: raw.hint ? { id: crypto.randomUUID(), level, concept: raw.hint.concept || "Implementation detail", targetFile: target, startLine: line, endLine: Math.max(line, Math.floor(raw.hint.endLine || line)), text: raw.hint.text || raw.message || "Inspect this area.", timestamp: new Date().toISOString() } : undefined };
}
