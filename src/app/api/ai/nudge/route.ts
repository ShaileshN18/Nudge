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

    const prompt = "";
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
