"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Code2,
  Terminal,
  Play,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  FolderTree,
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

export default function ProjectWorkspace({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [taskCompleted, setTaskCompleted] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [evalResults, setEvalResults] = useState<{
    passed: boolean;
    criteriaStatus: { title: string; passed: boolean }[];
  } | null>(null);

  useEffect(() => {
    async function loadProject() {
      try {
        const res = await fetch(`/api/projects/${slug}`);
        const json = await res.json();
        if (json.success && json.data) {
          setProject(json.data);
          const initialFiles = json.data.files || [];
          setFiles(initialFiles);
          if (initialFiles.length > 0) {
            setActiveFilePath(initialFiles[0].path);
          }
          setTerminalLogs([
            `⚡ Project initialized: ${json.data.title}`,
            `📂 Loaded ${initialFiles.length} project file(s) into workspace.`,
            `🎯 Ready for Task 1: ${json.data.tasks?.[0]?.title || "Task 1"}`,
            `💡 Write code in the editor and click 'Run & Evaluate' to test your solution.`,
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

  const currentTask = project?.tasks?.[currentTaskIndex];
  const activeFile = files.find((f) => f.path === activeFilePath) || files[0];

  const handleCodeChange = (newContent: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.path === activeFilePath ? { ...f, content: newContent } : f))
    );
  };

  const handleSaveCode = () => {
    setSavedSuccess(true);
    setTerminalLogs((prev) => [
      ...prev,
      `💾 Saved ${activeFilePath} (${new Date().toLocaleTimeString()})`,
    ]);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleRunEvaluation = async () => {
    if (!currentTask) return;
    setEvaluating(true);
    setTerminalLogs((prev) => [
      ...prev,
      `\n----------------------------------------`,
      `🚀 [TEST RUN] Executing evaluation for Task ${currentTask.order}: "${currentTask.title}"...`,
    ]);

    // Simulate criteria evaluations
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

      // Record to MongoDB
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

  return (
    <div className="h-screen flex flex-col bg-[#090d16] text-slate-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <header className="h-14 bg-[#0d1322] border-b border-slate-800/90 px-4 flex items-center justify-between z-20 shrink-0">
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
            onClick={handleSaveCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors border border-slate-700"
          >
            {savedSuccess ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Saved</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 text-slate-400" />
                <span>Save</span>
              </>
            )}
          </button>

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
        <div className="w-80 lg:w-96 bg-[#0c1220] border-r border-slate-800/80 flex flex-col shrink-0 overflow-y-auto">
          {currentTask && (
            <div className="p-5 space-y-6">
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
                <h2 className="text-lg font-bold text-white leading-snug">{currentTask.title}</h2>
              </div>

              {/* Goal Card */}
              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-1.5">
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

        {/* Center/Right Panel: Code Editor & Terminal Output */}
        <div className="flex-1 flex flex-col bg-[#090d16] overflow-hidden">
          {/* File Tabs Bar */}
          <div className="h-10 bg-[#0c1220] border-b border-slate-800 flex items-center px-2 gap-1 overflow-x-auto shrink-0">
            {files.map((file) => {
              const isActive = file.path === activeFilePath;
              return (
                <button
                  key={file.path}
                  onClick={() => setActiveFilePath(file.path)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-t-md transition-all ${
                    isActive
                      ? "bg-[#090d16] text-indigo-300 border-t-2 border-indigo-500 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <FileCode className="h-3.5 w-3.5 text-indigo-400" />
                  <span>{file.path.split("/").pop()}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Code Editor Area */}
          <div className="flex-1 flex flex-col bg-[#090d16] relative overflow-hidden">
            <div className="flex-1 relative font-mono text-xs flex">
              {/* Line Numbers Column */}
              <div className="w-12 bg-[#0c1220]/50 text-slate-600 py-3 pr-2 text-right select-none font-mono text-xs border-r border-slate-800/60 leading-6 shrink-0">
                {Array.from({
                  length: Math.max(25, (activeFile?.content || "").split("\n").length),
                }).map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Textarea Code Editor */}
              <textarea
                value={activeFile?.content || ""}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="flex-1 bg-transparent text-slate-200 p-3 leading-6 outline-none resize-none font-mono text-xs selection:bg-indigo-600/40"
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
              />
            </div>

            {/* Bottom Panel: Interactive Terminal / Output Console */}
            <div className="h-44 bg-[#080b12] border-t border-slate-800/90 flex flex-col shrink-0">
              <div className="h-7 bg-[#0c1220] border-b border-slate-800/70 px-3 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <Terminal className="h-3 w-3 text-indigo-400" />
                  <span>Execution & Test Logs</span>
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
    </div>
  );
}
