import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "user" | "assistant" | "system" | "model";
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

function buildSystemPrompt(
  task?: ChatRequestBody["task"],
  activeFile?: ChatRequestBody["activeFile"]
): string {
  const taskSection = task?.title
    ? `Current Workspace Task:
- Step/Order: ${task.order || 1}
- Title: ${task.title}
- Description: ${task.description || "Complete the task according to specifications."}
- Goal: ${task.goal || "Follow standard engineering patterns and satisfy test criteria."}
- Target Files: ${task.targetFiles?.join(", ") || "Project workspace files"}
- Evaluation Criteria: ${task.evaluationCriteria?.join("; ") || "Verify functionality and clean architecture."}`
    : `Current Workspace: General full-stack software development environment.`;

  const fileSection = activeFile?.path
    ? `Active File in Editor: \`${activeFile.path}\`
Content:
\`\`\`
${activeFile.content || "// (Empty file)"}
\`\`\``
    : "No active file currently open.";

  return `You are "AI Mentor" (Aria), an expert software engineering mentor and pair programmer embedded inside the user's interactive IDE.

${taskSection}

${fileSection}

Instructions for your responses:
1. Provide accurate, educational, and constructive guidance.
2. If the user asks for code review, debugging help, or why tests might fail, inspect their active file content and give specific line-by-line observations, potential pitfalls, and code solutions.
3. If they ask conceptual or architectural questions, explain clearly with concise code examples.
4. Format all answers neatly with markdown headers (###), bullet points, and syntax-highlighted code blocks.
5. Keep your tone encouraging, professional, and directly actionable.`;
}

function buildGeminiContents(
  history: ChatMessage[],
  newMessage: string
): Array<{ role: "user" | "model"; parts: [{ text: string }] }> {
  const turns: Array<{ role: "user" | "model"; text: string }> = [];

  // Convert previous history turns
  for (const msg of history.slice(-10)) {
    const role: "user" | "model" =
      msg.role === "assistant" || msg.role === "model" ? "model" : "user";
    const text = (msg.content || "").trim();
    if (!text) continue;

    // Merge consecutive turns with the same role
    if (turns.length > 0 && turns[turns.length - 1].role === role) {
      turns[turns.length - 1].text += "\n\n" + text;
    } else {
      turns.push({ role, text });
    }
  }

  // Ensure conversation starts with 'user'
  if (turns.length > 0 && turns[0].role === "model") {
    turns.unshift({
      role: "user",
      text: "Hello, I am working on this project task and need your mentorship.",
    });
  }

  // Append new user message
  if (turns.length > 0 && turns[turns.length - 1].role === "user") {
    turns[turns.length - 1].text += "\n\n" + newMessage.trim();
  } else {
    turns.push({ role: "user", text: newMessage.trim() });
  }

  return turns.map((t) => ({
    role: t.role,
    parts: [{ text: t.text }],
  }));
}

async function callGemini(
  apiKey: string,
  systemPrompt: string,
  contents: Array<{ role: "user" | "model"; parts: [{ text: string }] }>
): Promise<{ reply: string; model: string }> {
  const modelsToTry = [
    process.env.GEMINI_MODEL,
    "gemini-3.6-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash",
  ].filter(Boolean) as string[];

  const uniqueModels = Array.from(new Set(modelsToTry));
  let lastError: any = null;

  for (const model of uniqueModels) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemPrompt }],
            },
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1500,
            },
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          return { reply, model };
        }
      }

      console.warn(
        `[AI Mentor] Model ${model} returned ${response.status}:`,
        data?.error?.message || data
      );
      lastError = new Error(
        data?.error?.message || `Gemini API returned status ${response.status}`
      );
    } catch (err: any) {
      console.warn(`[AI Mentor] Model ${model} request error:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini models failed to respond");
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
        const systemPrompt = buildSystemPrompt(task, activeFile);
        const contents = buildGeminiContents(history, message);

        const { reply, model } = await callGemini(
          geminiApiKey,
          systemPrompt,
          contents
        );

        return NextResponse.json({ reply, model });
      } catch (geminiErr: any) {
        console.error(
          "[AI Mentor] Gemini API failed, using fallback:",
          geminiErr.message
        );
      }
    } else {
      console.warn("[AI Mentor] GEMINI_API_KEY is not set in environment");
    }

    // Emergency offline fallback only if Gemini API is unreachable or key is missing
    const reply = generateMentorResponse(message, task, activeFile);
    return NextResponse.json({
      reply,
      isFallback: true,
    });
  } catch (err: any) {
    console.error("AI Chat route error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

function generateMentorResponse(
  userQuery: string,
  task?: ChatRequestBody["task"],
  activeFile?: ChatRequestBody["activeFile"]
): string {
  const query = userQuery.toLowerCase().trim();
  const filePath = activeFile?.path || "";
  const code = activeFile?.content || "";

  // 1. Password hashing & security questions
  if (
    query.includes("salt") ||
    query.includes("hash") ||
    query.includes("password") ||
    query.includes("bcrypt") ||
    query.includes("pbkdf2")
  ) {
    return `### 🔐 Password Hashing Best Practices

When storing passwords:
1. **Never store plain text**: Passwords must always be hashed before saving to any data store.
2. **Unique Cryptographic Salt**: Always generate a random salt (e.g. \`crypto.randomBytes(16).toString('hex')\`) for each user. A salt prevents rainbow table dictionary attacks.
3. **Format**: Store both salt and hash together (e.g. \`\${salt}:\${hash}\`) so you can reconstruct the hash during login comparisons.
4. **Timing-Safe Comparison**: When comparing passwords, use constant-time comparison or hash verification to prevent timing attacks.

In \`src/models/User.js\`, check that your \`hashPassword\` and \`comparePassword\` methods accurately handle the salt delimiter!`;
  }

  // 2. JWT & Token questions
  if (
    query.includes("jwt") ||
    query.includes("token") ||
    query.includes("bearer") ||
    query.includes("header")
  ) {
    return `### 🛡️ JWT Authentication Flow

JWT tokens consist of 3 base64url-encoded parts separated by periods:
\`header.payload.signature\`

**Implementation Checklist:**
- **Secret Key**: Use \`process.env.JWT_SECRET\` to sign and verify tokens.
- **Expiration**: Always include an \`exp\` claim so tokens expire automatically.
- **Authorization Header**: Clients send tokens via \`Authorization: Bearer <token>\`.
- **Middleware Extraction**: In \`src/middleware/auth.js\`, strip the \`Bearer \` prefix before passing to \`verifyToken\`.`;
  }

  // 3. Code review
  if (
    query.includes("review") ||
    query.includes("check my code") ||
    query.includes("check this file") ||
    query.includes("syntax")
  ) {
    if (!code) {
      return `I don't see any code in the active editor file. Open a file like \`${task?.targetFiles?.[0] || "src/models/User.js"}\` and ask me again!`;
    }

    let review = `### 🔍 Code Review: \`${filePath}\`\n\n`;

    if (code.includes("hashPassword") && !code.includes("salt")) {
      review += `⚠️ **Warning:** Password hashing function does not appear to incorporate a cryptographic salt. Make sure to generate a unique salt.\n\n`;
    }

    if (code.includes("Authorization") && !code.includes("startsWith('Bearer ')") && !code.includes('startsWith("Bearer ")')) {
      review += `💡 **Suggestion:** Verify the Authorization header format begins with \`Bearer \` before parsing the token.\n\n`;
    }

    review += `✔ The structure of \`${filePath}\` is well-aligned with the project architecture. Click **Run Code** or run \`node test.js\` in the terminal to execute the test suite!`;
    return review;
  }

  // 4. Why is code failing / debugging
  if (query.includes("fail") || query.includes("error") || query.includes("bug") || query.includes("wrong")) {
    return `### 🐞 Debugging Checklist for Auth

1. **Test Runner**: Run \`node test.js\` in the bottom terminal to check which test assertions fail.
2. **Server Port**: Ensure the server is listening on port 5000 (\`node server.js\`).
3. **Missing Fields**: Check if registration and login requests provide valid JSON with \`email\` and \`password\`.
4. **Header Case**: Authorization headers can be sent as \`authorization\` (lowercase) in HTTP/1.1 and Node HTTP. Check \`req.headers['authorization'] || req.headers['Authorization']\`.`;
  }

  // 5. Requirements breakdown
  if (query.includes("explain") || query.includes("requirements") || query.includes("what should i do")) {
    return `### 📋 Task Requirements: ${task?.title || "Build Auth Service"}

**Objective:**
${task?.description || "Implement authentication logic and test using the automated test suite."}

**Target Files:**
${(task?.targetFiles || ["src/models/User.js"]).map((f) => `- \`${f}\``).join("\n")}

**Key Steps:**
1. Check your logic against the evaluation criteria checklist.
2. Save your changes (\`Ctrl + S\`).
3. Click **Run Code** or execute \`node test.js\` in the terminal to verify the tests pass!`;
  }

  // Default mentor response
  return `### 👋 AI Mentor here!

I'm monitoring your workspace for **Task ${task?.order || 1}: ${task?.title || "Define User Model & Password Hashing"}**.

I can assist with:
- **Code reviews** of your active file (\`${filePath || "src/models/User.js"}\`)
- **Security best practices** (salt hashing, JWT validation, middleware)
- **Debugging failed tests** and inspecting test outputs
- **Architectural explanations** of Express and Node.js backend services

Type your question or click any prompt pill below!`;
}

