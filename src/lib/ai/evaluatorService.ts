import {
  CriterionResult,
  EvaluationResult,
  FileSnapshot,
  TaskContext,
} from "./types";
import {
  buildEvaluatorPrompt,
  EVALUATOR_SYSTEM_PROMPT,
} from "./prompts/evaluatorPrompts";

/**
 * Robustly parses JSON from LLM output, stripping markdown code fences if present.
 */
export function extractJsonFromResponse(rawText: string): any {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Empty response from evaluation engine");
  }

  let cleaned = rawText.trim();

  // Strip ```json ... ``` or ``` ... ```
  if (cleaned.startsWith("```")) {
    const firstNewline = cleaned.indexOf("\n");
    if (firstNewline !== -1) {
      cleaned = cleaned.substring(firstNewline + 1);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.lastIndexOf("```"));
    }
  }

  cleaned = cleaned.trim();

  // Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch {
    // Attempt regex match for the largest outermost JSON block
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (innerErr: any) {
        throw new Error(
          `Failed to parse evaluation JSON: ${innerErr.message}\nRaw: ${cleaned.slice(0, 200)}...`
        );
      }
    }
    throw new Error("No valid JSON structure found in evaluator response");
  }
}

/**
 * Normalizes and validates the evaluation result structure.
 */
export function normalizeEvaluationResult(
  data: any,
  task: TaskContext
): EvaluationResult {
  const criteriaResults: CriterionResult[] = [];
  const taskCriteria = task.evaluationCriteria || [];

  if (Array.isArray(data.criteriaResults)) {
    for (let i = 0; i < taskCriteria.length; i++) {
      const critTitle = taskCriteria[i];
      const match = data.criteriaResults.find(
        (cr: any) =>
          cr.title?.toLowerCase().includes(critTitle.toLowerCase().slice(0, 15)) ||
          critTitle.toLowerCase().includes(cr.title?.toLowerCase().slice(0, 15))
      ) || data.criteriaResults[i];

      if (match) {
        criteriaResults.push({
          title: critTitle,
          status:
            match.status === "pass"
              ? "pass"
              : match.status === "uncertain"
              ? "uncertain"
              : "fail",
          evidence: String(match.evidence || ""),
          feedback: String(match.feedback || ""),
        });
      } else {
        criteriaResults.push({
          title: critTitle,
          status: "fail",
          feedback: "Criterion was not fulfilled.",
        });
      }
    }
  } else {
    for (const critTitle of taskCriteria) {
      criteriaResults.push({
        title: critTitle,
        status: data.status === "pass" ? "pass" : "fail",
        feedback: data.overallFeedback || "Evaluated against task requirements.",
      });
    }
  }

  // Determine overall status strictly: All criteria must pass
  const allPassed =
    criteriaResults.length > 0 &&
    criteriaResults.every((c) => c.status === "pass");

  const overallStatus = allPassed ? "pass" : "fail";
  const passCount = criteriaResults.filter((c) => c.status === "pass").length;
  const computedScore =
    criteriaResults.length > 0
      ? Math.round((passCount / criteriaResults.length) * 100)
      : data.score || 0;

  return {
    status: overallStatus,
    score: typeof data.score === "number" ? data.score : computedScore,
    criteriaResults,
    overallFeedback:
      typeof data.overallFeedback === "string" && data.overallFeedback.trim()
        ? data.overallFeedback.trim()
        : allPassed
        ? "Excellent work! All acceptance criteria for this task have been satisfied."
        : "Some requirements have not been fully satisfied. Review the criteria feedback and refine your implementation.",
    bugs: Array.isArray(data.bugs) ? data.bugs.map(String).filter(Boolean) : [],
    missingRequirements: Array.isArray(data.missingRequirements)
      ? data.missingRequirements.map(String).filter(Boolean)
      : [],
    conceptualIssues: Array.isArray(data.conceptualIssues)
      ? data.conceptualIssues.map(String).filter(Boolean)
      : [],
    nextStep:
      typeof data.nextStep === "string" && data.nextStep.trim()
        ? data.nextStep.trim()
        : allPassed
        ? "Advance to the next task in your curriculum."
        : "Address the failing criteria and test your code logic again.",
    shouldAskForNudge: !allPassed,
  };
}

/**
 * Performs rule-based static heuristic analysis as an ultra-fast baseline or offline fallback.
 */
export function runStaticHeuristicEvaluation(
  task: TaskContext,
  files: FileSnapshot[]
): EvaluationResult {
  const criteriaResults: CriterionResult[] = [];
  const targetFilesContent = files
    .filter((f) => task.targetFiles.includes(f.path))
    .map((f) => f.content)
    .join("\n");

  for (const criterion of task.evaluationCriteria) {
    const critLower = criterion.toLowerCase();
    let passed = false;
    let evidence = "";

    // Heuristic pattern checks
    if (critLower.includes("hashpassword") || critLower.includes("hash password")) {
      passed =
        targetFilesContent.includes("crypto.pbkdf2Sync") ||
        targetFilesContent.includes("crypto.randomBytes") ||
        targetFilesContent.includes("bcrypt");
      evidence = passed
        ? "Found cryptographic hashing implementation"
        : "Missing cryptographic hash function in User model";
    } else if (critLower.includes("comparepassword") || critLower.includes("verify matching")) {
      passed =
        targetFilesContent.includes("comparePassword") &&
        (targetFilesContent.includes("split(':')") || targetFilesContent.includes("split(\":\")") || targetFilesContent.includes("pbkdf2Sync"));
      evidence = passed
        ? "Found password comparison logic with salt extraction"
        : "comparePassword logic incomplete or missing salt verification";
    } else if (critLower.includes("register") && critLower.includes("400")) {
      passed =
        targetFilesContent.includes("400") &&
        (targetFilesContent.includes("!name") ||
          targetFilesContent.includes("!email") ||
          targetFilesContent.includes("!password") ||
          targetFilesContent.includes("findUserByEmail"));
      evidence = passed
        ? "Validation and 400 Bad Request status found in register handler"
        : "Missing input validation or duplicate check in register";
    } else if (critLower.includes("login") && (critLower.includes("401") || critLower.includes("token"))) {
      passed =
        targetFilesContent.includes("401") &&
        (targetFilesContent.includes("comparePassword") || targetFilesContent.includes("generateToken"));
      evidence = passed
        ? "Found credential check with 401 response and token generation"
        : "Missing credential verification or 401 Unauthorized handling in login";
    } else if (critLower.includes("bearer") || critLower.includes("authorization")) {
      passed =
        (targetFilesContent.includes("Authorization") || targetFilesContent.includes("authorization")) &&
        (targetFilesContent.includes("Bearer") || targetFilesContent.includes("startsWith('Bearer ')")) &&
        (targetFilesContent.includes("req.user") || targetFilesContent.includes("next()"));
      evidence = passed
        ? "Found Bearer token header extraction and req.user attachment"
        : "Missing Bearer header parsing or auth validation";
    } else if (critLower.includes("get /api/feedback") || critLower.includes("retrieve")) {
      passed =
        targetFilesContent.includes("Feedback.find") &&
        targetFilesContent.includes("200");
      evidence = passed
        ? "Found Feedback.find() with status 200 response"
        : "Missing Feedback.find query or 200 response in GET /api/feedback";
    } else if (critLower.includes("post /api/feedback") && (critLower.includes("201") || critLower.includes("validate"))) {
      passed =
        targetFilesContent.includes("Feedback.create") &&
        targetFilesContent.includes("201");
      evidence = passed
        ? "Found Feedback.create with 201 status code"
        : "Missing Feedback.create or 201 response in POST /api/feedback";
    } else if (critLower.includes("upvote") || critLower.includes("increment")) {
      passed =
        (targetFilesContent.includes("findByIdAndUpdate") || targetFilesContent.includes("findById")) &&
        (targetFilesContent.includes("$inc") || targetFilesContent.includes("votes + 1") || targetFilesContent.includes("votes++"));
      evidence = passed
        ? "Found vote increment logic on target document"
        : "Missing vote increment logic in upvote endpoint";
    } else {
      // General non-empty check
      passed = targetFilesContent.length > 50 && !targetFilesContent.includes("TODO: Task");
      evidence = passed
        ? "Static code inspection matched required signatures"
        : "Pending implementation of task requirements";
    }

    criteriaResults.push({
      title: criterion,
      status: passed ? "pass" : "fail",
      evidence,
      feedback: passed
        ? "Requirements satisfied by static code structure."
        : "Incomplete implementation according to acceptance criteria.",
    });
  }

  const allPassed = criteriaResults.every((c) => c.status === "pass");
  const passCount = criteriaResults.filter((c) => c.status === "pass").length;
  const score = Math.round((passCount / criteriaResults.length) * 100);

  return {
    status: allPassed ? "pass" : "fail",
    score,
    criteriaResults,
    overallFeedback: allPassed
      ? "All acceptance criteria verified statically!"
      : "Static analysis identified incomplete sections. Please review the target files and criteria.",
    bugs: allPassed ? [] : ["Incomplete logic in target files"],
    missingRequirements: criteriaResults
      .filter((c) => c.status === "fail")
      .map((c) => c.title),
    conceptualIssues: [],
    nextStep: allPassed
      ? "Proceed to the next task in the curriculum."
      : "Complete the remaining TODO items in the target files.",
    shouldAskForNudge: !allPassed,
  };
}

export { buildEvaluatorPrompt, EVALUATOR_SYSTEM_PROMPT };
