"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { EvaluationResult, HintRecord, MentorAnnotation, MentorInteractionType, MentorMessage, ProjectFileContent, TaskDefinition } from "@/lib/ai/types";

export interface MentorState { sessionId: string; messages: MentorMessage[]; hints: HintRecord[]; activeAnnotation: MentorAnnotation | null; evaluation: EvaluationResult | null; isThinking: boolean; error: string | null; }

export function useMentor({ task, projectId, files, activeFilePath, evaluation }: { task: TaskDefinition; projectId: string; files: ProjectFileContent[]; activeFilePath?: string; evaluation: EvaluationResult | null }) {
  const taskKey = task._id || `${task.order}:${task.title}`;
  const sessionId = useMemo(() => `${projectId}:${taskKey}`, [projectId, taskKey]);
  const [state, setState] = useState<MentorState>({ sessionId, messages: [], hints: [], activeAnnotation: null, evaluation, isThinking: false, error: null });

  useEffect(() => { setState({ sessionId, messages: [], hints: [], activeAnnotation: null, evaluation, isThinking: false, error: null }); }, [sessionId]);
  useEffect(() => setState((current) => ({ ...current, evaluation })), [evaluation]);

  const request = useCallback(async (type: MentorInteractionType, message?: string) => {
    const userMessage: MentorMessage | null = message ? { id: crypto.randomUUID(), role: "user", content: message, timestamp: new Date().toISOString() } : null;
    setState((current) => ({ ...current, isThinking: true, error: null, messages: userMessage ? [...current.messages, userMessage] : current.messages }));
    try {
      const response = await fetch("/api/ai/mentor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, type, message, task, files, activeFilePath, evaluation: state.evaluation, previousHints: state.hints, conversation: state.messages }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Mentor request failed");
      setState((current) => {
        const hint = data.mentor.hint as HintRecord | undefined;
        const assistant = data.mentor.message ? { id: crypto.randomUUID(), role: "assistant" as const, content: data.mentor.message, timestamp: new Date().toISOString() } : null;
        return { ...current, isThinking: false, hints: hint ? [...current.hints, hint] : current.hints, activeAnnotation: hint ? { targetFile: hint.targetFile, startLine: hint.startLine, endLine: hint.endLine, hint: hint.text, concept: hint.concept } : current.activeAnnotation, messages: assistant ? [...current.messages, assistant] : current.messages };
      });
    } catch (error: any) { setState((current) => ({ ...current, isThinking: false, error: error?.message || "Unable to reach AI Mentor." })); }
  }, [activeFilePath, evaluation, files, sessionId, state.evaluation, state.hints, state.messages, task]);

  return { state, requestNudge: () => request("nudge"), sendMessage: (message: string) => request("chat", message), clearAnnotation: () => setState((current) => ({ ...current, activeAnnotation: null })), clearMessages: () => setState((current) => ({ ...current, messages: [] })) };
}
