"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  Trophy,
  CheckCircle,
  Share2,
  Home,
  LogOut,
  FolderTree,
  Bot,
  RotateCcw,
} from "lucide-react";
import NudgeLogo from "./NudgeLogo";
import FileTree, { WorkspaceFile } from "./FileTree";
import CodeEditor from "./CodeEditor";
import TaskHeader from "./TaskHeader";
import AiMentor from "./AiMentor";
import {
  EvaluationResult,
  MentorChatMessage,
  NudgeLevel,
  NudgeResponse,
  TaskContext,
} from "@/lib/ai/types";
import { callPuterChat } from "@/lib/ai/puterClient";
import {
  buildEvaluatorPrompt,
  EVALUATOR_SYSTEM_PROMPT,
} from "@/lib/ai/prompts/evaluatorPrompts";
import {
  buildNudgePrompt,
  buildSocraticChatPrompt,
  SOCRATIC_MENTOR_SYSTEM_PROMPT,
} from "@/lib/ai/prompts/nudgePrompts";
import { extractJsonFromResponse } from "@/lib/ai/evaluatorService";

interface CodingEnvironmentProps {
  projectSlug: string;
  initialData?: any;
}

export default function CodingEnvironment({
  projectSlug,
  initialData,
}: CodingEnvironmentProps) {
  const router = useRouter();

  // State
  const [projectTitle, setProjectTitle] = useState(
    initialData?.project?.title || "Project Workspace"
  );
  const [files, setFiles] = useState<WorkspaceFile[]>(
    initialData?.files || []
  );
  const [activeFilePath, setActiveFilePath] = useState<string>(
    initialData?.activeFilePath || initialData?.files?.[0]?.path || ""
  );
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [task, setTask] = useState<TaskContext | null>(
    initialData?.currentTask || null
  );
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number>(
    initialData?.currentTaskIndex || 0
  );
  const [totalTasks, setTotalTasks] = useState<number>(
    initialData?.totalTasks || 3
  );
  const [isCompleted, setIsCompleted] = useState<boolean>(
    initialData?.isCompleted || false
  );

  // AI & Evaluation State
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [unlockedNudges, setUnlockedNudges] = useState<NudgeResponse[]>([]);
  const [isLoadingNudge, setIsLoadingNudge] = useState(false);
  const [chatMessages, setChatMessages] = useState<MentorChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [mentorActiveTab, setMentorActiveTab] = useState<"task" | "nudges" | "chat" | "evaluation">("task");

  // Save & UI layout state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showFileTree, setShowFileTree] = useState(true);
  const [showAiMentor, setShowAiMentor] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize tabs and workspace
  useEffect(() => {
    if (!initialData) {
      fetchWorkspace();
    } else {
      initializeWorkspaceData(initialData);
    }
  }, [projectSlug]);

  const initializeWorkspaceData = (data: any) => {
    if (data.project?.title) setProjectTitle(data.project.title);
    if (Array.isArray(data.files)) {
      setFiles(data.files);
      const initialActive =
        data.activeFilePath ||
        data.files[0]?.path ||
        "";
      setActiveFilePath(initialActive);
      setOpenTabs(initialActive ? [initialActive] : []);
    }
    if (data.currentTask) setTask(data.currentTask);
    if (typeof data.currentTaskIndex === "number") setCurrentTaskIndex(data.currentTaskIndex);
    if (typeof data.totalTasks === "number") setTotalTasks(data.totalTasks);
    if (typeof data.isCompleted === "boolean") {
      setIsCompleted(data.isCompleted);
      if (data.isCompleted) setShowCompletionModal(true);
    }
  };

  const fetchWorkspace = async () => {
    try {
      const res = await fetch(`/api/user-projects/${projectSlug}`);
      if (res.status === 401) {
        router.push(`/login?redirect=/projects/${projectSlug}`);
        return;
      }
      const json = await res.json();
      if (json.success && json.data) {
        initializeWorkspaceData(json.data);
      }
    } catch (err) {
      console.error("Failed to load workspace:", err);
    }
  };

  // Debounced auto-save
  const triggerAutoSave = useCallback(
    (updatedFiles: WorkspaceFile[], activePath: string) => {
      setHasUnsavedChanges(true);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          await fetch(`/api/user-projects/${projectSlug}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              files: updatedFiles,
              activeFilePath: activePath,
            }),
          });
          setHasUnsavedChanges(false);
        } catch (err) {
          console.warn("Auto-save failed:", err);
        } finally {
          setIsSaving(false);
        }
      }, 1200);
    },
    [projectSlug]
  );

  const handleManualSave = async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setIsSaving(true);
    try {
      await fetch(`/api/user-projects/${projectSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files,
          activeFilePath,
        }),
      });
      setHasUnsavedChanges(false);
    } catch (err) {
      console.warn("Manual save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Tab & File switching
  const handleSelectFile = (path: string) => {
    setActiveFilePath(path);
    if (!openTabs.includes(path)) {
      setOpenTabs([...openTabs, path]);
    }
  };

  const handleCloseTab = (path: string) => {
    const nextTabs = openTabs.filter((t) => t !== path);
    setOpenTabs(nextTabs);
    if (activeFilePath === path) {
      const nextActive = nextTabs[nextTabs.length - 1] || "";
      setActiveFilePath(nextActive);
    }
  };

  const handleChangeContent = (newContent: string) => {
    const updatedFiles = files.map((f) =>
      f.path === activeFilePath ? { ...f, content: newContent } : f
    );
    setFiles(updatedFiles);
    triggerAutoSave(updatedFiles, activeFilePath);
  };

  const handleCreateFile = async (newPath: string) => {
    const cleanPath = newPath.replace(/^\/+/, "");
    if (files.some((f) => f.path === cleanPath)) return;

    const newFile: WorkspaceFile = { path: cleanPath, content: "" };
    const updatedFiles = [...files, newFile];
    setFiles(updatedFiles);
    setActiveFilePath(cleanPath);
    if (!openTabs.includes(cleanPath)) {
      setOpenTabs([...openTabs, cleanPath]);
    }

    await fetch(`/api/user-projects/${projectSlug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file: newFile,
        activeFilePath: cleanPath,
      }),
    });
  };

  const handleDeleteFile = async (deletePath: string) => {
    const updatedFiles = files.filter((f) => f.path !== deletePath);
    setFiles(updatedFiles);
    handleCloseTab(deletePath);

    await fetch(`/api/user-projects/${projectSlug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deleteFilePath: deletePath,
      }),
    });
  };

  // Evaluation Pipeline
  const handleRunEvaluation = async () => {
    if (!task || isEvaluating) return;

    setIsEvaluating(true);
    setMentorActiveTab("evaluation");

    // Force save first
    if (hasUnsavedChanges) {
      await handleManualSave();
    }

    let clientEvaluationJson = null;

    // Try Puter.js in browser for zero-secret Gemini evaluation
    try {
      const evalPrompt = `${EVALUATOR_SYSTEM_PROMPT}\n\n${buildEvaluatorPrompt(
        task,
        files
      )}`;
      const rawResponse = await callPuterChat(evalPrompt, {
        model: "gemini-2.0-flash",
        timeoutMs: 30000,
      });
      clientEvaluationJson = extractJsonFromResponse(rawResponse);
    } catch (puterErr) {
      console.warn("Puter.js client evaluation fell back to server static evaluation:", puterErr);
    }

    try {
      const res = await fetch(`/api/user-projects/${projectSlug}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientEvaluationResult: clientEvaluationJson,
          currentFiles: files,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const evalData = json.data.evaluation;
        setEvaluationResult(evalData);

        if (json.data.passed) {
          // Advance task state
          if (json.data.isCompleted) {
            setIsCompleted(true);
            setShowCompletionModal(true);
          } else if (json.data.nextTask) {
            setTask(json.data.nextTask);
            setCurrentTaskIndex(json.data.currentTaskIndex);
            setUnlockedNudges([]); // Reset nudges for new task
          }
        }
      }
    } catch (err) {
      console.error("Evaluation request failed:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Socratic Progressive Nudge Pipeline
  const handleRequestNudge = async (level: NudgeLevel) => {
    if (!task || isLoadingNudge) return;

    setIsLoadingNudge(true);
    setMentorActiveTab("nudges");

    let clientNudgeJson = null;

    // Try Puter.js for progressive hint generation
    try {
      const nudgePrompt = `${SOCRATIC_MENTOR_SYSTEM_PROMPT}\n\n${buildNudgePrompt(
        task,
        files,
        level,
        activeFilePath,
        evaluationResult?.overallFeedback
      )}`;
      const rawResponse = await callPuterChat(nudgePrompt, {
        model: "gemini-2.0-flash",
        timeoutMs: 25000,
      });
      clientNudgeJson = extractJsonFromResponse(rawResponse);
    } catch (puterErr) {
      console.warn("Puter.js nudge generation fell back to baseline:", puterErr);
    }

    try {
      const res = await fetch(`/api/user-projects/${projectSlug}/nudge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          clientNudgeJson,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const newNudge: NudgeResponse = json.data;
        // Append or update in unlocked nudges
        setUnlockedNudges((prev) => {
          const exists = prev.some((n) => n.level === newNudge.level);
          if (exists) return prev;
          return [...prev, newNudge].sort((a, b) => a.level - b.level);
        });
      }
    } catch (err) {
      console.error("Nudge request failed:", err);
    } finally {
      setIsLoadingNudge(false);
    }
  };

  // Socratic Mentor Chat
  const handleSendChatMessage = async (msg: string) => {
    if (!task || isChatLoading) return;

    const userMsg: MentorChatMessage = {
      role: "user",
      content: msg,
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    let mentorReply = "";

    // Try Puter.js in browser
    try {
      const chatPrompt = `${SOCRATIC_MENTOR_SYSTEM_PROMPT}\n\n${buildSocraticChatPrompt(
        task,
        files,
        [...chatMessages, userMsg],
        msg,
        activeFilePath
      )}`;
      const rawResponse = await callPuterChat(chatPrompt, {
        model: "gemini-2.0-flash",
        timeoutMs: 25000,
      });
      mentorReply = typeof rawResponse === "string" ? rawResponse : String(rawResponse);
    } catch (puterErr) {
      console.warn("Puter.js chat fell back to server:", puterErr);
      try {
        const res = await fetch(`/api/user-projects/${projectSlug}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: msg,
            chatHistory: [...chatMessages, userMsg],
          }),
        });
        const json = await res.json();
        if (json.success && json.data?.reply) {
          mentorReply = json.data.reply;
        }
      } catch {
        mentorReply = "Focus on the acceptance criteria for this task. Which specific requirement is unclear?";
      }
    }

    if (mentorReply) {
      const assistantMsg: MentorChatMessage = {
        role: "assistant",
        content: mentorReply,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, assistantMsg]);
    }

    setIsChatLoading(false);
  };

  const handleAdvanceToNextTask = () => {
    setMentorActiveTab("task");
    setEvaluationResult(null);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#080C0D] text-[#F4F7F6] overflow-hidden select-none">
      {/* Top Navbar */}
      <header className="h-12 bg-[#0D1214] border-b border-[#202A2C] px-3 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-lg text-[#71807C] hover:text-white hover:bg-[#151D1F] transition-colors"
            title="Back to Projects"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <NudgeLogo size="sm" withLink={false} />

          <span className="text-[#4B5754]">/</span>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white max-w-[200px] truncate">
              {projectTitle}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#151D1F] text-[#67D6B2] border border-[#202A2C]">
              {isCompleted
                ? "Completed"
                : `Task ${currentTaskIndex + 1} of ${totalTasks}`}
            </span>
          </div>
        </div>

        {/* View toggles & Nav actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFileTree(!showFileTree)}
            title="Toggle File Tree"
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer ${
              showFileTree
                ? "bg-[#151D1F] text-[#67D6B2] border border-[#67D6B2]/30"
                : "text-[#71807C] hover:text-white"
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowAiMentor(!showAiMentor)}
            title="Toggle AI Mentor Panel"
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer ${
              showAiMentor
                ? "bg-[#151D1F] text-[#67D6B2] border border-[#67D6B2]/30"
                : "text-[#71807C] hover:text-white"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-[#202A2C] mx-1" />

          <Link
            href="/"
            className="p-1.5 rounded-lg text-[#71807C] hover:text-white hover:bg-[#151D1F] transition-colors"
            title="Home"
          >
            <Home className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Workspace Area (3-Pane Layout) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: File Tree */}
        {showFileTree && (
          <div className="w-56 shrink-0 h-full">
            <FileTree
              files={files}
              activeFile={activeFilePath}
              targetFiles={task?.targetFiles || []}
              onSelectFile={handleSelectFile}
              onCreateFile={handleCreateFile}
              onDeleteFile={handleDeleteFile}
            />
          </div>
        )}

        {/* Center Pane: Task Header + Monaco Code Editor */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <TaskHeader
            task={task}
            currentTaskIndex={currentTaskIndex}
            totalTasks={totalTasks}
            isCompleted={isCompleted}
            isEvaluating={isEvaluating}
            isSaving={isSaving}
            hasUnsavedChanges={hasUnsavedChanges}
            onEvaluate={handleRunEvaluation}
            onSave={handleManualSave}
            onSelectTargetFile={handleSelectFile}
            activeFilePath={activeFilePath}
          />

          <div className="flex-1 min-h-0">
            <CodeEditor
              files={files}
              activeFilePath={activeFilePath}
              openTabs={openTabs}
              targetFiles={task?.targetFiles || []}
              onSelectTab={handleSelectFile}
              onCloseTab={handleCloseTab}
              onChangeContent={handleChangeContent}
              onSave={handleManualSave}
              onEvaluate={handleRunEvaluation}
            />
          </div>
        </div>

        {/* Right Pane: AI Mentor & Socratic Nudge Panel */}
        {showAiMentor && (
          <div className="w-96 shrink-0 h-full">
            <AiMentor
              task={task}
              evaluationResult={evaluationResult}
              isEvaluating={isEvaluating}
              unlockedNudges={unlockedNudges}
              currentNudgeLevel={
                (unlockedNudges.length > 0
                  ? unlockedNudges[unlockedNudges.length - 1].level
                  : 1) as NudgeLevel
              }
              isLoadingNudge={isLoadingNudge}
              onRequestNudge={handleRequestNudge}
              onReevaluate={handleRunEvaluation}
              onNextTask={handleAdvanceToNextTask}
              isLastTask={currentTaskIndex >= totalTasks - 1}
              onSendChatMessage={handleSendChatMessage}
              chatMessages={chatMessages}
              isChatLoading={isChatLoading}
              activeTab={mentorActiveTab}
              onTabChange={setMentorActiveTab}
            />
          </div>
        )}
      </div>

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#11181A] to-[#080C0D] border border-[#67D6B2]/40 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl shadow-[#67D6B2]/20 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#67D6B2] to-[#10B981] mx-auto flex items-center justify-center text-[#080C0D] shadow-lg shadow-[#67D6B2]/30">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-xs uppercase font-bold text-[#67D6B2] tracking-wider">
                Curriculum Mastered
              </span>
              <h3 className="text-xl font-black text-white">
                Project Complete!
              </h3>
              <p className="text-xs text-[#A9B5B2] leading-relaxed">
                You built the entire project step-by-step and passed all static code verification milestones.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#080C0D] border border-[#202A2C] flex items-center justify-around text-xs">
              <div>
                <span className="text-[#71807C] block text-[10px] uppercase">
                  Tasks Completed
                </span>
                <span className="font-bold text-white text-base">
                  {totalTasks} / {totalTasks}
                </span>
              </div>
              <div className="h-8 w-[1px] bg-[#202A2C]" />
              <div>
                <span className="text-[#71807C] block text-[10px] uppercase">
                  Evaluation
                </span>
                <span className="font-bold text-[#67D6B2] text-base">
                  100% Passed
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowCompletionModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#151D1F] hover:bg-[#202A2C] text-white transition-colors cursor-pointer"
              >
                Review Workspace
              </button>
              <Link
                href="/"
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#67D6B2] to-[#10B981] text-[#080C0D] hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
              >
                <span>Browse Projects</span>
                <Sparkles className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
