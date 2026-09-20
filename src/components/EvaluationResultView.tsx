"use client";

import React from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Lightbulb,
  Bug,
  ListOrdered,
  RotateCw,
} from "lucide-react";
import { EvaluationResult } from "@/lib/ai/types";

interface EvaluationResultViewProps {
  result: EvaluationResult;
  isEvaluating?: boolean;
  onReevaluate?: () => void;
  onRequestNudge?: () => void;
  onNextTask?: () => void;
  isLastTask?: boolean;
}

export default function EvaluationResultView({
  result,
  isEvaluating = false,
  onReevaluate,
  onRequestNudge,
  onNextTask,
  isLastTask = false,
}: EvaluationResultViewProps) {
  const isPass = result.status === "pass";
  const passCount = result.criteriaResults.filter((c) => c.status === "pass").length;
  const totalCount = result.criteriaResults.length;

  return (
    <div className="space-y-4">
      {/* Header Status Card */}
      <div
        className={`p-4 rounded-xl border transition-all ${
          isPass
            ? "bg-gradient-to-br from-[#67D6B2]/10 via-[#0D1614] to-[#080C0D] border-[#67D6B2]/40 shadow-lg shadow-[#67D6B2]/10"
            : "bg-gradient-to-br from-[#F06A6A]/10 via-[#180E10] to-[#080C0D] border-[#F06A6A]/40 shadow-lg shadow-[#F06A6A]/10"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-lg flex items-center justify-center ${
                isPass
                  ? "bg-[#67D6B2]/20 text-[#67D6B2]"
                  : "bg-[#F06A6A]/20 text-[#F06A6A]"
              }`}
            >
              {isPass ? (
                <CheckCircle2 className="w-6 h-6 animate-pulse" />
              ) : (
                <XCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  {isPass ? "Task Passed & Verified!" : "Task Needs Revision"}
                </h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isPass
                      ? "bg-[#67D6B2]/20 text-[#67D6B2] border border-[#67D6B2]/30"
                      : "bg-[#F06A6A]/20 text-[#F06A6A] border border-[#F06A6A]/30"
                  }`}
                >
                  {passCount} / {totalCount} Criteria Satisfied
                </span>
              </div>
              <p className="text-xs text-[#A9B5B2] mt-0.5">
                {isPass
                  ? "Static code analysis confirmed all requirements are satisfied."
                  : "Static evaluation identified missing requirements or bugs."}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`text-2xl font-black ${
                isPass ? "text-[#67D6B2]" : "text-[#F06A6A]"
              }`}
            >
              {result.score}%
            </span>
          </div>
        </div>

        {/* Overall feedback */}
        <div className="mt-3 pt-3 border-t border-white/5 text-xs text-[#F4F7F6] leading-relaxed">
          {result.overallFeedback}
        </div>

        {/* Action Button */}
        <div className="mt-4 flex items-center gap-2">
          {isPass ? (
            <button
              onClick={onNextTask}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm bg-gradient-to-r from-[#67D6B2] to-[#10B981] text-[#080C0D] hover:opacity-90 shadow-md shadow-[#67D6B2]/20 transition-all cursor-pointer"
            >
              {isLastTask ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  View Project Completion
                </>
              ) : (
                <>
                  Advance to Next Task
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <div className="w-full grid grid-cols-2 gap-2">
              <button
                onClick={onRequestNudge}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-xs bg-[#E9C46A]/15 text-[#E9C46A] border border-[#E9C46A]/30 hover:bg-[#E9C46A]/25 transition-all cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                Get Socratic Nudge
              </button>
              <button
                onClick={onReevaluate}
                disabled={isEvaluating}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-xs bg-[#202A2C] text-[#F4F7F6] hover:bg-[#2A3739] transition-all cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isEvaluating ? "animate-spin" : ""}`} />
                Re-evaluate Code
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Next Step Guidance Banner */}
      {result.nextStep && (
        <div className="p-3.5 rounded-lg bg-[#11181A] border border-[#202A2C] flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[#67D6B2] shrink-0 mt-0.5" />
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-[#67D6B2] block">
              Recommended Next Step
            </span>
            <p className="text-xs text-[#F4F7F6] mt-0.5 leading-relaxed">
              {result.nextStep}
            </p>
          </div>
        </div>
      )}

      {/* Detailed Acceptance Criteria Status */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-[#A9B5B2] uppercase tracking-wider flex items-center gap-1.5">
          <ListOrdered className="w-3.5 h-3.5 text-[#67D6B2]" />
          Criteria Breakdown
        </h4>

        <div className="space-y-2">
          {result.criteriaResults.map((criterion, idx) => {
            const passed = criterion.status === "pass";
            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border transition-all ${
                  passed
                    ? "bg-[#0D1614]/60 border-[#67D6B2]/20"
                    : "bg-[#180E10]/60 border-[#F06A6A]/25"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">
                    {passed ? (
                      <CheckCircle2 className="w-4 h-4 text-[#67D6B2]" />
                    ) : (
                      <XCircle className="w-4 h-4 text-[#F06A6A]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-medium leading-snug ${
                        passed ? "text-[#F4F7F6]" : "text-[#FCA5A5]"
                      }`}
                    >
                      {criterion.title}
                    </p>

                    {criterion.feedback && (
                      <p className="text-[11px] text-[#A9B5B2] mt-1 leading-normal">
                        {criterion.feedback}
                      </p>
                    )}

                    {criterion.evidence && (
                      <div className="mt-1.5 text-[10px] text-[#71807C] font-mono bg-[#080C0D] px-2 py-1 rounded border border-[#202A2C] break-all">
                        {criterion.evidence}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bugs Identified (if any) */}
      {result.bugs && result.bugs.length > 0 && (
        <div className="p-3 rounded-lg bg-[#180E10]/80 border border-[#F06A6A]/30 space-y-1.5">
          <h4 className="text-xs font-semibold text-[#F06A6A] flex items-center gap-1.5">
            <Bug className="w-3.5 h-3.5" />
            Static Issues Detected
          </h4>
          <ul className="space-y-1 text-xs text-[#FCA5A5]/90 pl-5 list-disc">
            {result.bugs.map((bug, i) => (
              <li key={i}>{bug}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing Requirements (if any) */}
      {result.missingRequirements && result.missingRequirements.length > 0 && (
        <div className="p-3 rounded-lg bg-[#151D1F] border border-[#202A2C] space-y-1.5">
          <h4 className="text-xs font-semibold text-[#E9C46A] flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Remaining Requirements
          </h4>
          <ul className="space-y-1 text-xs text-[#A9B5B2] pl-5 list-disc">
            {result.missingRequirements.map((req, i) => (
              <li key={i}>{req}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
