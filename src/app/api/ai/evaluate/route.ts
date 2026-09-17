import { NextResponse } from "next/server";
import { geminiProvider } from "@/lib/ai/providers/gemini";
import type { EvaluationResult, MentorContext } from "@/lib/ai/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { context } = await request.json() as { context?: MentorContext };
    if (!context?.task?.title) return NextResponse.json({ error: "Task context is required for evaluation." }, { status: 400 });
    const hasCode = context.relevantFiles.some((file) => file.content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "").trim().length > 20);
    if (!hasCode) return NextResponse.json({ success: true, evaluation: { passed: false, overallFeedback: "No code implementation found in the relevant task files.", criteriaStatus: (context.task.evaluationCriteria || []).map((title) => ({ title, passed: false, feedback: "Target file is empty or contains no code." })) } });
    const prompt = `You are a strict, pedagogical evaluator. Evaluate only the provided task context. A task passes only when every criterion passes. Return JSON only: {"passed":boolean,"overallFeedback":"string","criteriaStatus":[{"title":"criterion exactly","passed":boolean,"feedback":"specific feedback"}]}.\nTask: ${context.task.title}\nGoal: ${context.task.goal || context.task.description}\nCriteria: ${(context.task.evaluationCriteria || []).join(" | ")}\nFiles:\n${context.relevantFiles.map((file) => `--- ${file.path} ---\n${file.content}`).join("\n\n")}`;
    const result = await geminiProvider.generateJson<EvaluationResult>(prompt, { temperature: 0.1, maxOutputTokens: 2500 });
    const criteriaStatus = (result.criteriaStatus || []).map((item) => ({ title: item.title, passed: item.passed === true, feedback: item.feedback || "" }));
    return NextResponse.json({ success: true, evaluation: { passed: criteriaStatus.length > 0 && criteriaStatus.every((item) => item.passed), criteriaStatus, overallFeedback: result.overallFeedback || "Evaluation completed." } });
  } catch (error: any) {
    console.error("Evaluation request failed:", error);
    return NextResponse.json({ error: error?.message || "Unable to evaluate task." }, { status: 500 });
  }
}
