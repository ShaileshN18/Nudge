import { NextResponse } from "next/server";
import { cleanFileContent, extractAndParseJson } from "@/lib/aiContext";

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
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errorData = await geminiRes.json().catch(() => null);
      const errorMessage =
        errorData?.error?.message || geminiRes.statusText || "Failed to generate hint from Gemini API";
      const statusCode = geminiRes.status;

      if (statusCode === 429) {
        return NextResponse.json(
          {
            error: "Gemini API rate limit exceeded (quota reached). Please wait a moment before trying again.",
            code: "RATE_LIMITED",
            details: errorMessage,
          },
          { status: 429 }
        );
      }

      if (statusCode === 503) {
        return NextResponse.json(
          {
            error: "Gemini model is currently experiencing high demand. Please try again shortly.",
            code: "SERVICE_UNAVAILABLE",
            details: errorMessage,
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          error: errorMessage,
          code: errorData?.error?.status || "AI_ERROR",
        },
        { status: statusCode >= 400 && statusCode < 600 ? statusCode : 500 }
      );
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return NextResponse.json(
        { error: "No response text generated by AI model.", code: "EMPTY_RESPONSE" },
        { status: 502 }
      );
    }

    const cleanJson = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    let parsedResult: any;
    try {
      parsedResult = JSON.parse(cleanJson);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON response returned by AI model.", code: "PARSE_ERROR", raw: cleanJson },
        { status: 502 }
      );
    }

    const targetFile =
      parsedResult.targetFile && typeof parsedResult.targetFile === "string" && parsedResult.targetFile.trim()
        ? parsedResult.targetFile.trim()
        : activeTarget?.path || task.targetFiles?.[0] || "";

    const startLine =
      typeof parsedResult.startLine === "number" && !isNaN(parsedResult.startLine)
        ? Math.max(1, Math.floor(parsedResult.startLine))
        : 1;

    const endLine =
      typeof parsedResult.endLine === "number" && !isNaN(parsedResult.endLine)
        ? Math.max(startLine, Math.floor(parsedResult.endLine))
        : startLine;

    return NextResponse.json({
      success: true,
      nudge: {
        hint: parsedResult.hint || "Inspect this section to verify the implementation logic.",
        targetFile,
        startLine,
        endLine,
        concept: parsedResult.concept || "Code structure",
      },
    });
  } catch (err: any) {
    console.error("AI Nudge error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error during nudge generation" },
      { status: 500 }
    );
  }
}
