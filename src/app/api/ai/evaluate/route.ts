import { NextResponse } from "next/server";
import { cleanFileContent } from "@/lib/aiContext";

export const dynamic = "force-dynamic";

interface TaskItem {
  order?: number;
  title?: string;
  description?: string;
  goal?: string;
  targetFiles?: string[];
  evaluationCriteria?: string[];
}

interface FileItem {
  path: string;
  content: string;
}

interface EvaluateRequestBody {
  task: {
    order?: number;
    title: string;
    description?: string;
    goal?: string;
    targetFiles: string[];
    evaluationCriteria?: string[];
  };
  files: Array<{
    path: string;
    content: string;
  }>;
}

export async function POST(request: Request) {
  try {
    const body: EvaluateRequestBody = await request.json();
    const { task, files = [] } = body;

    if (!task || !task.title) {
      return NextResponse.json(
        { error: "Task information is required for evaluation." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY environment variable is not configured.", code: "NO_API_KEY" },
        { status: 500 }
      );
    }

    // Pre-check: Ensure target files contain actual code beyond comments
    const hasActualCode = files.some((f) => {
      const codeOnly = (f.content || "").replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "").trim();
      return codeOnly.length > 20;
    });

    if (!hasActualCode) {
      return NextResponse.json({
        success: true,
        evaluation: {
          passed: false,
          overallFeedback: "No code implementation found in the target files. Please write your code before running evaluation.",
          criteriaStatus: (task.evaluationCriteria || []).map((c) => ({
            title: c,
            passed: false,
            feedback: "Target file is empty or contains no code.",
          })),
        },
      });
    }

    const formattedFilesText = files
      .map(
        (f) => `--- FILE: ${f.path} ---
${cleanFileContent(f.content, 350)}
`
      )
      .join("\n\n");

    const systemPrompt = `You are a strict, pedagogical AI code reviewer evaluating a student's submission for an engineering task.
Task Information:
- Order/Step: ${task.order || 1}
- Title: ${task.title}
- Description: ${task.description || ""}
- Goal: ${task.goal || ""}
- Target Files: ${(task.targetFiles || []).join(", ")}
- Evaluation Criteria to evaluate:
${(task.evaluationCriteria || []).map((c, i) => `  ${i + 1}. ${c}`).join("\n")}

Codebase files provided:
${formattedFilesText}

STRICT EVALUATION RULES:
1. BE AN UNCOMPROMISING, RIGOROUS CODE REVIEWER. Do NOT give the student credit if code is missing, empty, or incomplete.
2. Do NOT pass criteria if the functions contain unfulfilled TODO comments, stub markers, or placeholder return values (e.g. "// TODO", "return null", "return false", "501 Not Implemented").
3. Functional requirements must be genuinely implemented according to the task's stated goal and evaluation criteria.
4. If ANY required logic is missing, incorrect, or stubbed, that criterion MUST be marked passed: false with clear constructive feedback.
5. If ANY criterion is passed: false, the overall passed MUST be false. The submission can ONLY be passed: true if EVERY criterion is passed: true.
6. You MUST return ONLY valid JSON matching this exact structure with NO markdown formatting, NO backticks, NO other text:
{
  "passed": boolean,
  "overallFeedback": "string",
  "criteriaStatus": [
    {
      "title": "string matching the criterion exactly",
      "passed": boolean,
      "feedback": "brief specific feedback on what passed or failed"
    }
  ]
}`;

    const model = "gemini-3.5-flash";
        return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
