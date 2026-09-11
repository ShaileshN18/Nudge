"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  RotateCcw,
  Bot,
  User,
  Lightbulb,
  FileCode,
  HelpCircle,
  Bug,
  ChevronRight,
  Copy,
  Check,
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
    targetFiles?: string[];
    evaluationCriteria?: string[];
  };
  activeFilePath?: string;
  activeFileContent?: string;
  externalPrompt?: string | null;
  onClearExternalPrompt?: () => void;
}

export default function AiMentor({
  currentTask,
  activeFilePath,
  activeFileContent,
  externalPrompt,
  onClearExternalPrompt,
}: AiMentorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content: `### 👋 Hi, I'm your AI Mentor!

I'm here to guide you through **Task ${currentTask?.order || 1}: ${
        currentTask?.title || "Display a single blog post"
      }**.

Ask me for progressive hints, code reviews, or architectural explanations whenever you get stuck!`,
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle external prompt trigger (e.g. from the Aria nudge tooltip!)
  useEffect(() => {
    if (externalPrompt) {
      handleSend(externalPrompt);
      onClearExternalPrompt?.();
    }
  }, [externalPrompt]);

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
          currentTask?.title || "Display a single blog post"
        }**. What would you like to explore?`,
        timestamp: new Date(),
      },
    ]);
  };

  const quickPrompts = [
    { label: "Give me a hint", prompt: "Give me a hint for this task without giving away the full answer", icon: Lightbulb },
    { label: "Review active file", prompt: "Please review my active file and let me know if I'm on the right track", icon: FileCode },
    { label: "Explain task", prompt: "Can you explain the requirements and expected data flow for this task?", icon: HelpCircle },
    { label: "Why is code failing?", prompt: "Why might this component fail to re-render or fetch when the route changes?", icon: Bug },
  ];

  return (
    <aside className="w-80 xl:w-96 h-full flex flex-col bg-[#0b0f19] border-l border-slate-800/80 text-slate-200 select-none">
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

        <button
          onClick={handleResetChat}
          title="Reset Chat"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-md transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
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
    </aside>
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
