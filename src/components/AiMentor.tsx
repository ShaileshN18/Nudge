"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Lightbulb,
  CheckCircle2,
  XCircle,
  MessageSquare,
  BookOpen,
  Send,
  ArrowRight,
  HelpCircle,
  FileCode,
  Layers,
  RotateCw,
  Code2,
} from "lucide-react";
import {
  EvaluationResult,
  MentorChatMessage,
  NudgeLevel,
  NUDGE_LEVELS,
  NudgeResponse,
  TaskContext,
} from "@/lib/ai/types";
import EvaluationResultView from "./EvaluationResultView";

interface AiMentorProps {
  task: TaskContext | null;
  evaluationResult: EvaluationResult | null;
  isEvaluating: boolean;
  unlockedNudges: NudgeResponse[];
  currentNudgeLevel: NudgeLevel;
  isLoadingNudge: boolean;
  onRequestNudge: (level: NudgeLevel) => void;
  onReevaluate: () => void;
  onNextTask?: () => void;
  isLastTask?: boolean;
  onSendChatMessage: (message: string) => Promise<void>;
  chatMessages: MentorChatMessage[];
  isChatLoading: boolean;
  activeTab?: "task" | "nudges" | "chat" | "evaluation";
  onTabChange?: (tab: "task" | "nudges" | "chat" | "evaluation") => void;
}

export default function AiMentor({
  task,
  evaluationResult,
  isEvaluating,
  unlockedNudges,
  currentNudgeLevel,
  isLoadingNudge,
  onRequestNudge,
  onReevaluate,
  onNextTask,
  isLastTask = false,
  onSendChatMessage,
  chatMessages,
  isChatLoading,
  activeTab = "task",
  onTabChange,
}: AiMentorProps) {
  const [tab, setTab] = useState<"task" | "nudges" | "chat" | "evaluation">(activeTab);
  const [inputMessage, setInputMessage] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const currentTab = onTabChange ? activeTab : tab;
  const setResolvedTab = (newTab: "task" | "nudges" | "chat" | "evaluation") => {
    setTab(newTab);
    onTabChange?.(newTab);
  };

  useEffect(() => {
    if (currentTab === "chat") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, currentTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isChatLoading) return;
    const msg = inputMessage.trim();
    setInputMessage("");
    await onSendChatMessage(msg);
  };

  const handleNextNudge = () => {
    const nextLevel = Math.min(5, (unlockedNudges.length + 1)) as NudgeLevel;
    onRequestNudge(nextLevel);
  };

  return (
    <div className="h-full flex flex-col bg-[#0D1214] border-l border-[#202A2C] overflow-hidden">
      {/* Mentor Tab Navigation */}
      <div className="bg-[#080C0D] border-b border-[#202A2C] px-2 flex items-center gap-1 select-none overflow-x-auto no-scrollbar">
        <button
          onClick={() => setResolvedTab("task")}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
            currentTab === "task"
              ? "text-[#67D6B2] border-[#67D6B2]"
              : "text-[#71807C] hover:text-[#A9B5B2] border-transparent"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Task Spec</span>
        </button>

        <button
          onClick={() => setResolvedTab("nudges")}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
            currentTab === "nudges"
              ? "text-[#E9C46A] border-[#E9C46A]"
              : "text-[#71807C] hover:text-[#A9B5B2] border-transparent"
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Nudges</span>
          {unlockedNudges.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#E9C46A]/20 text-[#E9C46A] font-bold">
              {unlockedNudges.length}/5
            </span>
          )}
        </button>

        <button
          onClick={() => setResolvedTab("chat")}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
            currentTab === "chat"
              ? "text-[#76A8FF] border-[#76A8FF]"
              : "text-[#71807C] hover:text-[#A9B5B2] border-transparent"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Socratic Chat</span>
        </button>

        <button
          onClick={() => setResolvedTab("evaluation")}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
            currentTab === "evaluation"
              ? "text-white border-white"
              : "text-[#71807C] hover:text-[#A9B5B2] border-transparent"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Evaluation</span>
          {evaluationResult && (
            <span
              className={`w-2 h-2 rounded-full ${
                evaluationResult.status === "pass" ? "bg-[#67D6B2]" : "bg-[#F06A6A]"
              }`}
            />
          )}
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: TASK SPEC */}
        {currentTab === "task" && task && (
          <div className="space-y-4 text-xs">
            {/* Goal Card */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#11181A] to-[#080C0D] border border-[#202A2C]">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-[#67D6B2]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#67D6B2]">
                  Task Goal
                </span>
              </div>
              <p className="text-sm font-semibold text-white leading-snug">
                {task.goal}
              </p>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#71807C]">
                Description
              </h4>
              <p className="text-xs text-[#A9B5B2] leading-relaxed">
                {task.description}
              </p>
            </div>

            {/* Step-by-Step Instructions */}
            {task.instructions && (
              <div className="space-y-2 p-3.5 rounded-xl bg-[#11181A] border border-[#202A2C]">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#67D6B2] flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" />
                  Implementation Guide
                </h4>
                <div className="text-xs text-[#F4F7F6] space-y-1.5 whitespace-pre-line leading-relaxed font-sans">
                  {task.instructions}
                </div>
              </div>
            )}

            {/* Target Files */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#71807C]">
                Target Files
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {task.targetFiles.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#151D1F] border border-[#202A2C] font-mono text-xs text-[#67D6B2]"
                  >
                    <FileCode className="w-3 h-3" />
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Acceptance Criteria Checklist */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#71807C]">
                Acceptance Criteria
              </h4>
              <div className="space-y-1.5">
                {task.evaluationCriteria.map((criterion, idx) => {
                  const critStatus = evaluationResult?.criteriaResults.find(
                    (c) =>
                      c.title.toLowerCase().includes(criterion.toLowerCase().slice(0, 15)) ||
                      criterion.toLowerCase().includes(c.title.toLowerCase().slice(0, 15))
                  );
                  const isPassed = critStatus?.status === "pass";
                  const isFailed = critStatus?.status === "fail";

                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border flex items-start gap-2.5 transition-colors ${
                        isPassed
                          ? "bg-[#0D1614] border-[#67D6B2]/30 text-[#F4F7F6]"
                          : isFailed
                          ? "bg-[#180E10] border-[#F06A6A]/30 text-[#FCA5A5]"
                          : "bg-[#11181A] border-[#202A2C] text-[#A9B5B2]"
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isPassed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#67D6B2]" />
                        ) : isFailed ? (
                          <XCircle className="w-3.5 h-3.5 text-[#F06A6A]" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-[#4B5754] flex items-center justify-center text-[9px] font-mono">
                            {idx + 1}
                          </div>
                        )}
                      </div>
                      <span className="text-xs leading-snug flex-1">
                        {criterion}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROGRESSIVE NUDGES */}
        {currentTab === "nudges" && (
          <div className="space-y-4">
            {/* Nudge Ladder Visual Progress */}
            <div className="p-3.5 rounded-xl bg-[#11181A] border border-[#202A2C] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#E9C46A] flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" />
                  Socratic Nudge Ladder
                </span>
                <span className="text-xs text-[#71807C]">
                  Level {unlockedNudges.length} of 5
                </span>
              </div>

              {/* Ladder Dots */}
              <div className="grid grid-cols-5 gap-1.5">
                {([1, 2, 3, 4, 5] as NudgeLevel[]).map((lvl) => {
                  const isUnlocked = unlockedNudges.some((n) => n.level >= lvl);
                  const isCurrent = unlockedNudges.length === lvl;
                  return (
                    <div
                      key={lvl}
                      className={`h-1.5 rounded-full transition-all ${
                        isUnlocked
                          ? "bg-[#E9C46A]"
                          : "bg-[#202A2C]"
                      } ${isCurrent ? "animate-pulse" : ""}`}
                      title={`Level ${lvl}: ${NUDGE_LEVELS[lvl].name}`}
                    />
                  );
                })}
              </div>

              {/* Request Next Level Button */}
              {unlockedNudges.length < 5 ? (
                <button
                  onClick={handleNextNudge}
                  disabled={isLoadingNudge}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold text-xs bg-gradient-to-r from-[#E9C46A] to-[#D4A373] text-[#080C0D] hover:opacity-90 shadow-md shadow-[#E9C46A]/10 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoadingNudge ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Thinking Socratic Nudge...</span>
                    </>
                  ) : (
                    <>
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>
                        Unlock Level {unlockedNudges.length + 1}:{" "}
                        {NUDGE_LEVELS[(unlockedNudges.length + 1) as NudgeLevel]?.name}
                      </span>
                    </>
                  )}
                </button>
              ) : (
                <p className="text-[11px] text-center text-[#71807C] pt-1">
                  All 5 progressive hint levels unlocked for this task.
                </p>
              )}
            </div>

            {/* Unlocked Nudges List */}
            {unlockedNudges.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-[#11181A]/50 border border-[#202A2C] text-[#71807C] space-y-2">
                <Lightbulb className="w-8 h-8 text-[#202A2C] mx-auto" />
                <p className="text-xs text-[#A9B5B2]">
                  Stuck on this task?
                </p>
                <p className="text-[11px]">
                  Request progressive Socratic hints. Level 1 starts with a conceptual orientation question to guide your reasoning.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {unlockedNudges.map((nudge, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-gradient-to-br from-[#11181A] to-[#0D1214] border border-[#E9C46A]/30 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#E9C46A]/15 text-[#E9C46A] border border-[#E9C46A]/30">
                        Level {nudge.level}: {nudge.levelName}
                      </span>
                      {nudge.targetFile && (
                        <span className="text-[10px] text-[#71807C] font-mono">
                          {nudge.targetFile}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-white">
                      {nudge.title}
                    </h4>

                    <p className="text-xs text-[#F4F7F6] leading-relaxed">
                      {nudge.hint}
                    </p>

                    {nudge.pseudocode && (
                      <div className="mt-2 p-2.5 rounded bg-[#080C0D] border border-[#202A2C] font-mono text-[11px] text-[#E9C46A] whitespace-pre-wrap">
                        {nudge.pseudocode}
                      </div>
                    )}

                    {nudge.codeSnippet && (
                      <div className="mt-2 p-2.5 rounded bg-[#080C0D] border border-[#202A2C] font-mono text-[11px] text-[#67D6B2] whitespace-pre-wrap">
                        {nudge.codeSnippet}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SOCRATIC CHAT */}
        {currentTab === "chat" && (
          <div className="h-full flex flex-col space-y-3">
            {/* Messages */}
            <div className="flex-1 space-y-3 min-h-[250px]">
              {chatMessages.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-[#11181A]/50 border border-[#202A2C] text-[#71807C] space-y-2">
                  <MessageSquare className="w-8 h-8 text-[#202A2C] mx-auto" />
                  <p className="text-xs text-[#A9B5B2]">
                    Chat with your Socratic AI Mentor
                  </p>
                  <p className="text-[11px]">
                    Ask about concepts, request debugging guidance, or clarify task requirements. Your mentor coaches your thinking and never dumps completed code solutions.
                  </p>
                </div>
              ) : (
                chatMessages.map((msg, i) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={i}
                      className={`flex flex-col ${
                        isUser ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] p-3 rounded-xl text-xs leading-relaxed ${
                          isUser
                            ? "bg-[#67D6B2]/15 text-white border border-[#67D6B2]/30 rounded-br-none"
                            : "bg-[#151D1F] text-[#F4F7F6] border border-[#202A2C] rounded-bl-none"
                        }`}
                      >
                        <div className="whitespace-pre-wrap font-sans">
                          {msg.content}
                        </div>
                      </div>
                      <span className="text-[10px] text-[#71807C] mt-1 px-1">
                        {isUser ? "You" : "Socratic AI Mentor"}
                      </span>
                    </div>
                  );
                })
              )}
              {isChatLoading && (
                <div className="flex items-center gap-2 text-xs text-[#71807C] p-2 bg-[#11181A] rounded-lg border border-[#202A2C] animate-pulse">
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-[#67D6B2]" />
                  <span>AI Mentor is thinking...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              <button
                type="button"
                onClick={() => onSendChatMessage("What programming concept should I focus on for this task?")}
                className="text-[10px] px-2 py-1 rounded bg-[#11181A] hover:bg-[#151D1F] border border-[#202A2C] text-[#A9B5B2] transition-colors cursor-pointer"
              >
                What concept is this?
              </button>
              <button
                type="button"
                onClick={() => onSendChatMessage("How do I structure the return value according to criteria?")}
                className="text-[10px] px-2 py-1 rounded bg-[#11181A] hover:bg-[#151D1F] border border-[#202A2C] text-[#A9B5B2] transition-colors cursor-pointer"
              >
                Return value format?
              </button>
              <button
                type="button"
                onClick={() => onSendChatMessage("Help me reason through any edge cases for this step.")}
                className="text-[10px] px-2 py-1 rounded bg-[#11181A] hover:bg-[#151D1F] border border-[#202A2C] text-[#A9B5B2] transition-colors cursor-pointer"
              >
                Edge cases?
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="pt-1">
              <div className="flex items-center gap-2 bg-[#11181A] border border-[#202A2C] focus-within:border-[#67D6B2] rounded-xl p-1.5">
                <input
                  type="text"
                  placeholder="Ask a question or request guidance..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={isChatLoading}
                  className="flex-1 bg-transparent px-2 text-xs text-white placeholder-[#71807C] outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isChatLoading}
                  className="p-1.5 rounded-lg bg-[#67D6B2] text-[#080C0D] hover:opacity-90 transition-opacity disabled:opacity-30 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: EVALUATION */}
        {currentTab === "evaluation" && (
          <div>
            {evaluationResult ? (
              <EvaluationResultView
                result={evaluationResult}
                isEvaluating={isEvaluating}
                onReevaluate={onReevaluate}
                onRequestNudge={() => {
                  setResolvedTab("nudges");
                  if (unlockedNudges.length === 0) {
                    onRequestNudge(1);
                  }
                }}
                onNextTask={onNextTask}
                isLastTask={isLastTask}
              />
            ) : (
              <div className="p-8 text-center rounded-xl bg-[#11181A]/50 border border-[#202A2C] text-[#71807C] space-y-3">
                <Layers className="w-8 h-8 text-[#202A2C] mx-auto" />
                <h4 className="text-xs font-semibold text-white">
                  No Evaluation Run Yet
                </h4>
                <p className="text-[11px] max-w-xs mx-auto">
                  Click &ldquo;Run Evaluation&rdquo; in the top bar to statically analyze your code against the task acceptance criteria.
                </p>
                <button
                  onClick={onReevaluate}
                  disabled={isEvaluating}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-xs bg-[#67D6B2] text-[#080C0D] hover:opacity-90 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Run Static Evaluation
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
