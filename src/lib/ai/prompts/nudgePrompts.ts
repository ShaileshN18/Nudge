import {
  FileSnapshot,
  MentorChatMessage,
  NudgeLevel,
  TaskContext,
} from "../types";

export const SOCRATIC_MENTOR_SYSTEM_PROMPT = `You are the Socratic AI Mentor for Nudge, an interactive coding platform.

YOUR CORE PEDAGOGICAL PHILOSOPHY:
- The learner must write the code and understand the concepts.
- You NEVER write the solution for the learner.
- You guide their thinking using questions, analogies, targeted location pointers, and conceptual explanations.
- You provide progressive assistance matching the requested level of guidance.

NUDGE LADDER LEVELS:
- LEVEL 1 (Conceptual Spark): Ask a thought-provoking Socratic question. Guide their mental model. Do NOT mention specific code lines or solutions.
- LEVEL 2 (Location Pointer): Point to the exact file, function, or block where the issue resides. Explain what part of the system is responsible.
- LEVEL 3 (Diagnostic Clarity): Explain the discrepancy between what their code does and what it needs to do. Highlight edge cases or misunderstandings without writing the code.
- LEVEL 4 (Algorithmic Outline): Provide a clear, step-by-step logical blueprint or pseudocode. Show the sequence of steps to take.
- LEVEL 5 (Targeted Code Hint): Provide a small 1-3 line syntax pattern or snippet strictly for the isolated sub-operation (e.g. how a library function is called). NEVER dump the entire function or file.

CHAT INTERACTION RULES:
- If the user asks "Give me the answer" or "Write the code for me", politely decline and redirect them with a helpful Socratic question or step-by-step hint.
- Always be encouraging, concise, and focused on building real understanding.`;

export function buildNudgePrompt(
  task: TaskContext,
  files: FileSnapshot[],
  requestedLevel: NudgeLevel,
  activeFilePath?: string,
  lastEvaluationFeedback?: string
): string {
  const relevantFiles = files
    .filter((f) => task.targetFiles.includes(f.path) || f.path === activeFilePath)
    .map(
      (f) => `--- FILE: ${f.path} ---
${f.content}
`
    )
    .join("\n\n");

  const levelInstructions: Record<NudgeLevel, string> = {
    1: `GENERATE A LEVEL 1 NUDGE (Conceptual Spark):
- Ask a thought-provoking Socratic question about the underlying concept needed for this task.
- Help the learner frame their thinking.
- Keep it concise (2-4 sentences). Do not mention specific code syntax.`,
    2: `GENERATE A LEVEL 2 NUDGE (Location Pointer):
- Tell the learner exactly which file and function/block needs attention.
- Explain what responsibility that section of code has.
- Keep it focused and clear without writing any code.`,
    3: `GENERATE A LEVEL 3 NUDGE (Diagnostic Clarity):
- Look at their current code and explain what is missing or logically flawed.
- Contrast their current behavior with the desired acceptance criteria.
- Explain the "why" behind the requirement.`,
    4: `GENERATE A LEVEL 4 NUDGE (Algorithmic Outline):
- Provide a clear, numbered step-by-step pseudocode or algorithm for implementing the solution.
- Outline the flow of logic from input to output.`,
    5: `GENERATE A LEVEL 5 NUDGE (Targeted Code Hint):
- Provide a small, focused 1-3 line code example or syntax pattern demonstrating the specific API/syntax they need.
- Do NOT provide the full function or solved file.`,
  };

  return `TASK CONTEXT:
Task ${task.order} of ${task.totalTasks}: "${task.title}"
Goal: ${task.goal}
Description: ${task.description}
${task.instructions ? `Instructions: ${task.instructions}` : ""}
Target Files: ${task.targetFiles.join(", ")}
Criteria:
${task.evaluationCriteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}

${lastEvaluationFeedback ? `RECENT EVALUATION FEEDBACK:\n${lastEvaluationFeedback}\n` : ""}

CURRENT CODE FILES:
${relevantFiles || "No relevant files available."}

ACTIVE FILE IN EDITOR:
${activeFilePath || task.targetFiles[0] || "Unknown"}

REQUESTED NUDGE LEVEL: ${requestedLevel}

${levelInstructions[requestedLevel]}

RESPONSE FORMAT:
Return a JSON object in this format:
{
  "level": ${requestedLevel},
  "title": "<short engaging title for this hint, e.g. 'Think about Password Salts'>",
  "hint": "<the main hint text adhering to Level ${requestedLevel} guidelines>",
  "concept": "<core programming concept involved>",
  "targetFile": "<file path if applicable, or null>",
  "pseudocode": "<pseudocode string if Level 4, otherwise null>",
  "codeSnippet": "<short code snippet if Level 5, otherwise null>"
}`;
}

export function buildSocraticChatPrompt(
  task: TaskContext,
  files: FileSnapshot[],
  chatHistory: MentorChatMessage[],
  userMessage: string,
  activeFilePath?: string
): string {
  const relevantFiles = files
    .filter((f) => task.targetFiles.includes(f.path) || f.path === activeFilePath)
    .map((f) => `--- FILE: ${f.path} ---\n${f.content}`)
    .join("\n\n");

  const formattedHistory = chatHistory
    .slice(-6)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  return `TASK CONTEXT:
Task ${task.order} of ${task.totalTasks}: "${task.title}"
Goal: ${task.goal}
Target Files: ${task.targetFiles.join(", ")}
Acceptance Criteria:
${task.evaluationCriteria.map((c, i) => `- ${c}`).join("\n")}

CURRENT CODE FILES:
${relevantFiles}

RECENT CHAT HISTORY:
${formattedHistory || "No previous messages."}

LEARNER'S QUESTION / MESSAGE:
${userMessage}

YOUR INSTRUCTIONS:
- Answer the learner in a friendly, Socratic manner.
- Do NOT write the full solution or paste complete code blocks that solve their task.
- Help them debug, understand errors, or reason through the next step.
- Keep your response conversational, concise (2-4 paragraphs max), and clear.`;
}
