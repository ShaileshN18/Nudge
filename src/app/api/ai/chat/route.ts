import { NextResponse } from "next/server";

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
        const systemPrompt = `You are "AI Mentor" (also known as Aria), an expert, encouraging, and highly skilled software engineering mentor built into a modern coding environment.
The user is working on a coding task in an interactive workspace.
Current Task Information:
- Order/Step: ${task?.order || 1}
- Title: ${task?.title || "Display a single blog post"}
- Description: ${task?.description || "N/A"}
- Goal: ${task?.goal || "N/A"}
- Files they work with: ${task?.targetFiles?.join(", ") || "N/A"}
- Evaluation Criteria: ${task?.evaluationCriteria?.join("; ") || "N/A"}

Active File Currently Open in Editor:
- Path: ${activeFile?.path || "N/A"}
- Content:
\`\`\`
${activeFile?.content || "// No file content"}
\`\`\`

Guidelines:
1. Provide constructive, educational, and Socratic guidance.
2. If the user asks for a hint, don't give the entire solution immediately; nudge them in the right direction (e.g., explaining why useEffect needs the ID in its dependency array, or how to handle asynchronous data fetching).
3. If they ask for the solution or direct code help, explain the 'why' alongside clean code snippets.
4. Keep answers concise, formatted with markdown, and highlight relevant lines.`;

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

  // 1. Specific query about useEffect / dependency array / line 12 (as in the screenshot)
  if (
    query.includes("dependency") ||
    query.includes("useeffect") ||
    query.includes("line 12") ||
    query.includes("aria") ||
    query.includes("think: dependency array") ||
    query.includes("not when the id changes")
  ) {
    return `### 💡 Dependency Array Insight

In your \`useEffect\` hook in **${filePath || "Post.jsx"}**, notice the dependency array:

\`\`\`javascript
useEffect(() => {
  // Fetch post data...
}, []); // ⚠️ Currently runs ONLY on initial mount!
\`\`\`

**Why this is an issue:**
If the user navigates between different posts (changing the URL param \`id\`), the effect won't re-run to fetch the new post because \`id\` is missing from the dependency array.

**Recommended fix:**
Add \`id\` to the dependency array:
\`\`\`javascript
useEffect(() => {
  if (!id) return;
  // Fetch logic with axios/fetch
}, [id]);
\`\`\`

Would you like me to inspect how you handle the loading and error states as well?`;
  }

  // 2. Hint request
  if (query.includes("hint") || query.includes("give me a hint") || query.includes("stuck")) {
    if (task?.title?.toLowerCase().includes("blog post") || filePath.includes("Post.jsx")) {
      return `### 🎯 Progressive Hint for Task ${task?.order || 1}: "${task?.title || "Display a single blog post"}"

1. **Route params**: Extract the \`id\` from URL using \`useParams()\` from \`react-router-dom\`.
2. **State**: Maintain three state variables: \`post\` (post object), \`loading\` (boolean), and \`error\` (string).
3. **Trigger**: Use \`useEffect\` with \`[id]\` in the dependency array to call your backend API endpoint (e.g., \`/api/posts/\${id}\`).
4. **Rendering**:
   - Check \`if (loading)\` return a loading spinner.
   - Check \`if (error)\` return an error alert.
   - Otherwise render the post \`title\`, author, and content in a styled container!`;
    }

    return `### 🎯 Hint for Task ${task?.order || 1}: "${task?.title || "Current Task"}"

Goal: **${task?.goal || task?.description || "Implement the required behavior"}**

- **Target Files**: \`${task?.targetFiles?.join("`, `") || filePath || "Active file"}\`
- **Tip**: Make sure to check the evaluation criteria checklist in the top panel.
- Focus on verifying input parameters and returning the expected JSON or component output.`;
  }

  // 3. Review active file
  if (
    query.includes("review") ||
    query.includes("check my code") ||
    query.includes("check this file") ||
    query.includes("look at")
  ) {
    if (!code) {
      return `I don't see any content in the active file right now. Open a file in the editor (like \`${task?.targetFiles?.[0] || "Post.jsx"}\`) and ask me again!`;
    }

    const hasEmptyDeps = /useEffect\s*\(\s*\(\s*\)\s*=>[\s\S]*?,\s*\[\s*\]\s*\)/.test(code);
    const usesAxios = code.includes("axios");
    const hasLoading = code.includes("loading");

    let review = `### 🔍 Code Review: \`${filePath}\`\n\n`;

    if (hasEmptyDeps && code.includes("useParams")) {
      review += `⚠️ **Key Observation:** You have a \`useEffect\` with an empty dependency array \`[]\`. If \`id\` changes in \`useParams()\`, the effect will not re-fetch the post. Change \`[]\` to \`[id]\`.\n\n`;
    }

    if (usesAxios && !code.includes("catch")) {
      review += `💡 **Suggestion:** Ensure you wrap your axios request in \`try/catch\` or chain \`.catch(err => ...)\` to set error state gracefully.\n\n`;
    }

    if (hasLoading) {
      review += `✔ **Good Practice:** You've incorporated loading state handling, which improves user experience during data fetching.\n\n`;
    }

    review += `Overall, your component structure is clean! Ready to test it with **Run & Evaluate**?`;
    return review;
  }

  // 4. Explain task
  if (query.includes("explain") || query.includes("what should i do") || query.includes("requirement")) {
    return `### 📋 Task Breakdown: ${task?.title || "Display a single blog post"}

**Objective:**
${task?.description || "Fetch a blog post by its id from the backend and display its title, content, and author info."}

**Files you'll work with:**
${(task?.targetFiles || ["Post.jsx", "postRoutes.js"]).map((f) => `- \`${f}\``).join("\n")}

**What needs to happen:**
1. Connect frontend \`Post.jsx\` to backend endpoint \`GET /api/posts/:id\`.
2. Parse response and update local state.
3. Render the blog post header, markdown content, and metadata.`;
  }

  // 5. Why is code failing / bugs
  if (query.includes("fail") || query.includes("error") || query.includes("bug") || query.includes("wrong")) {
    return `### 🐞 Debugging Assistant

Let's check the common reasons for issues in this step:
1. **Network / Port**: Is the server running on port 5000 and the Vite dev server on 5173?
2. **CORS / Relative URL**: Ensure your fetch URL is configured or proxied correctly.
3. **Empty Data Guard**: If \`post\` is null initially, accessing \`post.title\` directly without an \`if (!post)\` guard will throw a TypeError.
4. **Dependency Array**: Ensure your fetch effect re-runs when the route parameter changes.

Click **Run & Evaluate** in the top bar to run automated criteria tests!`;
  }

  // Default helpful mentor response
  return `### 👋 AI Mentor here!

I'm monitoring your workspace for **Task ${task?.order || 1}: ${task?.title || "Display a single blog post"}**.

I can help you with:
- **Progressive hints** without spoiling the solution
- **Code reviews** of your active file (\`${filePath || "Post.jsx"}\`)
- **Fixing bugs** and explaining React hooks or Express route logic
- **Explaining the evaluation criteria**

Feel free to ask questions like *"Why is useEffect warning me?"* or click any of the prompt pills below!`;
}
