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
  // Chat messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isNudging, setIsNudging] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [evalFailedExpanded, setEvalFailedExpanded] = useState(true);
  const [whyWorksExpanded, setWhyWorksExpanded] = useState(false);
  const [hintLevel, setHintLevel] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isNudging, activeHint]);

  // Handle external prompt triggers
  useEffect(() => {
    if (externalPrompt) {
      handleSend(externalPrompt);
      onClearExternalPrompt?.();
    }
  }, [externalPrompt]);

  // Progressive hints dictionary for Task 1
  const hintProgression: Record<number, { title: string; hint: string; concept: string; why: string }> = {
    1: {
      title: "Hint 1 — Query the database",
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
      title: "Hint 3 — Model Methods",
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
          content: error?.message || "Failed to reach AI service. Please check your API key and connection.",
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

  const isEvalFailed = evalResults && !evalResults.passed;
  const isHintActive = Boolean(activeHint && !activeHint.isError);
  const currentHintInfo = hintProgression[hintLevel] || hintProgression[1];

  return (
    <div className="w-full h-full flex flex-col bg-[#0D1214] text-[#F4F7F6] select-none border-l border-[#202A2C]">
      {/* ── Top Header ── */}
      <div className="h-12 px-4 border-b border-[#202A2C] bg-[#080C0D] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          {/* Green-accented Robot/Sparkle Glyph */}
          <div className="h-7 w-7 rounded-lg bg-[#67D6B2]/10 border border-[#67D6B2]/20 flex items-center justify-center text-[#67D6B2]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-[#F4F7F6] tracking-tight flex items-center gap-1.5">
              AI Mentor
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#67D6B2] animate-pulse" />
            </h2>
            <p className="text-[10px] text-[#71807C]">Your coding guide</p>
          </div>
        </div>

        <button
          className="p-1.5 text-[#71807C] hover:text-[#F4F7F6] hover:bg-[#151D1F] rounded-md transition-colors"
          title="Mentor Options"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* ── Scrollable Body Area ── */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 select-text font-sans scrollbar-thin">
        {/* 1. Mentor Greeting Message Bubble matching Screenshot 1 */}
        <div className="flex items-start gap-2.5">
          {/* Avatar with yellow bulb */}
          <div className="h-6 w-6 rounded-full bg-[#E9C46A]/20 border border-[#E9C46A]/30 flex items-center justify-center text-[#E9C46A] shrink-0 mt-0.5">
            <Lightbulb className="h-3.5 w-3.5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-[#F4F7F6]">Hi {userName}!</div>
            <p className="text-xs text-[#A9B5B2] leading-relaxed mt-1">
              {isEvalFailed
                ? "Your solution didn't pass the tests. Check the errors below, fix them, and try again."
                : `You're working on Task ${currentTask?.order || 1}: ${
                    currentTask?.title || "Implement GET /api/feedback"
                  }. Need help? Click 'Need a nudge?' or ask me anything.`}
            </p>
            <div className="text-[10px] text-[#71807C] mt-1.5">10:24 AM</div>
          </div>
        </div>

        {/* 2. "Need a nudge?" Button Card matching Screenshots */}
        <button
          onClick={handleNeedNudge}
          disabled={isNudging}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-[#11181A] hover:bg-[#151D1F] border border-[#202A2C] hover:border-[#6BCDB4]/50 transition-all cursor-pointer group shadow-sm text-left disabled:opacity-50"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-lg bg-[#6BCDB4]/10 border border-[#6BCDB4]/30 flex items-center justify-center text-[#6BCDB4] group-hover:scale-105 transition-transform">
              <Lightbulb className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-semibold text-[#F4F7F6] group-hover:text-white transition-colors">
              {isNudging ? "Generating nudge..." : "Need a nudge?"}
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-[#71807C] group-hover:text-[#F4F7F6] group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* 3. Evaluation Failure Section (Visible when tests failed) */}
        {isEvalFailed && (
          <div className="space-y-3">
            {/* Expandable Evaluation Failed Card */}
            <div className="rounded-xl bg-[#11181A] border border-[#F06A6A]/30 overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setEvalFailedExpanded((prev) => !prev)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-[#151D1F] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-6 w-6 rounded-full bg-[#F06A6A]/15 border border-[#F06A6A]/30 flex items-center justify-center text-[#F06A6A] shrink-0">
                    <XCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#F06A6A]">Evaluation failed</div>
                    <div className="text-[10px] text-[#A9B5B2]">
                      0 / {evalResults?.criteriaStatus?.length || 4} tests passed
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
                <div className="px-3 pb-3 pt-1 space-y-2.5 border-t border-[#202A2C]">
                  {(evalResults?.criteriaStatus || [
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
                  ]).map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-start gap-1.5 text-xs font-medium text-[#F4F7F6]">
                        <XCircle className="h-3.5 w-3.5 text-[#F06A6A] shrink-0 mt-0.5" />
                        <span className="leading-snug">{item.title}</span>
                      </div>
                      {item.feedback && (
                        <p className="text-[11px] text-[#71807C] pl-5 leading-relaxed">
                          {item.feedback}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* "Show hints for these errors" Button (Matching Image 2) */}
            <button
              onClick={handleNeedNudge}
              disabled={isNudging}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#11181A] hover:bg-[#151D1F] border border-[#202A2C] hover:border-[#6BCDB4]/50 text-xs font-medium text-[#F4F7F6] transition-all cursor-pointer shadow-sm"
            >
              <Lightbulb className="h-3.5 w-3.5 text-[#6BCDB4]" />
              <span>Show hints for these errors</span>
            </button>

            {/* Common Next Steps matching Image 2 */}
            <div className="p-3 rounded-xl bg-[#080C0D] border border-[#202A2C] space-y-2">
              <div className="text-xs font-semibold text-[#A9B5B2]">Common next steps:</div>
              <div className="space-y-1.5 text-xs text-[#71807C]">
                <div className="flex items-start gap-2">
                  <span className="h-4 w-4 rounded-full bg-[#151D1F] text-[#A9B5B2] flex items-center justify-center text-[10px] font-mono shrink-0">
                    1
                  </span>
                  <span>Read the error messages carefully</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="h-4 w-4 rounded-full bg-[#151D1F] text-[#A9B5B2] flex items-center justify-center text-[10px] font-mono shrink-0">
                    2
                  </span>
                  <span>Check the highlighted line in your code</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="h-4 w-4 rounded-full bg-[#151D1F] text-[#A9B5B2] flex items-center justify-center text-[10px] font-mono shrink-0">
                    3
                  </span>
                  <span>Make sure the server starts without errors</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="h-4 w-4 rounded-full bg-[#151D1F] text-[#A9B5B2] flex items-center justify-center text-[10px] font-mono shrink-0">
                    4
                  </span>
                  <span>Try running the project locally</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Progressive Socratic Hint Card (Matching Image 3, 4) */}
        {isHintActive && (
          <div className="space-y-3">
            {/* Assistant message notification */}
            <div className="flex items-center gap-2 text-xs text-[#A9B5B2]">
              <div className="h-5 w-5 rounded-full bg-[#E9C46A]/20 flex items-center justify-center text-[#E9C46A]">
                <Lightbulb className="h-3 w-3" />
              </div>
              <span>Here&apos;s a hint to get you unstuck.</span>
            </div>

            {/* Hint Card */}
            <div className="p-3.5 rounded-xl bg-[#11181A] border border-[#202A2C] space-y-3 shadow-md">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-[#E9C46A]" />
                <h3 className="text-xs font-bold text-[#F4F7F6]">
                  {currentHintInfo.title}
                </h3>
              </div>

              <p className="text-xs text-[#A9B5B2] leading-relaxed">
                {currentHintInfo.hint}
              </p>

              {/* Accordion: Why this works? */}
              <div className="pt-2 border-t border-[#202A2C]">
                <button
                  type="button"
                  onClick={() => setWhyWorksExpanded((prev) => !prev)}
                  className="flex items-center justify-between w-full text-left text-xs font-medium text-[#A9B5B2] hover:text-[#F4F7F6] transition-colors py-1 cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <ChevronRight
                      className={`w-3.5 h-3.5 text-[#6BCDB4] transition-transform duration-200 ${
                        whyWorksExpanded ? "rotate-90" : ""
                      }`}
                    />
                    <span>Why this works?</span>
                  </div>
                </button>

                {whyWorksExpanded && (
                  <div className="mt-2 p-2.5 rounded-lg bg-[#080C0D] border border-[#202A2C] text-[11px] text-[#A9B5B2] leading-relaxed select-text animate-in fade-in">
                    {currentHintInfo.why}
                  </div>
                )}
              </div>
            </div>

            {/* Still stuck? Card matching Image 4 */}
            <div className="p-3 rounded-xl bg-[#11181A] border border-[#202A2C] space-y-2">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-3.5 w-3.5 text-[#6BCDB4]" />
                <span className="text-xs font-semibold text-[#F4F7F6]">Still stuck?</span>
              </div>
              <p className="text-[11px] text-[#71807C] leading-relaxed">
                Ask a follow-up or request deeper guidance.
              </p>
              {hintLevel < 3 && (
                <button
                  onClick={handleNeedNudge}
                  className="inline-flex items-center gap-1.5 text-xs text-[#6BCDB4] hover:text-[#82CDBD] font-medium transition-colors cursor-pointer pt-0.5"
                >
                  <span>Get more specific guidance</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 5. Natural Chat Messages Stream */}
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1`}
            >
              <div className="flex items-center gap-1.5 text-[10px] text-[#71807C] px-1">
                <span>{isUser ? "You" : "AI Mentor"}</span>
              </div>

              <div
                className={`max-w-[95%] text-xs leading-relaxed rounded-xl p-3 relative group ${
                  isUser
                    ? "bg-[#6BCDB4]/20 border border-[#6BCDB4]/40 text-[#F4F7F6] rounded-tr-none"
                    : "bg-[#11181A] border border-[#202A2C] text-[#F4F7F6] rounded-tl-none shadow-sm"
                }`}
              >
                <div className="space-y-1 select-text">{msg.content}</div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-[#71807C] p-2">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#6BCDB4]" />
            <span>AI Mentor is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Bottom Chat Input matching Screenshots ── */}
      <div className="p-3 border-t border-[#202A2C] bg-[#080C0D] shrink-0 space-y-2">
        <div className="flex items-center gap-2 bg-[#11181A] border border-[#202A2C] focus-within:border-[#6BCDB4]/60 rounded-xl px-3 py-1.5 transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent text-xs text-[#F4F7F6] placeholder-[#71807C] focus:outline-none resize-none py-1.5 max-h-24 overflow-y-auto"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className={`p-1.5 rounded-lg transition-all ${
              input.trim() && !isLoading
                ? "bg-[#82CDBD] hover:bg-[#6BCDB4] text-[#080C0D] cursor-pointer"
                : "text-[#71807C] cursor-not-allowed"
            }`}
            title="Send message (Enter)"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="text-[10px] text-[#71807C] text-center">
          I can help with hints, explanations, and debugging.
        </p>
      </div>
    </div>
  );
}
