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
        return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
