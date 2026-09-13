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
  targetFiles?: string[];
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
    criteriaStatus?: Array<{ title: string; passed: boolean }>;
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
    <div className="w-full h-full bg-[#0c101b] flex flex-col overflow-hidden select-none">
      {/* ── Top Bar: Navigation, Badges, Title & Actions ── */}
      <div className="px-4 py-2.5 bg-[#090d16] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Left: Task order, difficulty, passed badge, title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center bg-[#131826] border border-slate-800 rounded-lg p-0.5 shrink-0">
            <button
              onClick={onPrevTask}
              disabled={currentIndex <= 0}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous Task"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] font-mono text-slate-400 px-1.5 font-semibold">
              {currentIndex + 1} / {totalTasks || 1}
            </span>
            <button
              onClick={onNextTask}
              disabled={currentIndex >= totalTasks - 1}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next Task"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
            {difficulty}
          </span>

          {taskCompleted && (
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              Passed
            </span>
          )}

          <h1 className="text-sm font-bold text-white tracking-tight truncate max-w-sm sm:max-w-md md:max-w-lg">
            {currentTask.title || "Task Instructions"}
          </h1>
        </div>

        {/* Right: Actions (View mode, Run Code, Start Server, Evaluate) */}
        <div className="flex items-center gap-2 shrink-0">
          {onChangeViewMode && (
            <div className="flex items-center bg-[#131826] border border-slate-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => onChangeViewMode("code")}
                className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all cursor-pointer ${
                  viewMode === "code"
                    ? "bg-slate-800 text-white font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Code Editor View"
              >
                <Code className="h-3 w-3" />
                <span className="hidden sm:inline">Code</span>
              </button>
              <button
                onClick={() => {
                  onChangeViewMode("split");
                  if (!isServerRunning && onStartServer) onStartServer();
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all cursor-pointer ${
                  viewMode === "split"
                    ? "bg-indigo-600 text-white font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Side-by-Side Split View"
              >
                <Columns className="h-3 w-3" />
                <span className="hidden sm:inline">Split</span>
              </button>
              <button
                onClick={() => {
                  onChangeViewMode("preview");
                  if (!isServerRunning && onStartServer) onStartServer();
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all cursor-pointer ${
                  viewMode === "preview"
                    ? "bg-cyan-600 text-white font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Full Canvas Live Preview"
              >
                <Globe className="h-3 w-3" />
                <span className="hidden sm:inline">Preview</span>
                {isServerRunning && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            </div>
          )}

          {onRunCode && (
            <button
              onClick={onRunCode}
              disabled={runningCode}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 ${
                runButtonType === "html"
                  ? "bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/25"
                  : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25"
              }`}
              title={
                runButtonType === "html"
                  ? "Preview HTML in live browser canvas"
                  : `Run ${runButtonLabel || "code"} in WebContainer`
              }
            >
              {runningCode ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span className="hidden sm:inline">Running...</span>
                </>
              ) : runButtonType === "html" ? (
                <>
                  <Globe className="h-3 w-3" />
                  <span>{runButtonLabel || "Preview HTML"}</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 fill-white" />
                  <span>{runButtonLabel || "Run"}</span>
                </>
              )}
            </button>
          )}

          {onStartServer && (
            <button
              onClick={onStartServer}
              disabled={startingServer}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 ${
                isServerRunning
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600"
              }`}
              title={
                isServerRunning
                  ? "Auth Server running - Click to open Live Preview"
                  : "Start Node.js server and view Live Preview"
              }
            >
              {startingServer ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin text-cyan-400" />
                  <span className="hidden sm:inline">Starting...</span>
                </>
              ) : isServerRunning ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <Globe className="h-3 w-3 text-cyan-400" />
                  <span className="hidden sm:inline">Preview</span>
                </>
              ) : (
                <>
                  <Globe className="h-3 w-3 text-slate-400" />
                  <span className="hidden sm:inline">Server</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onRunEvaluation}
            disabled={evaluating}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            title="Run tests and evaluate task criteria"
          >
            {evaluating ? (
              <>
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3 w-3" />
                <span>Evaluate</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Scrollable Resizable Question & Task Body ── */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3.5 text-slate-200">
        {/* Description & Target Files Header Row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
          {/* Main Description */}
          <div className="space-y-1.5 max-w-3xl flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                Question / Problem Statement
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {currentTask.description ||
                "Complete the coding requirements for this task to pass the evaluation criteria."}
            </p>
          </div>

          {/* Files you'll work with */}
          <div className="shrink-0 space-y-1">
            <div className="text-[11px] font-medium text-slate-400">
              Files you&apos;ll work with:
            </div>
            <div className="flex items-center flex-wrap gap-1.5">
              {targetFiles.map((file) => {
                const basename = file.split("/").pop() || file;
                const badge = getFileBadgeColor(basename);
                const isActive =
                  activeFilePath === file || activeFilePath.endsWith("/" + basename);

                return (
                  <button
                    key={file}
                    onClick={() => onSelectFile(file)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono transition-all border cursor-pointer ${
                      isActive
                        ? "bg-slate-800 border-indigo-500/60 text-white shadow-sm ring-1 ring-indigo-500/20"
                        : "bg-[#131826] border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white"
                    }`}
                    title={`Open ${file}`}
                  >
                    <span
                      className={`text-[9px] font-bold px-1 rounded ${badge.bg} ${badge.text}`}
                    >
                      {badge.label}
                    </span>
                    <span>{basename}</span>
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
                    className={`flex items-start gap-2 p-2 rounded-lg border text-xs transition-colors ${
                      isPassed
                        ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-200"
                        : isFailed
                        ? "bg-rose-950/20 border-rose-800/40 text-rose-200"
                        : "bg-[#141a2c]/60 border-slate-800/70 text-slate-300"
                    }`}
                  >
                    {isPassed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : isFailed ? (
                      <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                    ) : (
                      <span className="h-3.5 w-3.5 rounded-full border border-slate-600 shrink-0 mt-0.5 flex items-center justify-center text-[9px] text-slate-500 font-mono">
                        {idx + 1}
                      </span>
                    )}
                    <span className="leading-tight">{crit}</span>
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
