"use client";

import React from "react";
import {
  Play,
  CheckCircle2,
  Lock,
  FileCode,
  Sparkles,
  RotateCw,
  Save,
  Check,
} from "lucide-react";
import { TaskContext } from "@/lib/ai/types";

interface TaskHeaderProps {
  task: TaskContext | null;
  currentTaskIndex: number;
  totalTasks: number;
  isCompleted?: boolean;
  isEvaluating: boolean;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  onEvaluate: () => void;
  onSave?: () => void;
  onSelectTargetFile?: (file: string) => void;
  activeFilePath?: string;
}

export default function TaskHeader({
  task,
  currentTaskIndex,
  totalTasks,
  isCompleted = false,
  isEvaluating,
  isSaving = false,
  hasUnsavedChanges = false,
  onEvaluate,
  onSave,
  onSelectTargetFile,
  activeFilePath,
}: TaskHeaderProps) {
  if (isCompleted) {
    return (
      <div className="bg-[#0D1214] border-b border-[#202A2C] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#67D6B2]/20 text-[#67D6B2] border border-[#67D6B2]/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-[#67D6B2] tracking-wider">
                Curriculum Complete
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#67D6B2]/20 text-[#67D6B2] font-semibold">
                {totalTasks} / {totalTasks} Completed
              </span>
            </div>
            <h2 className="text-sm font-bold text-white mt-0.5">
              Congratulations! You have mastered all tasks in this project.
            </h2>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="bg-[#0D1214] border-b border-[#202A2C] px-4 py-3 flex items-center justify-between">
        <div className="h-5 w-48 bg-[#202A2C] animate-pulse rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#0D1214] border-b border-[#202A2C] px-4 py-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Task Identity & Goal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {/* Step badge */}
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#1A2428] text-[#67D6B2] border border-[#67D6B2]/30">
              Task {task.order} of {totalTasks}
            </span>

            {/* Step dots progress indicator */}
            <div className="flex items-center gap-1.5 ml-1">
              {Array.from({ length: totalTasks }).map((_, idx) => {
                const isPast = idx < currentTaskIndex;
                const isCurrent = idx === currentTaskIndex;
                return (
                  <div
                    key={idx}
                    title={
                      isPast
                        ? `Task ${idx + 1}: Completed`
                        : isCurrent
                        ? `Task ${idx + 1}: Current Active Task`
                        : `Task ${idx + 1}: Locked`
                    }
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isPast
                        ? "w-4 bg-[#67D6B2]"
                        : isCurrent
                        ? "w-6 bg-[#67D6B2] shadow-sm shadow-[#67D6B2]/50 animate-pulse"
                        : "w-2 bg-[#202A2C]"
                    }`}
                  />
                );
              })}
            </div>

            {/* Target Files pills */}
            {task.targetFiles && task.targetFiles.length > 0 && (
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-[10px] text-[#71807C] font-medium">
                  Files:
                </span>
                {task.targetFiles.map((file) => {
                  const isActive = activeFilePath === file;
                  return (
                    <button
                      key={file}
                      onClick={() => onSelectTargetFile?.(file)}
                      className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-mono transition-colors cursor-pointer ${
                        isActive
                          ? "bg-[#67D6B2]/20 text-[#67D6B2] border border-[#67D6B2]/40 font-semibold"
                          : "bg-[#151D1F] text-[#A9B5B2] hover:text-white border border-[#202A2C]"
                      }`}
                    >
                      <FileCode className="w-3 h-3" />
                      {file.split("/").pop()}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Task Title & Goal */}
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm font-bold text-white truncate">
              {task.title}
            </h2>
            <span className="text-xs text-[#A9B5B2] hidden sm:inline truncate">
              — {task.goal}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          {/* Save status button */}
          {onSave && (
            <button
              onClick={onSave}
              title={
                hasUnsavedChanges
                  ? "Save changes (Ctrl+S)"
                  : "All changes saved"
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                hasUnsavedChanges
                  ? "bg-[#151D1F] text-[#E9C46A] border-[#E9C46A]/40 hover:bg-[#1A2428]"
                  : "bg-transparent text-[#71807C] border-transparent hover:bg-[#151D1F]"
              }`}
            >
              {isSaving ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
              ) : hasUnsavedChanges ? (
                <Save className="w-3.5 h-3.5 text-[#E9C46A]" />
              ) : (
                <Check className="w-3.5 h-3.5 text-[#67D6B2]" />
              )}
              <span className="hidden sm:inline">
                {isSaving
                  ? "Saving..."
                  : hasUnsavedChanges
                  ? "Save"
                  : "Saved"}
              </span>
            </button>
          )}

          {/* Primary Run Evaluation button */}
          <button
            onClick={onEvaluate}
            disabled={isEvaluating}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg font-semibold text-xs bg-gradient-to-r from-[#67D6B2] to-[#10B981] text-[#080C0D] hover:opacity-90 shadow-md shadow-[#67D6B2]/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isEvaluating ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Evaluating Code...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Evaluation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
