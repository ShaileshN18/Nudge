import {
  FileSnapshot,
  MentorChatMessage,
  NudgeLevel,
  NUDGE_LEVELS,
  NudgeResponse,
  TaskContext,
} from "./types";
import {
  buildNudgePrompt,
  buildSocraticChatPrompt,
  SOCRATIC_MENTOR_SYSTEM_PROMPT,
} from "./prompts/nudgePrompts";
import { extractJsonFromResponse } from "./evaluatorService";

export function normalizeNudgeResponse(
  rawJson: any,
  requestedLevel: NudgeLevel
): NudgeResponse {
  const levelInfo = NUDGE_LEVELS[requestedLevel];

  return {
    level: requestedLevel,
    levelName: levelInfo.name,
    title:
      typeof rawJson.title === "string" && rawJson.title.trim()
        ? rawJson.title.trim()
        : `${levelInfo.name} Hint`,
    hint:
      typeof rawJson.hint === "string" && rawJson.hint.trim()
        ? rawJson.hint.trim()
        : "Reflect on how your code handles inputs and state for this task.",
    concept:
      typeof rawJson.concept === "string" ? rawJson.concept.trim() : undefined,
    targetFile:
      typeof rawJson.targetFile === "string"
        ? rawJson.targetFile.trim()
        : undefined,
    pseudocode:
      typeof rawJson.pseudocode === "string"
        ? rawJson.pseudocode.trim()
        : undefined,
    codeSnippet:
      typeof rawJson.codeSnippet === "string"
        ? rawJson.codeSnippet.trim()
        : undefined,
    nextLevelAvailable: requestedLevel < 5,
  };
}

/**
 * Provides offline/baseline progressive nudges for default curriculum tasks.
 */
export function getBaselineProgressiveNudge(
  task: TaskContext,
  level: NudgeLevel
): NudgeResponse {
  const levelInfo = NUDGE_LEVELS[level];

  const genericHints: Record<NudgeLevel, { title: string; hint: string; pseudocode?: string; snippet?: string }> = {
    1: {
      title: "Consider the Core Requirement",
      hint: `What is the single most important output or side-effect required by "${task.title}"? Think about what inputs you receive and what exact data structure or HTTP status should be returned.`,
    },
    2: {
      title: "Inspect Target File",
      hint: `Take a close look at ${task.targetFiles.join(" and ")}. Locate the function or route handler marked for this task and check the parameter list and return value.`,
    },
    3: {
      title: "Check Missing Conditions",
      hint: `Ensure all acceptance criteria are met: ${task.evaluationCriteria.join("; ")}. Check error cases, parameter validations, and status codes.`,
    },
    4: {
      title: "Logical Flow",
      hint: "Follow these step-by-step phases to complete the task:",
      pseudocode: `1. Validate incoming input parameters\n2. If invalid, return early with appropriate error code\n3. Execute core logic or transformation\n4. Return expected result and status`,
    },
    5: {
      title: "Key Syntax Pattern",
      hint: "Here is a targeted syntax structure to help unblock you:",
      snippet: `// Verify parameters\nif (!param) return res.status(400).json({ error: "Missing parameter" });\n// Execute operation\nreturn res.status(200).json({ success: true, data });`,
    },
  };

  const selected = genericHints[level];

  return {
    level,
    levelName: levelInfo.name,
    title: selected.title,
    hint: selected.hint,
    concept: task.concepts?.[0] || "Software Engineering Principles",
    targetFile: task.targetFiles[0],
    pseudocode: selected.pseudocode,
    codeSnippet: selected.snippet,
    nextLevelAvailable: level < 5,
  };
}

export {
  buildNudgePrompt,
  buildSocraticChatPrompt,
  SOCRATIC_MENTOR_SYSTEM_PROMPT,
  extractJsonFromResponse,
};
