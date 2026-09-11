"use client";

import React from "react";
import {
  FileCode,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Play,
  RefreshCw,
  Sparkles,
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
}: TaskHeaderProps) {
  // Extract or fall back target files
  const targetFiles = currentTask.targetFiles && currentTask.targetFiles.length > 0
    ? currentTask.targetFiles
    : ["Post.jsx", "postRoutes.js", "Post.js"];

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
    <div className="w-full bg-[#0c101b] border-b border-slate-800/80 px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0">
      {/* Left side: Task order, difficulty, title, and prompt */}
      <div className="flex-1 space-y-1.5 max-w-3xl">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 tracking-wide">
            Task {currentTask.order || currentIndex + 1}/{totalTasks || 18}
          </span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
            {difficulty}
          </span>

          {taskCompleted && (
            <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              Passed
            </span>
          )}
        </div>

        <h1 className="text-xl font-bold text-white tracking-tight leading-snug">
          {currentTask.title || "Display a single blog post"}
        </h1>

        <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
          {currentTask.description ||
            "Fetch a blog post by its id from the backend and display it title, content[render markdown] and author info"}
        </p>
      </div>

      {/* Right side: Files you'll work with + Actions */}
      <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-start lg:items-center gap-4 shrink-0">
        <div className="space-y-1.5">
          <div className="text-[11px] font-medium text-slate-400">
            Files you&apos;ll work with
          </div>
          <div className="flex items-center flex-wrap gap-2">
            {targetFiles.map((file) => {
              const basename = file.split("/").pop() || file;
              const badge = getFileBadgeColor(basename);
              const isActive =
                activeFilePath === file || activeFilePath.endsWith("/" + basename);

              return (
                <button
                  key={file}
                  onClick={() => onSelectFile(file)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all border cursor-pointer ${
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

        {/* Task navigation & evaluate button */}
        <div className="flex items-center gap-2 pt-2 md:pt-0">
          <div className="flex items-center bg-[#131826] border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={onPrevTask}
              disabled={currentIndex <= 0}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous Task"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[11px] font-mono text-slate-400 px-1">
              {currentIndex + 1}
            </span>
            <button
              onClick={onNextTask}
              disabled={currentIndex >= totalTasks - 1}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next Task"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={onRunEvaluation}
            disabled={evaluating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            title="Run tests and evaluate task criteria"
          >
            {evaluating ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-white" />
                <span>Evaluate</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
