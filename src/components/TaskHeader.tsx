"use client";

import React, { useState } from "react";
import {
  FileCode,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Play,
  RefreshCw,
  Sparkles,
  Globe,
  Code,
  Columns,
  ListChecks,
  Target,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface TaskItem {
  _id?: string;
  order: number;
  title: string;
  description: string;
  goal?: string;
  targetFiles: string[];
  evaluationCriteria?: string[];
}

interface TaskHeaderProps {
  currentTask: TaskItem;
  totalTasks: number;
  currentIndex: number;
  difficulty?: string;
  activeFilePath: string;
  onSelectFile: (path: string) => void;
  onPrevTask: () => void;
  onNextTask: () => void;
  onRunEvaluation: () => void;
  evaluating: boolean;
  taskCompleted: boolean;
  onRunCode?: () => void;
  runningCode?: boolean;
  runButtonLabel?: string;
  runButtonType?: "html" | "node" | "test" | "general";
  onStartServer?: () => void;
  isServerRunning?: boolean;
  startingServer?: boolean;
  previewUrl?: string | null;
  viewMode?: "code" | "split" | "preview";
  onChangeViewMode?: (mode: "code" | "split" | "preview") => void;
  evalResults?: {
    passed: boolean;
    criteriaStatus?: Array<{ title: string; passed: boolean; feedback?: string }>;
    overallFeedback?: string;
  } | null;
}

export default function TaskHeader({
  currentTask,
  totalTasks,
  currentIndex,
  difficulty = "Medium",
  activeFilePath,
  onSelectFile,
  onPrevTask,
  onNextTask,
  onRunEvaluation,
  evaluating,
  taskCompleted,
  onRunCode,
  runningCode = false,
  runButtonLabel,
  runButtonType = "general",
  onStartServer,
  isServerRunning = false,
  startingServer = false,
  previewUrl,
  viewMode = "code",
  onChangeViewMode,
  evalResults,
}: TaskHeaderProps) {
  const [showFullDetails, setShowFullDetails] = useState(false);

  // Extract or fall back target files
  const targetFiles =
    currentTask.targetFiles && currentTask.targetFiles.length > 0
      ? currentTask.targetFiles
      : ["src/models/User.js", "src/controllers/authController.js", "src/middleware/auth.js"];

  const getFileBadgeColor = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "jsx" || ext === "js") {
      return { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", label: "JS" };
    }
    if (ext === "tsx" || ext === "ts") {
      return { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20", label: "TS" };
    }
    if (ext === "css") {
      return { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", label: "CSS" };
    }
    return { bg: "bg-slate-800", text: "text-slate-300", border: "border-slate-700", label: "FILE" };
  };

  return (
    <div className="w-full h-full bg-[#0d1117] flex flex-col overflow-hidden select-none border-b border-slate-800/80">
      {/* ── Top Bar: Navigation, In Progress Badge & Actions ── */}
      <div className="px-5 py-2.5 bg-[#0b0f15] border-b border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
        {/* Left: ← Task 1 of 5 < > [In progress] */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPrevTask}
            disabled={currentIndex <= 0}
            className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Previous Task"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="text-xs font-medium text-slate-300">
            Task {currentIndex + 1} of {totalTasks || 5}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={onPrevTask}
              disabled={currentIndex <= 0}
              className="p-0.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onNextTask}
              disabled={currentIndex >= totalTasks - 1}
              className="p-0.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 shrink-0">
            {taskCompleted ? "Completed" : "In progress"}
          </span>
        </div>

        {/* Right: Open Preview ↗, Evaluate */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onStartServer && (
            <button
              onClick={onStartServer}
              disabled={startingServer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141a24] hover:bg-slate-800 text-slate-200 border border-slate-700/60 text-xs font-medium shadow-sm transition-all cursor-pointer"
              title="Open Live Preview in new tab"
            >
              <span>Open Preview</span>
              <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          )}

          <button
            onClick={onRunEvaluation}
            disabled={evaluating}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2dd4bf] hover:bg-[#14b8a6] text-slate-950 text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            title="Evaluate solution against test cases"
          >
            {evaluating ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-950" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-slate-950" />
                <span>Evaluate</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Main Task Title, Description & Files You'll Work With ── */}
      <div className="flex-1 overflow-y-auto px-6 py-4 bg-[#0c1017] space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          {/* Left: Big Title and Description */}
          <div className="space-y-2 max-w-2xl flex-1">
            <h1 className="text-xl font-bold text-white tracking-tight">
              {currentTask.title || "Implement GET /api/feedback"}
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              {currentTask.description ||
                "Connect the feedback list to the database by implementing the GET /api/feedback route handler. The endpoint must retrieve all saved feedback entries from the database and return them as a JSON array."}
            </p>
          </div>

          {/* Right: Files you'll work with */}
          <div className="shrink-0 space-y-1.5 min-w-[170px]">
            <div className="text-[11px] font-medium text-slate-400">
              Files you&apos;ll work with
            </div>
            <div className="flex flex-col gap-1.5">
              {targetFiles.map((file) => {
                const basename = file.split("/").pop() || file;
                const badge = getFileBadgeColor(basename);
                const isActive =
                  activeFilePath === file || activeFilePath.endsWith("/" + basename);

                return (
                  <button
                    key={file}
                    onClick={() => onSelectFile(file)}
                    className={`flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-mono transition-all text-left cursor-pointer ${
                      isActive
                        ? "bg-slate-800/90 text-white font-medium shadow-sm border border-slate-700"
                        : "bg-[#141a24] text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-800/80"
                    }`}
                    title={`Open ${file}`}
                  >
                    <span
                      className={`text-[9px] font-bold px-1 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono`}
                    >
                      JS
                    </span>
                    <span className="truncate">{basename}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Goal / Objective Card (visible or revealed when resized taller) */}
        {currentTask.goal && currentTask.goal !== currentTask.description && (
          <div className="bg-[#101524] border border-slate-800/80 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
              <Target className="h-3.5 w-3.5 text-indigo-400" />
              <span>Objective</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pl-5">
              {currentTask.goal}
            </p>
          </div>
        )}

        {/* Evaluation Criteria Checklist (visible when resized taller) */}
        {currentTask.evaluationCriteria && currentTask.evaluationCriteria.length > 0 && (
          <div className="bg-[#101524] border border-slate-800/80 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <ListChecks className="h-3.5 w-3.5 text-indigo-400" />
                <span>Evaluation Checklist</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {evalResults?.criteriaStatus
                  ? `${evalResults.criteriaStatus.filter((c) => c.passed).length}/${
                      currentTask.evaluationCriteria.length
                    } passed`
                  : `${currentTask.evaluationCriteria.length} items`}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              {currentTask.evaluationCriteria.map((crit, idx) => {
                const status = evalResults?.criteriaStatus?.find((c) => c.title === crit);
                const isPassed = status?.passed || false;
                const isFailed = status && !status.passed;

                return (
                  <div
                    key={idx}
                    className={`flex flex-col gap-1 p-2 rounded-lg border text-xs transition-colors ${
                      isPassed
                        ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-200"
                        : isFailed
                        ? "bg-rose-950/20 border-rose-800/40 text-rose-200"
                        : "bg-[#141a2c]/60 border-slate-800/70 text-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {isPassed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : isFailed ? (
                        <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                      ) : (
                        <span className="h-3.5 w-3.5 rounded-full border border-slate-600 shrink-0 mt-0.5 flex items-center justify-center text-[9px] text-slate-500 font-mono">
                          {idx + 1}
                        </span>
                      )}
                      <span className="leading-tight font-medium">{crit}</span>
                    </div>
                    {status?.feedback && (
                      <p className={`text-[11px] pl-5.5 leading-normal ${isPassed ? "text-emerald-300/80" : "text-rose-300/90"}`}>
                        {status.feedback}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
