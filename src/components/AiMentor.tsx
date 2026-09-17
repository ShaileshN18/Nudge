"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Lightbulb,
  XCircle,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  MessageSquare,
  Compass,
  FileCode,
  Layers,
  AlertTriangle,
  Code2,
} from "lucide-react";

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
    isError?: boolean;
  }) => void;
  evalResults?: {
    passed: boolean;
    criteriaStatus?: Array<{ title: string; passed: boolean; feedback?: string }>;
    overallFeedback?: string;
  } | null;
  activeHint?: {
    targetFile: string;
    startLine: number;
    endLine: number;
    hint: string;
    concept?: string;
    isError?: boolean;
  } | null;
  onClearHint?: () => void;
  userName?: string;
}

// ── Code Block & Markdown Renderer ──────────────────────────────────────
function MarkdownContent({ content }: { content: string }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Split by fenced code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 text-xs leading-relaxed text-[#F4F7F6]">
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const lines = part.slice(3, -3).trim().split("\n");
          let lang = "code";
          let codeText = part.slice(3, -3).trim();
          if (lines[0] && !lines[0].includes(" ") && lines.length > 1) {
            lang = lines[0].trim();
            codeText = lines.slice(1).join("\n");
          }

          return (
            <div
              key={index}
              className="my-2 rounded-lg overflow-hidden border border-[#202A2C] bg-[#080C0D] font-mono text-[11px]"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#11181A] border-b border-[#202A2C] text-[#71807C] text-[10px]">
                <span className="font-semibold uppercase tracking-wider text-[#A9B5B2]">
                  {lang}
                </span>
                <button
                  type="button"
                  onClick={() => copyCode(codeText, index)}
                  className="flex items-center gap-1 text-[#A9B5B2] hover:text-[#67D6B2] transition-colors cursor-pointer"
                  title="Copy code"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="h-3 w-3 text-[#67D6B2]" />
                      <span className="text-[#67D6B2]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 overflow-x-auto text-[#E0E7E5] scrollbar-thin">
                <code>{codeText}</code>
              </pre>
            </div>
          );
        }

        // Regular text parsing: paragraph lines, bullet points, inline code, bold
        const lines = part.split("\n");
        return (
          <div key={index} className="space-y-1">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={lIdx} className="h-1" />;

              // Check for unordered bullet list
              if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#67D6B2] shrink-0 mt-1.5" />
                    <span className="flex-1">{renderInlineFormat(trimmed.slice(2))}</span>
                  </div>
                );
              }

              // Check for numbered list
              const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
              if (numMatch) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-2">
                    <span className="text-[10px] font-mono font-bold text-[#67D6B2] shrink-0 mt-0.5">
                      {numMatch[1]}.
                    </span>
                    <span className="flex-1">{renderInlineFormat(numMatch[2])}</span>
                  </div>
                );
              }

              // Check for blockquote
              if (trimmed.startsWith("> ")) {
                return (
                  <div
                    key={lIdx}
                    className="border-l-2 border-[#67D6B2]/50 pl-2.5 py-0.5 text-[#A9B5B2] italic"
                  >
                    {renderInlineFormat(trimmed.slice(2))}
                  </div>
                );
              }

              return <p key={lIdx}>{renderInlineFormat(line)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

// Inline formatting for **bold** and `inline code`
function renderInlineFormat(text: string): React.ReactNode {
  // Split by inline code first
  const codeParts = text.split(/(`[^`]+`)/g);

  return codeParts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-[#151D1F] border border-[#202A2C] text-[#67D6B2] font-mono text-[11px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Parse bold text **bold**
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bPart, bIdx) => {
      if (bPart.startsWith("**") && bPart.endsWith("**") && bPart.length > 4) {
        return (
          <strong key={bIdx} className="font-semibold text-white">
            {bPart.slice(2, -2)}
          </strong>
        );
      }
      return bPart;
    });
  });
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
  evalResults,
  activeHint,
  onClearHint,
  userName = "Tanishq",
}: AiMentorProps) {
  // Navigation tabs: "chat" or "hints"
  const [activeTab, setActiveTab] = useState<"chat" | "hints">("chat");

  // Chat messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isNudging, setIsNudging] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Hints state
  const [evalFailedExpanded, setEvalFailedExpanded] = useState(true);
  const [whyWorksExpanded, setWhyWorksExpanded] = useState(false);
  const [hintLevel, setHintLevel] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isNudging, activeHint]);

  // Handle external prompt triggers (e.g. from inline aria or editor hints)
  useEffect(() => {
    if (externalPrompt) {
      setActiveTab("chat");
      handleSend(externalPrompt);
      onClearExternalPrompt?.();
    }
  }, [externalPrompt]);

  // Progressive Socratic hints progression dictionary
  const hintProgression: Record<
    number,
    { title: string; hint: string; concept: string; why: string }
  > = {
    1: {
      title: "Hint 1 — Direction & Strategy",
      hint: "You need to fetch all feedback entries using the Feedback model. Remember to sort them (newest or highest votes first) and return them as JSON.",
      concept: "Query the database",
      why: "Mongoose models provide Feedback.find() to query collections. Chaining .sort({ createdAt: -1 }) tells MongoDB to sort documents in reverse chronological order before returning them.",
    },
    2: {
      title: "Hint 2 — Response Handling",
      hint: "Look at what happens immediately after the database query resolves. Ensure the retrieved documents are returned with HTTP status 200 using Express's response methods.",
      concept: "Express route response",
      why: "Inside Express route handlers, res.status(200).json(data) formats the data into JSON and sends it back with the standard OK status.",
    },
    3: {
      title: "Hint 3 — Model Methods & Helpers",
      hint: "Which Mongoose model method retrieves all matching records from a collection? Check backend/src/models/Feedback.js to see available helpers.",
      concept: "Mongoose Feedback.find()",
      why: "Calling await Feedback.find() returns an array of all documents stored in the database.",
    },
  };

  const handleNeedNudge = async () => {
    if (isNudging || isLoading || !currentTask) return;
    setIsNudging(true);

    try {
      const nextLevel = activeHint && !activeHint.isError ? Math.min(3, hintLevel + 1) : 1;
      setHintLevel(nextLevel);

      const targetFile = "backend/src/feedback.js";
      const progressiveData = hintProgression[nextLevel] || hintProgression[1];

      // Trigger line decoration in CodeEditor
      if (onNudgeReceived) {
        onNudgeReceived({
          targetFile,
          startLine: 16,
          endLine: 16,
          hint: progressiveData.hint,
          concept: progressiveData.concept,
          isError: false,
        });
      }

      // Switch to hints tab so the user immediately sees the progressive breakdown
      setActiveTab("hints");
    } catch (err: any) {
      console.error("Nudge error:", err);
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
            path: activeFilePath || "backend/src/feedback.js",
            content: activeFileContent || "",
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error || !data.reply) {
        throw new Error(data.error || "Failed to get AI response");
      }

      const assistantMessage: ChatMessage = {
        id: "ai-" + Date.now(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("AI Mentor chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          content:
            error?.message ||
            "Unable to connect to AI Mentor. Please check your network and API configuration.",
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

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const isEvalFailed = evalResults && !evalResults.passed;
  const isHintActive = Boolean(activeHint && !activeHint.isError);
  const currentHintInfo = hintProgression[hintLevel] || hintProgression[1];
  const activeFileName = activeFilePath ? activeFilePath.split("/").pop() : "feedback.js";

  // Suggested quick prompts when chat is fresh or idle
  const suggestionPrompts = [
    { label: "💡 Where do I start?", prompt: "Where should I start for this task? Give me a conceptual overview." },
    { label: "🔍 How to query MongoDB?", prompt: "What is the recommended Mongoose method to query all feedback items?" },
    { label: "⚠️ Debug current error", prompt: "Can you explain the current error without giving me the direct code solution?" },
    { label: "🎯 Review my approach", prompt: "How should I structure the route response to fulfill all evaluation criteria?" },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-[#0D1214] text-[#F4F7F6] select-none border-l border-[#202A2C]">
      {/* ── Top Header ── */}
      <div className="h-14 px-4 border-b border-[#202A2C] bg-[#080C0D] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {/* Mint Sparkle Glyph Avatar */}
          <div className="h-8 w-8 rounded-xl bg-[#67D6B2]/10 border border-[#67D6B2]/25 flex items-center justify-center text-[#67D6B2] shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-[#F4F7F6] tracking-tight">AI Mentor</h2>
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#67D6B2]/10 border border-[#67D6B2]/20 text-[9px] font-semibold text-[#67D6B2]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#67D6B2] animate-pulse" />
                Socratic
              </span>
            </div>
            <p className="text-[10px] text-[#71807C] truncate max-w-[170px]">
              Task {currentTask?.order || 1} · {activeFileName}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="p-1.5 text-[#71807C] hover:text-[#F4F7F6] hover:bg-[#151D1F] rounded-lg transition-colors cursor-pointer"
              title="Reset conversation"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            className="p-1.5 text-[#71807C] hover:text-[#F4F7F6] hover:bg-[#151D1F] rounded-lg transition-colors cursor-pointer"
            title="Mentor details"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Segmented Tab Switcher (Chat vs Hints) ── */}
      <div className="px-3 py-2 border-b border-[#202A2C] bg-[#0A0F11] shrink-0">
        <div className="flex items-center p-1 rounded-xl bg-[#11181A] border border-[#202A2C]">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "chat"
                ? "bg-[#1A2427] text-[#67D6B2] shadow-sm border border-[#67D6B2]/20"
                : "text-[#71807C] hover:text-[#A9B5B2]"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Chat</span>
            {messages.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#202A2C] text-[9px] font-mono text-[#A9B5B2]">
                {messages.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("hints")}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer relative ${
              activeTab === "hints"
                ? "bg-[#1A2427] text-[#67D6B2] shadow-sm border border-[#67D6B2]/20"
                : "text-[#71807C] hover:text-[#A9B5B2]"
            }`}
          >
            <Lightbulb className="h-3.5 w-3.5" />
            <span>Hints & Checks</span>
            {isEvalFailed && (
              <span className="h-2 w-2 rounded-full bg-[#F06A6A] animate-pulse" />
            )}
            {isHintActive && !isEvalFailed && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#E9C46A]/20 text-[9px] font-mono text-[#E9C46A]">
                L{hintLevel}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Scrollable Body Area ── */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-4 select-text font-sans scrollbar-thin">
        {/* ========================================================================= */}
        {/* ── TAB 1: CHAT VIEW ── */}
        {/* ========================================================================= */}
        {activeTab === "chat" && (
          <>
            {/* Quick Nudge Trigger Banner */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-[#11181A] to-[#151D1F] border border-[#202A2C] hover:border-[#67D6B2]/40 transition-all flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-7 w-7 rounded-lg bg-[#67D6B2]/10 border border-[#67D6B2]/30 flex items-center justify-center text-[#67D6B2] shrink-0">
                  <Lightbulb className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#F4F7F6]">Need a nudge?</div>
                  <div className="text-[10px] text-[#71807C] truncate">
                    Step-by-step guidance without giving away code
                  </div>
                </div>
              </div>
              <button
                onClick={handleNeedNudge}
                disabled={isNudging}
                className="shrink-0 px-2.5 py-1.5 rounded-lg bg-[#67D6B2]/15 hover:bg-[#67D6B2] border border-[#67D6B2]/40 text-[#67D6B2] hover:text-[#080C0D] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isNudging ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <span>Nudge</span>
                    <ArrowRight className="h-3 w-3" />
                  </>
                )}
              </button>
            </div>

            {/* Empty State / Welcome Onboarding Card */}
            {messages.length === 0 && (
              <div className="space-y-4 pt-1">
                <div className="p-4 rounded-2xl bg-[#11181A] border border-[#202A2C] space-y-3 text-left">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-[#E9C46A]/15 border border-[#E9C46A]/30 flex items-center justify-center text-[#E9C46A]">
                      <Lightbulb className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#F4F7F6]">Hi {userName}!</h3>
                      <p className="text-[10px] text-[#71807C]">Your personal engineering mentor</p>
                    </div>
                  </div>

                  <p className="text-xs text-[#A9B5B2] leading-relaxed">
                    {isEvalFailed
                      ? "Your current solution encountered errors during evaluation. Ask me to help diagnose the issue or switch to the Hints tab for guided steps."
                      : `You're working on Task ${currentTask?.order || 1}: ${
                          currentTask?.title || "Implement GET /api/feedback"
                        }. Ask questions, debug concepts, or request directional nudges anytime.`}
                  </p>

                  <div className="p-2.5 rounded-xl bg-[#080C0D] border border-[#202A2C] text-[10px] text-[#71807C] flex items-center gap-2">
                    <Compass className="h-3.5 w-3.5 text-[#67D6B2] shrink-0" />
                    <span>
                      Socratic rules: I guide your reasoning and point to line ranges, but won&apos;t write the final code.
                    </span>
                  </div>
                </div>

                {/* Quick Prompts Chips */}
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-[#71807C] px-1">
                    Suggested prompts:
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {suggestionPrompts.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(s.prompt)}
                        className="w-full text-left p-2.5 rounded-xl bg-[#11181A] hover:bg-[#151D1F] border border-[#202A2C] hover:border-[#67D6B2]/40 text-xs text-[#A9B5B2] hover:text-[#F4F7F6] transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <span className="truncate pr-2">{s.label}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-[#71807C] group-hover:text-[#67D6B2] group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Message Stream */}
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1.5`}
                >
                  <div className="flex items-center gap-2 text-[10px] text-[#71807C] px-1">
                    <span className="font-medium text-[#A9B5B2]">
                      {isUser ? "You" : "AI Mentor"}
                    </span>
                    <span>•</span>
                    <span>
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div
                    className={`max-w-[95%] text-xs leading-relaxed rounded-2xl p-3.5 relative group shadow-sm ${
                      isUser
                        ? "bg-[#67D6B2]/15 border border-[#67D6B2]/35 text-[#F4F7F6] rounded-tr-none"
                        : "bg-[#11181A] border border-[#202A2C] text-[#F4F7F6] rounded-tl-none"
                    }`}
                  >
                    <MarkdownContent content={msg.content} />

                    {/* Quick copy bubble button */}
                    <button
                      onClick={() => handleCopyMessage(msg.content, msg.id)}
                      className="absolute top-2 right-2 p-1 rounded-md bg-[#151D1F]/80 text-[#71807C] hover:text-[#F4F7F6] opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      title="Copy text"
                    >
                      {copiedMessageId === msg.id ? (
                        <Check className="h-3 w-3 text-[#67D6B2]" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Thinking / Reasoning state */}
            {isLoading && (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#11181A] border border-[#202A2C] text-xs text-[#A9B5B2] animate-pulse">
                <div className="h-5 w-5 rounded-full bg-[#67D6B2]/15 flex items-center justify-center text-[#67D6B2]">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                </div>
                <span>AI Mentor is reasoning...</span>
              </div>
            )}
          </>
        )}

        {/* ========================================================================= */}
        {/* ── TAB 2: HINTS & DIAGNOSIS VIEW ── */}
        {/* ========================================================================= */}
        {activeTab === "hints" && (
          <div className="space-y-4">
            {/* 1. Evaluation Results / Error Breakdown (if tests failed) */}
            {isEvalFailed && (
              <div className="rounded-2xl bg-[#11181A] border border-[#F06A6A]/35 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => setEvalFailedExpanded((prev) => !prev)}
                  className="w-full flex items-center justify-between p-3.5 text-left hover:bg-[#151D1F] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-[#F06A6A]/15 border border-[#F06A6A]/30 flex items-center justify-center text-[#F06A6A] shrink-0">
                      <XCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#F06A6A] flex items-center gap-1.5">
                        Evaluation Failed
                      </div>
                      <div className="text-[10px] text-[#A9B5B2]">
                        0 / {evalResults?.criteriaStatus?.length || 4} criteria passed
                      </div>
                    </div>
                  </div>

                  {evalFailedExpanded ? (
                    <ChevronUp className="h-4 w-4 text-[#71807C]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[#71807C]" />
                  )}
                </button>

                {evalFailedExpanded && (
                  <div className="px-3.5 pb-3.5 pt-1 space-y-3 border-t border-[#202A2C] bg-[#0A0F11]/50">
                    {(
                      evalResults?.criteriaStatus || [
                        {
                          title: "GET /api/feedback responds with HTTP status 200",
                          feedback:
                            "The server fails to start due to a ReferenceError/SyntaxError in backend/src/models/Feedback.js at line 12: 'res' is not defined at the top level.",
                        },
                        {
                          title: "Response body is an array of feedback documents",
                          feedback: "Unable to verify because the application crashes on startup.",
                        },
                        {
                          title: "Each feedback item contains title, description, category, and votes",
                          feedback: "Unable to verify because the application crashes on startup.",
                        },
                        {
                          title: "Feedback items are sorted in descending order",
                          feedback: "Unable to verify because the application crashes on startup.",
                        },
                      ]
                    ).map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-[#11181A] border border-[#202A2C] space-y-1.5"
                      >
                        <div className="flex items-start gap-2 text-xs font-medium text-[#F4F7F6]">
                          <XCircle className="h-3.5 w-3.5 text-[#F06A6A] shrink-0 mt-0.5" />
                          <span className="leading-snug">{item.title}</span>
                        </div>
                        {item.feedback && (
                          <p className="text-[11px] text-[#71807C] pl-5 leading-relaxed bg-[#080C0D] p-2 rounded-lg border border-[#202A2C] font-mono">
                            {item.feedback}
                          </p>
                        )}
                      </div>
                    ))}

                    <button
                      onClick={handleNeedNudge}
                      disabled={isNudging}
                      className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#67D6B2]/10 hover:bg-[#67D6B2] border border-[#67D6B2]/30 text-xs font-semibold text-[#67D6B2] hover:text-[#080C0D] transition-all cursor-pointer shadow-sm"
                    >
                      <Lightbulb className="h-3.5 w-3.5" />
                      <span>Get Socratic Clue for These Errors</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 2. Progressive Socratic Clue Card */}
            {isHintActive ? (
              <div className="space-y-3.5">
                {/* Level Progress Indicator */}
                <div className="p-3 rounded-2xl bg-[#11181A] border border-[#202A2C] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#F4F7F6] flex items-center gap-1.5">
                      <Compass className="h-3.5 w-3.5 text-[#67D6B2]" />
                      Progressive Clue
                    </span>
                    <span className="text-[11px] font-mono text-[#67D6B2] font-semibold">
                      Level {hintLevel} of 3
                    </span>
                  </div>

                  {/* 3 Step Pill Bar */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <div
                      className={`h-1.5 rounded-full ${
                        hintLevel >= 1 ? "bg-[#67D6B2]" : "bg-[#202A2C]"
                      }`}
                    />
                    <div
                      className={`h-1.5 rounded-full ${
                        hintLevel >= 2 ? "bg-[#67D6B2]" : "bg-[#202A2C]"
                      }`}
                    />
                    <div
                      className={`h-1.5 rounded-full ${
                        hintLevel >= 3 ? "bg-[#67D6B2]" : "bg-[#202A2C]"
                      }`}
                    />
                  </div>

                  {/* Target line & file indicator */}
                  {activeHint && (
                    <div className="flex items-center justify-between pt-1 text-[10px] text-[#71807C]">
                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                        <FileCode className="h-3 w-3 text-[#67D6B2]" />
                        {activeHint.targetFile}
                      </span>
                      <span className="font-mono bg-[#151D1F] px-1.5 py-0.5 rounded text-[#A9B5B2]">
                        Line {activeHint.startLine}
                      </span>
                    </div>
                  )}
                </div>

                {/* Main Hint Content Card */}
                <div className="p-4 rounded-2xl bg-[#11181A] border border-[#202A2C] space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-[#E9C46A]/15 border border-[#E9C46A]/30 flex items-center justify-center text-[#E9C46A]">
                        <Lightbulb className="h-3.5 w-3.5" />
                      </div>
                      <h3 className="text-xs font-bold text-[#F4F7F6]">
                        {currentHintInfo.title}
                      </h3>
                    </div>
                    {onClearHint && (
                      <button
                        onClick={onClearHint}
                        className="text-[10px] text-[#71807C] hover:text-[#F4F7F6] underline cursor-pointer"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-[#A9B5B2] leading-relaxed">
                    {activeHint.hint || currentHintInfo.hint}
                  </p>

                  {/* Accordion: "Why this works?" */}
                  <div className="pt-2 border-t border-[#202A2C]">
                    <button
                      type="button"
                      onClick={() => setWhyWorksExpanded((prev) => !prev)}
                      className="flex items-center justify-between w-full text-left text-xs font-medium text-[#A9B5B2] hover:text-[#F4F7F6] transition-colors py-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <ChevronRight
                          className={`w-3.5 h-3.5 text-[#67D6B2] transition-transform duration-200 ${
                            whyWorksExpanded ? "rotate-90" : ""
                          }`}
                        />
                        <span>Why this works? (Deep dive)</span>
                      </div>
                    </button>

                    {whyWorksExpanded && (
                      <div className="mt-2 p-3 rounded-xl bg-[#080C0D] border border-[#202A2C] text-[11px] text-[#A9B5B2] leading-relaxed select-text animate-in fade-in space-y-2">
                        <p>{currentHintInfo.why}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Need deeper guidance button */}
                {hintLevel < 3 ? (
                  <button
                    onClick={handleNeedNudge}
                    disabled={isNudging}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-[#11181A] hover:bg-[#151D1F] border border-[#202A2C] hover:border-[#67D6B2]/50 text-xs font-semibold text-[#67D6B2] transition-all cursor-pointer shadow-sm group"
                  >
                    <span>Request Level {hintLevel + 1} Clue</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-[#11181A] border border-[#202A2C] text-center space-y-2">
                    <p className="text-xs text-[#A9B5B2]">
                      You&apos;ve reached the maximum hint specificity.
                    </p>
                    <button
                      onClick={() => {
                        setActiveTab("chat");
                        handleSend("I'm still having trouble understanding this step. Can you break down the concept further?");
                      }}
                      className="text-xs text-[#67D6B2] hover:underline font-semibold cursor-pointer"
                    >
                      Ask follow-up question in Chat →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* If no active hint */
              <div className="p-6 rounded-2xl bg-[#11181A] border border-[#202A2C] text-center space-y-3">
                <div className="h-10 w-10 mx-auto rounded-2xl bg-[#67D6B2]/10 border border-[#67D6B2]/20 flex items-center justify-center text-[#67D6B2]">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#F4F7F6]">No active hints</h3>
                  <p className="text-[11px] text-[#71807C] max-w-xs mx-auto mt-1 leading-relaxed">
                    Whenever you&apos;re unsure of where to look or why a test fails, click below to receive a progressive Socratic clue.
                  </p>
                </div>
                <button
                  onClick={handleNeedNudge}
                  disabled={isNudging}
                  className="px-4 py-2 rounded-xl bg-[#67D6B2] text-[#080C0D] text-xs font-bold hover:bg-[#82CDBD] transition-all cursor-pointer shadow-sm"
                >
                  {isNudging ? "Generating..." : "Need a nudge?"}
                </button>
              </div>
            )}

            {/* Step-by-Step Diagnostic Checklist */}
            <div className="p-3.5 rounded-2xl bg-[#080C0D] border border-[#202A2C] space-y-2.5">
              <div className="text-xs font-semibold text-[#A9B5B2] flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-[#67D6B2]" />
                Recommended debugging checklist:
              </div>
              <div className="space-y-2 text-xs text-[#71807C]">
                <div className="flex items-start gap-2.5">
                  <span className="h-4 w-4 rounded-full bg-[#151D1F] text-[#67D6B2] flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">
                    1
                  </span>
                  <span>Inspect the highlighted error line in your active file</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="h-4 w-4 rounded-full bg-[#151D1F] text-[#67D6B2] flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">
                    2
                  </span>
                  <span>Verify route exports match Express router expectations</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="h-4 w-4 rounded-full bg-[#151D1F] text-[#67D6B2] flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">
                    3
                  </span>
                  <span>Ensure async operations handle Promise resolution with await</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="h-4 w-4 rounded-full bg-[#151D1F] text-[#67D6B2] flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">
                    4
                  </span>
                  <span>Run &apos;Evaluate Task&apos; again to verify all criteria pass</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Bottom Chat Input Area ── */}
      <div className="p-3 border-t border-[#202A2C] bg-[#080C0D] shrink-0 space-y-2">
        <div className="relative flex flex-col bg-[#11181A] border border-[#202A2C] focus-within:border-[#67D6B2]/60 rounded-2xl p-2 transition-colors shadow-sm">
          {/* Active file context tag */}
          <div className="flex items-center justify-between px-1.5 pb-1 text-[10px] text-[#71807C] border-b border-[#202A2C]/60 mb-1">
            <span className="flex items-center gap-1 font-mono text-[#A9B5B2]">
              <FileCode className="h-3 w-3 text-[#67D6B2]" />
              {activeFileName}
            </span>
            <span className="text-[9px]">Shift+Enter for newline</span>
          </div>

          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything or request guidance..."
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent text-xs text-[#F4F7F6] placeholder-[#71807C] focus:outline-none resize-none py-1 px-1.5 max-h-28 overflow-y-auto scrollbar-thin"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                input.trim() && !isLoading
                  ? "bg-[#67D6B2] hover:bg-[#82CDBD] text-[#080C0D] shadow-sm shadow-[#67D6B2]/20"
                  : "bg-[#151D1F] text-[#4B5754] cursor-not-allowed"
              }`}
              title="Send message (Enter)"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <p className="text-[9px] text-[#71807C] text-center tracking-tight">
          Socratic Mentor · Promotes deep thinking, does not generate ready-made solutions
        </p>
      </div>
    </div>
  );
}
