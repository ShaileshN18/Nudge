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
  try {
    const body: ChatRequestBody = await request.json();
    const { message, history = [], task, activeFile } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message string is required" },
        { status: 400 }
      );
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (geminiApiKey) {
      try {
        const cleanedActiveContent = activeFile?.content
          ? activeFile.content.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").split("\n").slice(0, 300).join("\n")
          : "// No file content";

        const systemPrompt = `You are "AI Mentor", a top-tier pedagogical software engineering mentor.
The student is working on:
- Order/Step: ${task?.order || 1}
- Title: ${task?.title || "Current Task"}
- Description: ${task?.description || ""}
- Goal: ${task?.goal || ""}
- Target Files: ${(task?.targetFiles || []).join(", ") || "None specified"}
- Evaluation Criteria: ${(task?.evaluationCriteria || []).join("; ") || "Follow task specifications"}

Active File Currently Open in Editor:
- Path: ${activeFile?.path || "None"}
- Content:
\`\`\`
${cleanedActiveContent}
\`\`\`

⛔ CRITICAL PEDAGOGICAL GUARDRAILS (STRICT ENFORCEMENT):
1. **NEVER WRITE THE COMPLETE CODE OR WHOLE FILES**: Under NO circumstances should you generate complete implementations, ready-to-paste classes, complete route handlers, or full functions for the task.
2. **REFUSE DIRECT CODE REQUESTS SOCRATICALLY**: If the user asks "give me code", "write this for me", "show me the full code", "solve it", "give code", or anything similar, you MUST politely and firmly decline to write the code. Explain the concept, provide pseudo-logic or a tiny 1-line conceptual skeleton if necessary, and prompt them with the next step.
3. **DO NOT SPOIL THE SOLUTION**: Point out where to look, explain the "why" and "how", highlight edge cases, but make the student write the implementation.
4. **KEEP CODE SAMPLES MINIMAL & ABSTRACT**: If illustrating syntax, provide only generic 1-line signatures or abstract snippets with placeholder names, never the exact solution to the task.
5. Format your answers clearly with markdown, bullet points, and concise explanations.`;

        // Filter valid history turns
        const chatTurns = history
          .filter((msg) => msg.role === "user" || msg.role === "assistant")
          .slice(-6)
          .map((msg) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
          }));

        const contents = [
          ...chatTurns,
          {
            role: "user",
            parts: [{ text: message }],
          },
        ];

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: systemPrompt }],
              },
              contents,
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 500,
              },
            }),
          }
        );

        if (geminiRes.status === 429) {
          return NextResponse.json(
            { error: "AI rate limit reached. Please wait a moment before sending another message.", code: "RATE_LIMITED" },
            { status: 429 }
          );
        }

        if (geminiRes.status === 503) {
          return NextResponse.json(
            { error: "AI service is currently experiencing high demand. Please try again shortly.", code: "SERVICE_UNAVAILABLE" },
            { status: 503 }
          );
        }

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          let reply =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            // Guardrail: if model accidentally generated large code blocks when user asked for code
            const codeBlockMatches = reply.match(/```[\s\S]*?```/g);
            if (codeBlockMatches && codeBlockMatches.some((b: string) => b.split("\n").length > 6)) {
              reply = `I can't write the complete code for you, but I can guide you through it! 💡\n\nLet's break down what your code needs step by step. What part of the logic would you like to tackle first?`;
            }
            return NextResponse.json({ reply });
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini API call failed, falling back to built-in mentor:", geminiErr);
      }
    }

    // Built-in intelligent mentor response generator (project-agnostic fallback)
    const reply = generateMentorResponse(message, task, activeFile);
    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("AI Chat route error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

function generateMentorResponse(
  _userQuery: string,
  task?: ChatRequestBody["task"],
  activeFile?: ChatRequestBody["activeFile"]
): string {
  const filePath = activeFile?.path || task?.targetFiles?.[0] || "";
  const title = task?.title || "current task";

  return `### 💡 AI Mentor
I'm here to guide you through **${title}**.

**Goal:** ${task?.goal || task?.description || "Implement the task requirements."}
**Target Files:** ${(task?.targetFiles || []).map((f) => `\`${f}\``).join(", ") || "None specified"}

I can help explain concepts, review logic in \`${filePath}\`, or break down evaluation criteria without giving away direct code solutions. What specific part of this task would you like to work through?`;
}

