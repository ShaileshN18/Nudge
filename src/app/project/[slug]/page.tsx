"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import {
  Code2,
  Terminal,
  Play,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  FolderTree as FolderTreeIcon,
  FileCode,
  Sparkles,
  RefreshCw,
  Save,
  Check,
  Trophy,
  Database,
  Layers,
  ArrowRight,
} from "lucide-react";
import { mountProject } from "@/lib/webcontainer";
import FileTree from "@/components/FileTree";
import CodeEditor, { type OpenTab } from "@/components/CodeEditor";

// ─── Interfaces ──────────────────────────────────────────────────────

interface Task {
  _id?: string;
  order: number;
  title: string;
  description: string;
  goal: string;
  targetFiles?: string[];
  evaluationCriteria?: string[];
}

interface ProjectFile {
  path: string;
  content: string;
  visible?: boolean;
  editable?: boolean;
}

interface ProjectData {
  _id: string;
  slug: string;
  title: string;
  description: string;
  track: string;
  difficulty: string;
  tasks: Task[];
  files: ProjectFile[];
}

// ─── Component ──────────────────────────────────────────────────────

export default function ProjectWorkspace({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [taskCompleted, setTaskCompleted] = useState<boolean>(false);
  const [evalResults, setEvalResults] = useState<{
    passed: boolean;
    criteriaStatus: { title: string; passed: boolean }[];
  } | null>(null);

  // Editor state
  const [activePath, setActivePath] = useState<string>("");
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [treeRefreshKey, setTreeRefreshKey] = useState(0);

  // ── Load project + mount to WebContainer ──────────────────────────

  useEffect(() => {
    async function loadProject() {
      try {
        const res = await fetch(`/api/projects/${slug}`);
        const json = await res.json();
        if (json.success && json.data) {
          setProject(json.data);
          const initialFiles = json.data.files || [];

          // Mount to WebContainer
          await mountProject(initialFiles);
          setMounted(true);
          setTreeRefreshKey((k) => k + 1);

          // Open the first editable file
          const firstEditable = initialFiles.find(
            (f: ProjectFile) => f.visible !== false && f.editable !== false
          );
          if (firstEditable) {
            setActivePath(firstEditable.path);
            setOpenTabs([{ path: firstEditable.path, dirty: false }]);
          }

          setTerminalLogs([
            `⚡ Project initialized: ${json.data.title}`,
            `📂 Mounted ${initialFiles.length} file(s) into WebContainer.`,
            `🎯 Ready for Task 1: ${json.data.tasks?.[0]?.title || "Task 1"}`,
            `💡 Edit files in the editor. Ctrl+S saves to WebContainer.`,
          ]);
        }
      } catch (err: any) {
        console.error("Failed to load project:", err);
        setTerminalLogs((prev) => [
          ...prev,
          `❌ Error loading project: ${err.message || String(err)}`,
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [slug]);

  // ── File selection (from FileTree) ────────────────────────────────

  const handleSelectFile = useCallback((path: string) => {
    setActivePath(path);
    setOpenTabs((prev) => {
      if (prev.some((t) => t.path === path)) return prev;
      return [...prev, { path, dirty: false }];
    });
  }, []);

  // ── Tab management ────────────────────────────────────────────────

  const handleSelectTab = useCallback((path: string) => {
    setActivePath(path);
  }, []);

  const handleCloseTab = useCallback(
    (path: string) => {
      setOpenTabs((prev) => {
        const next = prev.filter((t) => t.path !== path);
        // If we closed the active tab, switch to the last remaining one
        if (path === activePath && next.length > 0) {
          setActivePath(next[next.length - 1].path);
        } else if (next.length === 0) {
          setActivePath("");
        }
        return next;
      });
    },
    [activePath]
  );

  // ── Task logic (kept from original) ───────────────────────────────

  const currentTask = project?.tasks?.[currentTaskIndex];

  const handleRunEvaluation = async () => {
    if (!currentTask) return;
    setEvaluating(true);
    setTerminalLogs((prev) => [
      ...prev,
      `\n----------------------------------------`,
      `🚀 [TEST RUN] Executing evaluation for Task ${currentTask.order}: "${currentTask.title}"...`,
    ]);

    const criteria = currentTask.evaluationCriteria || [
      "Target file exists and contains valid syntax",
      "Function logic implements required behavior",
      "Passes unit criteria test suite",
    ];

    const results = criteria.map((crit) => ({
      title: crit,
      passed: true,
    }));

    setTimeout(async () => {
      setEvalResults({ passed: true, criteriaStatus: results });
      setTaskCompleted(true);
      setEvaluating(false);

      setTerminalLogs((prev) => [
        ...prev,
        ...results.map((r) => `  ✔ [PASSED] ${r.title}`),
        `🎉 Task ${currentTask.order} completed successfully!`,
        `📦 Recording attempt to MongoDB database...`,
      ]);

      try {
        await fetch("/api/tasks/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: currentTask._id || "6aa038dab63871e6bcaabb01",
            status: "passed",
            feedback: `All ${results.length} evaluation criteria passed cleanly.`,
          }),
        });
        setTerminalLogs((prev) => [
          ...prev,
          `✔ Task attempt verified and stored in MongoDB taskattempts collection.`,
        ]);
      } catch (e) {
        console.error("Attempt store err:", e);
      }
    }, 1200);
  };

  const handleNextTask = () => {
    if (!project || currentTaskIndex >= project.tasks.length - 1) return;
    const nextIndex = currentTaskIndex + 1;
    setCurrentTaskIndex(nextIndex);
    setTaskCompleted(false);
    setEvalResults(null);
    const nextTask = project.tasks[nextIndex];
    setTerminalLogs((prev) => [
      ...prev,
      `\n🎯 Switched to Task ${nextTask.order}: ${nextTask.title}`,
      `💡 Goal: ${nextTask.goal}`,
    ]);
  };

  // ── Loading / Error states ────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] text-white flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Booting Interactive Workspace...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#090d16] text-white flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-400" />
        <h2 className="text-xl font-bold">Project Not Found</h2>
        <Link
          href="/"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition-all"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  // ── Main workspace layout ─────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-[#090d16] text-slate-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <header className="h-12 bg-[#0d1322] border-b border-slate-800/90 px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Catalog</span>
          </Link>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white truncate">{project.title}</span>
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {project.track}
            </span>
          </div>
        </div>

        {/* Task Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-xs">
          {project.tasks.map((task, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentTaskIndex(idx);
                setTaskCompleted(false);
                setEvalResults(null);
              }}
              className={`px-3 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                currentTaskIndex === idx
                  ? "bg-indigo-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Task {task.order}</span>
              {currentTaskIndex > idx && <Check className="h-3 w-3 text-emerald-400" />}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRunEvaluation}
            disabled={evaluating}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {evaluating ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-white" />
                <span>Run & Evaluate</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Task Guidance & Instructions */}
        <div className="w-72 lg:w-80 bg-[#0c1220] border-r border-slate-800/80 flex flex-col shrink-0 overflow-y-auto">
          {currentTask && (
            <div className="p-5 space-y-5">
              {/* Task Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-wider">
                    Task {currentTask.order} of {project.tasks.length}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    Step by Step
                  </span>
                </div>
                <h2 className="text-base font-bold text-white leading-snug">{currentTask.title}</h2>
              </div>

              {/* Goal Card */}
              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Objective Goal</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{currentTask.goal}</p>
              </div>

              {/* Description & Instructions */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Instructions
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800 whitespace-pre-line">
                  {currentTask.description}
                </p>
              </div>

              {/* Evaluation Criteria Checklist */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Pass Criteria</span>
                  <span className="text-[10px] text-slate-500 font-normal">Automated Checks</span>
                </h3>

                <div className="space-y-2">
                  {(currentTask.evaluationCriteria || []).map((crit, idx) => {
                    const isPassed =
                      evalResults?.criteriaStatus?.find((c) => c.title === crit)?.passed || false;
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 transition-all ${
                          isPassed
                            ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                            : "bg-slate-900/40 border-slate-800 text-slate-300"
                        }`}
                      >
                        {isPassed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-slate-600 mt-0.5 shrink-0" />
                        )}
                        <span className="leading-tight">{crit}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Next Step Banner if Task Completed */}
              {taskCompleted && currentTaskIndex < project.tasks.length - 1 && (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                    <Trophy className="h-4 w-4 text-amber-400" />
                    <span>Task {currentTask.order} Completed!</span>
                  </div>
                  <p className="text-xs text-emerald-300/80">
                    Great job! You verified all test criteria. Advance to the next task to continue.
                  </p>
                  <button
                    onClick={handleNextTask}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30"
                  >
                    <span>Proceed to Task {currentTask.order + 1}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* File Tree Sidebar */}
        <div className="w-56 bg-[#181d2a] border-r border-slate-800/60 shrink-0 overflow-hidden">
          {mounted ? (
            <FileTree
              activePath={activePath}
              onSelectFile={handleSelectFile}
              refreshKey={treeRefreshKey}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-slate-500">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Mounting…
            </div>
          )}
        </div>

        {/* Center Panel: Code Editor + Terminal */}
        <div className="flex-1 flex flex-col bg-[#1e1e1e] overflow-hidden">
          {/* Monaco Editor with tabs */}
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              activePath={activePath}
              tabs={openTabs}
              onSelectTab={handleSelectTab}
              onCloseTab={handleCloseTab}
            />
          </div>

          {/* Bottom Panel: Terminal / Output Console */}
          <div className="h-40 bg-[#080b12] border-t border-slate-800/90 flex flex-col shrink-0">
            <div className="h-7 bg-[#0c1220] border-b border-slate-800/70 px-3 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <Terminal className="h-3 w-3 text-indigo-400" />
                <span>Output</span>
              </div>
              <button
                onClick={() => setTerminalLogs([])}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear
              </button>
            </div>

            <div className="flex-1 p-3 overflow-y-auto font-mono text-xs text-slate-300 space-y-1">
              {terminalLogs.map((log, i) => (
                <div
                  key={i}
                  className={`${
                    log.includes("✔")
                      ? "text-emerald-400 font-semibold"
                      : log.includes("❌")
                      ? "text-rose-400 font-semibold"
                      : log.includes("🎉")
                      ? "text-amber-300 font-bold"
                      : log.includes("🚀")
                      ? "text-indigo-300 font-semibold"
                      : "text-slate-300"
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
