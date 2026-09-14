import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequestBody {
  message: string;
  history?: ChatMessage[];
  task?: {
    order?: number;
    title?: string;
    description?: string;
    goal?: string;
    targetFiles?: string[];
    evaluationCriteria?: string[];
  };
  activeFile?: {
    path: string;
    content: string;
  };
}

export async function POST(request: Request) {
  return NextResponse.json({ reply: "Initialized" });
}
