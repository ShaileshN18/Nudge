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

interface NudgeRequestBody {
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
  activeFilePath?: string;
}

export async function POST(request: Request) {
  try {
    const body: NudgeRequestBody = await request.json();
    const { task, files = [], activeFilePath } = body;

    if (!task) {
      return NextResponse.json(
        { error: "Task information is required for hint generation." },
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

    // Identify which target file to focus on (active if it's a target, or first target)
    const targetFilePaths = (task.targetFiles || []).map((tf) => tf.replace(/^\/+/, "").toLowerCase());
    const cleanActive = (activeFilePath || "").replace(/^\/+/, "").toLowerCase();
    const activeTarget = files.find((f) => f.path.replace(/^\/+/, "").toLowerCase() === cleanActive) || files[0];

    const formattedFilesText = files
      .map(
        (f) => `--- TARGET FILE: ${f.path} ---
${cleanFileContent(f.content, 350)}
`
      )
      .join("\n\n");

    const prompt = `You are "Aria", an ultra-subtle and warm AI coding mentor.
The student is stuck or wants a gentle nudge on this task:
Task: ${task.order || 1}. ${task.title}
Description: ${task.description || ""}
Goal: ${task.goal || ""}
Evaluation Criteria:
${(task.evaluationCriteria || []).map((c, i) => `  ${i + 1}. ${c}`).join("\n")}

Primary Target File: ${activeTarget?.path || task.targetFiles?.[0] || ""}

Target Files Content:
${formattedFilesText}

STRICT HINT RULES:
1. Provide a VERY SUBTLE, thought-provoking observation or guiding question (1-2 natural sentences).
   Example tone: "This handler executes, but nothing is returned yet. Think about what status code and payload the client expects."
2. ABSOLUTELY NO CODE SNIPPETS. Do NOT write code, do NOT write JavaScript/Python, do NOT give away full variable names, function implementations, regex, or solutions.
3. Identify the EXACT line numbers in \`${activeTarget?.path || task.targetFiles?.[0] || ""}\` where the student needs to inspect, fix, or implement the requirement. Count the lines carefully in the provided file content. Always return valid positive integer line numbers for startLine and endLine.
4. Provide a short 2-5 word concept for the badge (e.g. "missing return status", "input validation check", "parameter handling").
5. Return ONLY valid JSON matching this exact structure with NO markdown backticks, NO markdown syntax:
{
  "hint": "string (subtle guiding question or observation, strictly NO code)",
  "targetFile": "${activeTarget?.path || task.targetFiles?.[0] || ""}",
  "startLine": number,
  "endLine": number,
  "concept": "short 2-5 word concept phrase"
}`;

    const model = "gemini-3.5-flash";
        return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
