"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  RotateCcw,
  Bot,
  User,
  FileCode,
  HelpCircle,
  Bug,
  ChevronRight,
  Copy,
  Check,
  Lightbulb,
  RefreshCw,
} from "lucide-react";

import { readProjectFile } from "@/lib/webcontainer";
import { buildAIContext } from "@/lib/aiContext";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AiMentorProps {
  currentTask?: {
    order: number;
    title: string;
    description: string;
    goal?: string;
    targetFiles: string[];
    evaluationCriteria?: string[];
  };
  activeFilePath?: string;
  activeFileContent?: string;
  externalPrompt?: string | null;
  onClearExternalPrompt?: () => void;
  files?: Array<{ path: string; content: string }>;
  modifiedFiles?: string[];
  onNudgeReceived?: (nudge: {
    targetFile: string;
    startLine: number;
    endLine: number;
    hint: string;
    concept?: string;
  }) => void;
}

export default function AiMentor({
  currentTask,
  activeFilePath,
  activeFileContent,
  externalPrompt,
  onClearExternalPrompt,
  files,
  modifiedFiles,
  onNudgeReceived,
}: AiMentorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content: `### 👋 Hi, I'm your AI Mentor!

I'm here to guide you through **Task ${currentTask?.order || 1}: ${
        currentTask?.title || "Define User Model & Password Hashing"
      }**.

Ask me for code reviews, architectural explanations, or click **"Need a Nudge"** for subtle hints!`,
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isNudging, setIsNudging] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isNudging]);

  // Handle external prompt trigger (e.g. from the Aria nudge tooltip!)
  useEffect(() => {
    if (externalPrompt) {
      handleSend(externalPrompt);
      onClearExternalPrompt?.();
    }
  }, [externalPrompt]);

  const handleNeedNudge = async () => {
    if (isNudging || isLoading || !currentTask) return;
    setIsNudging(true);

    try {
      // 1. Read targetFiles directly from WebContainer (single source of truth)
      const targetFilePaths = currentTask.targetFiles || [];
      const targetFilesContent: Array<{ path: string; content: string }> = [];

      for (const p of targetFilePaths) {
        const clean = p.replace(/^\/+/, "");
        try {
          const content = await readProjectFile(clean);
          targetFilesContent.push({ path: clean, content });
        } catch {
          if (activeFilePath && clean === activeFilePath.replace(/^\/+/, "")) {
            targetFilesContent.push({ path: clean, content: activeFileContent || "" });
          } else {
            const fallback = files?.find((f) => f.path.replace(/^\/+/, "") === clean);
            targetFilesContent.push({ path: clean, content: fallback?.content || "" });
          }
        }
      }

      // 2. Build minimal, focused AI context
      const aiContext = buildAIContext(currentTask, targetFilesContent);

      const res = await fetch("/api/ai/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: {
            order: aiContext.taskOrder,
            title: aiContext.taskTitle,
            goal: aiContext.goal,
            description: aiContext.description,
            targetFiles: aiContext.targetFiles,
            evaluationCriteria: aiContext.evaluationCriteria,
          },
          files: aiContext.files,
          activeFilePath,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate hint");
      }

      const nudge = data.nudge;
      const targetFile = nudge.targetFile || activeFilePath || "";
      const lineText = nudge.startLine
        ? ` (Inspect line ${nudge.startLine}${
            nudge.endLine && nudge.endLine !== nudge.startLine
              ? `-${nudge.endLine}`
              : ""
          })`
        : "";

      // Post gentle hint message
      const hintMsg: ChatMessage = {
        id: "nudge-" + Date.now(),
        role: "assistant",
        content: `### 💡 Gentle Nudge ${nudge.concept ? `• ${nudge.concept}` : ""}
${nudge.hint}

*Target: \`${targetFile}\`${lineText} — Highlighted in your editor.*`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, hintMsg]);

      // Trigger line decoration in CodeEditor if line numbers provided
      if (onNudgeReceived && nudge) {
        onNudgeReceived({
          targetFile,
          startLine: nudge.startLine,
          endLine: nudge.endLine || nudge.startLine,
          hint: nudge.hint,
          concept: nudge.concept,
        });
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          content: `⚠️ **Could not generate hint:** ${
            err?.message || "Please make sure GEMINI_API_KEY is configured in .env."
          }`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsNudging(false);
    }
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: "user-" + Date.now(),
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!messageText) setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          task: currentTask,
          activeFile: {
            path: activeFilePath || "Post.jsx",
            content: activeFileContent || "",
          },
        }),
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: "ai-" + Date.now(),
        role: "assistant",
        content:
          data.reply ||
          "I couldn't process that response right now. Please try again or rephrase your question!",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI Mentor chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          content:
            "⚠️ Network error while contacting the AI Mentor. Check your connection or console.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "welcome-" + Date.now(),
        role: "assistant",
        content: `### 🔄 Chat reset!
Ready to assist with **Task ${currentTask?.order || 1}: ${
          currentTask?.title || "Define User Model & Password Hashing"
        }**. What would you like to explore?`,
        timestamp: new Date(),
      },
    ]);
  };

  const quickPrompts = [
    { label: "Review active file", prompt: "Please review my active file and identify any syntax or logical issues", icon: FileCode },
    { label: "Explain requirements", prompt: "Can you explain the requirements and expected data flow for this task?", icon: HelpCircle },
    { label: "Why is code failing?", prompt: "Why might my tests or route handlers fail?", icon: Bug },
    { label: "Security best practices", prompt: "What are the security best practices for JWT tokens and password salts?", icon: Sparkles },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0f19] text-slate-200 select-none">
      {/* Header */}
      <div className="h-12 px-4 border-b border-slate-800/80 bg-[#0d1322] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
              AI Mentor
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </h2>
            <p className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">
              {activeFilePath ? activeFilePath.split("/").pop() : "Ready to assist"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleNeedNudge}
            disabled={isNudging}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            title="Get a gentle, subtle nudge without spoilers"
          >
            {isNudging ? (
              <>
                <RefreshCw className="h-3 w-3 animate-spin text-amber-400" />
                <span className="text-[11px]">Nudging...</span>
              </>
            ) : (
              <>
                <Lightbulb className="h-3 w-3 text-amber-400" />
                <span className="text-[11px]">Need a Nudge</span>
              </>
            )}
          </button>

          <button
            onClick={handleResetChat}
            title="Reset Chat"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-md transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-4 select-text font-sans">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1`}
            >
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                {isUser ? (
                  <>
                    <span>You</span>
                    <User className="h-3 w-3 text-slate-400" />
                  </>
                ) : (
                  <>
                    <Bot className="h-3 w-3 text-indigo-400" />
                    <span className="text-indigo-300 font-medium">Aria • Mentor</span>
                  </>
                )}
              </div>

              <div
                className={`max-w-[95%] text-xs leading-relaxed rounded-xl p-3 relative group ${
                  isUser
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15 rounded-tr-none"
                    : "bg-[#131929] border border-slate-800/90 text-slate-200 shadow-sm rounded-tl-none"
                }`}
              >
                {!isUser && (
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white bg-slate-800/80 rounded transition-all"
                    title="Copy text"
                  >
                    {copiedId === msg.id ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                )}

                {/* Simple Markdown Parser / Renderer */}
                <div className="prose prose-invert prose-xs max-w-none space-y-2">
                  {renderMarkdownContent(msg.content)}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex flex-col items-start space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] text-indigo-300 px-1">
              <Bot className="h-3 w-3 text-indigo-400" />
              <span>Aria is thinking...</span>
            </div>
            <div className="bg-[#131929] border border-slate-800/90 rounded-xl rounded-tl-none p-3 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-3 py-2 border-t border-slate-800/60 bg-[#090d16]/70 flex flex-wrap gap-1.5 shrink-0">
        {quickPrompts.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSend(item.prompt)}
              disabled={isLoading}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-full bg-slate-900 hover:bg-indigo-950/60 text-slate-300 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <Icon className="h-3 w-3 text-indigo-400" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Input Field */}
      <div className="p-3 border-t border-slate-800/80 bg-[#0d1322] shrink-0">
        <div className="flex items-center gap-2 bg-[#131929] border border-slate-700/60 focus-within:border-indigo-500/70 rounded-xl px-3 py-1.5 shadow-inner transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none resize-none py-1.5 max-h-24 overflow-y-auto"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className={`p-2 rounded-lg transition-all ${
              input.trim() && !isLoading
                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 cursor-pointer"
                : "bg-slate-800/50 text-slate-600 cursor-not-allowed"
            }`}
            title="Send message (Enter)"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Simple Markdown Renderer for clean formatted responses ──
function renderMarkdownContent(content: string) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const firstLineBreak = part.indexOf("\n");
      const lang = part.slice(3, firstLineBreak).trim();
      const code = part.slice(firstLineBreak + 1, -3);

      return (
        <div
          key={index}
          className="my-2 rounded-lg bg-[#080b12] border border-slate-800 overflow-hidden font-mono text-[11px]"
        >
          {lang && (
            <div className="px-2.5 py-1 bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
              <span>{lang}</span>
            </div>
          )}
          <pre className="p-2.5 overflow-x-auto text-emerald-300/90 whitespace-pre">
            <code>{code}</code>
          </pre>
        </div>
      );
    }

    // Split paragraphs and headers
    const lines = part.split("\n");
    return (
      <div key={index} className="space-y-1.5">
        {lines.map((line, lIdx) => {
          if (!line.trim()) return null;

          if (line.startsWith("### ")) {
            return (
              <h4 key={lIdx} className="font-bold text-white text-xs pt-1">
                {line.replace("### ", "")}
              </h4>
            );
          }
          if (line.startsWith("- ")) {
            return (
              <div key={lIdx} className="flex items-start gap-1.5 text-slate-300 pl-1">
                <span className="text-indigo-400 font-bold">•</span>
                <span>{renderInlineFormatting(line.replace("- ", ""))}</span>
              </div>
            );
          }
          if (/^\d+\.\s/.test(line)) {
            const num = line.match(/^(\d+\.)\s/)?.[1];
            return (
              <div key={lIdx} className="flex items-start gap-1.5 text-slate-300 pl-1">
                <span className="text-indigo-400 font-medium">{num}</span>
                <span>{renderInlineFormatting(line.replace(/^\d+\.\s/, ""))}</span>
              </div>
            );
          }

          return (
            <p key={lIdx} className="text-slate-300">
              {renderInlineFormatting(line)}
            </p>
          );
        })}
      </div>
    );
  });
}

function renderInlineFormatting(text: string) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("`") && p.endsWith("`")) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded bg-slate-900 text-indigo-300 font-mono text-[11px] border border-slate-800"
        >
          {p.slice(1, -1)}
        </code>
      );
    }
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <strong key={i} className="text-white font-semibold">
          {p.slice(2, -2)}
        </strong>
      );
    }
    return p;
  });
}
