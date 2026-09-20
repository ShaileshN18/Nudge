import { FileSnapshot, TaskContext } from "../types";

export const EVALUATOR_SYSTEM_PROMPT = `You are the Static Code Evaluation Engine for Nudge, an interactive coding learning platform.

Your primary duty is to perform rigorous, static code analysis on the learner's submitted source files against the task's explicit acceptance criteria.

CRITICAL OPERATIONAL RULES:
1. STATIC ANALYSIS ONLY: You do NOT execute the code. You analyze its AST structure, logic flow, exports, function implementations, error handlers, status codes, and API signatures statically. Do not pretend you ran unit tests.
2. OBJECTIVE CRITERIA EVALUATION: Evaluate EACH provided criterion independently.
   - Assign "pass" ONLY if the code clearly and correctly implements the requirement.
   - Assign "fail" if the code is missing the logic, contains bugs, returns wrong data/status, or fails to fulfill the requirement.
   - Assign "uncertain" if the code is ambiguous or partially written.
3. OVERALL STATUS:
   - "pass": Set ONLY if ALL criteria have status "pass".
   - "fail": Set if ANY criterion has status "fail" or "uncertain".
4. PEDAGOGICAL TONE: Feedback must be constructive, precise, and educational.
   - Identify bugs and conceptual mistakes clearly.
   - Explain WHY something is incorrect.
   - DO NOT dump the complete working solution into the feedback. Point the learner to what to fix.
5. STRICT JSON OUTPUT: Return ONLY a valid JSON object matching the requested schema. Do not enclose in markdown ticks if possible, or return strictly valid parseable JSON.`;

export function buildEvaluatorPrompt(
  task: TaskContext,
  files: FileSnapshot[]
): string {
  const targetFilesContent = files
    .filter((f) => task.targetFiles.includes(f.path) || files.length <= 6)
    .map(
      (f) => `--- FILE: ${f.path} ---
${f.content}
`
    )
    .join("\n\n");

  const criteriaList = task.evaluationCriteria
    .map((c, i) => `${i + 1}. ${c}`)
    .join("\n");

  return `TASK CONTEXT:
Task ${task.order} of ${task.totalTasks}: "${task.title}"
Goal: ${task.goal}

Task Description:
${task.description}

Task Instructions:
${task.instructions || "Follow the task goal and implement the required functionality."}

Target Files:
${task.targetFiles.join(", ")}

EXPLICIT ACCEPTANCE CRITERIA TO EVALUATE:
${criteriaList}

LEARNER'S CURRENT SOURCE FILES:
${targetFilesContent}

INSTRUCTIONS FOR YOUR JSON RESPONSE:
Analyze the learner's code against EVERY acceptance criterion listed above.
Respond with a JSON object in this EXACT format:
{
  "status": "pass" | "fail",
  "score": <number from 0 to 100>,
  "criteriaResults": [
    {
      "title": "<exact acceptance criterion text>",
      "status": "pass" | "fail" | "uncertain",
      "evidence": "<specific lines, function names, or reasoning from the code>",
      "feedback": "<clear explanation of why it passed or failed>"
    }
  ],
  "overallFeedback": "<1-3 sentences summarizing the learner's progress and remaining work>",
  "bugs": [
    "<specific logical bug or syntax issue found, if any>"
  ],
  "missingRequirements": [
    "<specific requirement from criteria that has not yet been implemented, if any>"
  ],
  "conceptualIssues": [
    "<conceptual misunderstanding evident in the code, if any>"
  ],
  "nextStep": "<one clear, actionable recommendation for what the learner should do next>",
  "shouldAskForNudge": <true if failed or struggling, false if passed>
}`;
}
