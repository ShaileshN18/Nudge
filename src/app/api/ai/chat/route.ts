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
        const systemPrompt = `You are "AI Mentor", an expert software engineering mentor built into a modern coding environment.
The user is building a production-grade authentication microservice in Node.js and Express.
Current Task Information:
- Order/Step: ${task?.order || 1}
- Title: ${task?.title || "Define User Model & Password Hashing"}
- Description: ${task?.description || "Implement secure password hashing in the User model using salt rounds."}
- Goal: ${task?.goal || "Hash passwords securely using cryptographic salt before persisting user records."}
- Files they work with: ${task?.targetFiles?.join(", ") || "src/models/User.js"}
- Evaluation Criteria: ${task?.evaluationCriteria?.join("; ") || "Validate salt, password encryption, comparePassword"}

Active File Currently Open in Editor:
- Path: ${activeFile?.path || "src/models/User.js"}
- Content:
\`\`\`
${activeFile?.content || "// No file content"}
\`\`\`

Guidelines:
1. Provide constructive, educational, and professional engineering guidance.
2. Focus on security best practices, clean code, error handling, and robust architecture.
3. If the user asks for code review or debugging help, analyze their active file and explain logical bugs, missing checks, or edge cases.
4. Keep answers concise, formatted with markdown, and highlight relevant code lines.`;

        const contents = [
          {
            role: "user",
            parts: [{ text: systemPrompt }],
          },
          ...history.slice(-6).map((msg) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
          })),
          {
            role: "user",
            parts: [{ text: message }],
          },
        ];

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const reply =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            return NextResponse.json({ reply });
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini API call failed, falling back to built-in mentor:", geminiErr);
      }
    }

    // Built-in intelligent mentor response generator (works without external keys)
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

