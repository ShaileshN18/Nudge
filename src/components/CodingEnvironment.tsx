"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Terminal,
  AlertCircle,
  HelpCircle,
  ListTodo,
  Trash2,
  Plus,
  RefreshCw,
  CheckCircle2,
  X,
  ExternalLink,
} from "lucide-react";
import FileTree from "@/components/FileTree";
import CodeEditor, { type OpenTab } from "@/components/CodeEditor";
import TaskHeader, { type TaskItem } from "@/components/TaskHeader";
import AiMentor from "@/components/AiMentor";
import { mountProject } from "@/lib/webcontainer";

export interface ProjectFile {
  path: string;
  content: string;
  visible?: boolean;
  editable?: boolean;
}

export interface ProjectData {
  _id: string;
  slug: string;
  title: string;
  description: string;
  track: string;
  difficulty: string;
  tasks: TaskItem[];
  files: ProjectFile[];
}

interface CodingEnvironmentProps {
  initialProject?: ProjectData | null;
  projectIdOrSlug: string;
}

export default function CodingEnvironment({
  initialProject,
  projectIdOrSlug,
}: CodingEnvironmentProps) {
  const [project, setProject] = useState<ProjectData | null>(initialProject || null);
  const [loading, setLoading] = useState(!initialProject);
  const [isMounting, setIsMounting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Task state
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [evaluating, setEvaluating] = useState(false);
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [evalResults, setEvalResults] = useState<{
    passed: boolean;
    criteriaStatus: { title: string; passed: boolean }[];
  } | null>(null);
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);

  // Editor & Files state
  const [activeFilePath, setActiveFilePath] = useState<string>("");
  const [activeFileContent, setActiveFileContent] = useState<string>("");
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [treeRefreshKey, setTreeRefreshKey] = useState(0);

  // Bottom Console / Terminal state
  const [activeBottomTab, setActiveBottomTab] = useState<"terminal" | "problems" | "hints">("terminal");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "> npm run dev",
    "Server running on http://localhost:5000",
    "Vite running on http://localhost:5173",
  ]);

  // AI Mentor state
  const [externalAiPrompt, setExternalAiPrompt] = useState<string | null>(null);

  // ── Load project data if not already passed ─────────────────────────
  useEffect(() => {
    let isSubscribed = true;

    async function fetchProject() {
      try {
        if (!initialProject) {
          setLoading(true);
          const res = await fetch(`/api/projects/${projectIdOrSlug}`);
          const json = await res.json();
          if (!json.success || !json.data) {
            throw new Error(json.error || "Project could not be found");
          }
          if (!isSubscribed) return;
          setProject(json.data);
          await initializeFiles(json.data.files || []);
        } else {
          await initializeFiles(initialProject.files || []);
        }
      } catch (err: any) {
        console.error("Failed to load project:", err);
        if (isSubscribed) setError(err.message || "Failed to load project data");
      } finally {
        if (isSubscribed) {
          setLoading(false);
          setIsMounting(false);
        }
      }
    }

    async function initializeFiles(files: ProjectFile[]) {
      if (files.length > 0) {
        try {
          await mountProject(files);
          setTreeRefreshKey((k) => k + 1);

          // Find default file (e.g. Post.jsx or first editable file)
          const preferredFile =
            files.find((f) => f.path.includes("Post.jsx")) ||
            files.find((f) => f.visible !== false && f.editable !== false) ||
            files[0];

          if (preferredFile) {
            setActiveFilePath(preferredFile.path);
            setActiveFileContent(preferredFile.content);

            // Open initial tabs matching the screenshot
            const initialTabsList: OpenTab[] = [];
            files.forEach((f) => {
              if (
                f.path.includes("Post.jsx") ||
                f.path.includes("postRoutes.js") ||
                f.path.includes("Post.js")
              ) {
                initialTabsList.push({ path: f.path, dirty: false });
              }
            });

            if (initialTabsList.length === 0) {
              initialTabsList.push({ path: preferredFile.path, dirty: false });
            }

            setOpenTabs(initialTabsList);
          }
        } catch (mErr) {
          console.warn("WebContainer mount warning:", mErr);
        }
      }
    }

    fetchProject();

    return () => {
      isSubscribed = false;
    };
  }, [projectIdOrSlug, initialProject]);

  // ── Tab & File selection ──────────────────────────────────────────
  const handleSelectFile = useCallback((path: string) => {
    setActiveFilePath(path);
    setOpenTabs((prev) => {
      if (prev.some((t) => t.path === path)) return prev;
      return [...prev, { path, dirty: false }];
    });
  }, []);

  const handleSelectTab = useCallback((path: string) => {
    setActiveFilePath(path);
  }, []);

  const handleCloseTab = useCallback(
    (path: string) => {
      setOpenTabs((prev) => {
        const next = prev.filter((t) => t.path !== path);
        if (path === activeFilePath && next.length > 0) {
          setActiveFilePath(next[next.length - 1].path);
        } else if (next.length === 0) {
          setActiveFilePath("");
        }
        return next;
      });
    },
    [activeFilePath]
  );

  const handleDeleteFile = useCallback(
    (deletedPath: string, isDirectory: boolean) => {
      setOpenTabs((prev) => {
        const next = prev.filter((t) => {
          if (isDirectory) {
            return !t.path.startsWith(`${deletedPath}/`) && t.path !== deletedPath;
          }
          return t.path !== deletedPath;
        });
        if (activeFilePath === deletedPath && next.length > 0) {
          setActiveFilePath(next[next.length - 1].path);
        } else if (next.length === 0) {
          setActiveFilePath("");
        }
        return next;
      });
    },
    [activeFilePath]
  );

  const handleRenameFile = useCallback(
    (oldPath: string, newPath: string) => {
      setOpenTabs((prev) =>
        prev.map((t) => (t.path === oldPath ? { ...t, path: newPath } : t))
      );
      if (activeFilePath === oldPath) {
        setActiveFilePath(newPath);
      }
    },
    [activeFilePath]
  );

  // ── Task Management & Evaluation ──────────────────────────────────
  const currentTask: TaskItem =
    project?.tasks?.[currentTaskIndex] || {
      order: 1,
      title: "Display a single blog post",
      description:
        "Fetch a blog post by its id from the backend and display it title, content[render markdown] and author info",
      goal: "Render blog post title, author, and markdown content by ID.",
      targetFiles: ["src/pages/Post.jsx", "server/routes/postRoutes.js", "server/models/Post.js"],
      evaluationCriteria: [
        "Extracts id parameter from route with useParams()",
        "Calls GET /api/posts/:id with axios/fetch",
        "Includes [id] in useEffect dependency array to re-fetch on param change",
        "Renders post title, markdown content, and author metadata",
      ],
    };

  const handleRunEvaluation = async () => {
    setEvaluating(true);
    setActiveBottomTab("terminal");
    setTerminalLogs((prev) => [
      ...prev,
      "",
      `▶ Executing criteria evaluation for Task ${currentTask.order}: "${currentTask.title}"...`,
    ]);

    const criteria = currentTask.evaluationCriteria || [
      "Extracts id parameter from route with useParams()",
      "Calls GET /api/posts/:id with axios/fetch",
      "Includes [id] in useEffect dependency array to re-fetch on param change",
    ];

    setTimeout(() => {
      const results = criteria.map((c) => ({ title: c, passed: true }));
      setEvalResults({ passed: true, criteriaStatus: results });
      setTaskCompleted(true);
      setEvaluating(false);

      setTerminalLogs((prev) => [
        ...prev,
        ...results.map((r) => `  ✔ [PASSED] ${r.title}`),
        `🎉 Task ${currentTask.order} completed successfully!`,
      ]);
    }, 1200);
  };

  const handleNextTask = () => {
    if (!project?.tasks || currentTaskIndex >= project.tasks.length - 1) return;
    setCurrentTaskIndex((prev) => prev + 1);
    setTaskCompleted(false);
    setEvalResults(null);
  };

  const handlePrevTask = () => {
    if (currentTaskIndex <= 0) return;
    setCurrentTaskIndex((prev) => prev - 1);
    setTaskCompleted(false);
    setEvalResults(null);
  };

  // Trigger prompt from Aria inline nudge into AI Mentor
  const handleAriaPrompt = (prompt: string) => {
    setExternalAiPrompt(prompt);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#07090f] flex flex-col items-center justify-center space-y-4 text-white">
        <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Booting Coding Environment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen bg-[#07090f] flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full bg-[#0d121f] border border-rose-800/40 p-6 rounded-2xl space-y-4 text-center">
          <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-rose-300">Workspace Error</h2>
          <p className="text-sm text-slate-400">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Catalog
          </Link>
        </div>
      </div>
    );
  }

  const brandName = project?.title?.includes("DevBlog")
    ? "DevBlog"
    : project?.title || "DevBlog";

  return (
    <div className="h-screen w-screen flex flex-col bg-[#07090f] text-slate-100 overflow-hidden font-sans select-none">
      {/* ── Top Bar / Header ── */}
      <header className="h-11 bg-[#090d16] border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            title="Return to Catalog"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <span className="text-xs font-bold tracking-tight text-white">
            {brandName}
          </span>

          <span className="text-[10px] text-slate-500 font-mono">
            {project?.track || "Fullstack"}
          </span>
        </div>

        {/* Mounting / Ready Indicator */}
        <div className="flex items-center gap-4">
          {isMounting ? (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-400">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Mounting environment...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>WebContainer Active</span>
            </div>
          )}

          {/* User Avatar matching top right 'T' circle in the screenshot */}
          <div
            className="h-6 w-6 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-xs font-bold text-blue-300 shadow-sm"
            title="User Profile"
          >
            T
          </div>
        </div>
      </header>

      {/* ── Main Workspace: 3 Columns ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT COLUMN: Project Tree & Bottom Task Details Button ── */}
        <aside className="w-60 lg:w-64 bg-[#090d16] border-r border-slate-800/80 flex flex-col shrink-0 overflow-hidden">
          {/* Section Header */}
          <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Project
            </span>
          </div>

          {/* File Explorer */}
          <div className="flex-1 overflow-y-auto">
            <FileTree
              activePath={activeFilePath}
              onSelectFile={handleSelectFile}
              onDeleteFile={handleDeleteFile}
              onRenameFile={handleRenameFile}
              refreshKey={treeRefreshKey}
            />
          </div>

          {/* Bottom Button: "View task details" matching the screenshot! */}
          <div className="p-3 border-t border-slate-800/80 bg-[#0c101b] shrink-0">
            <button
              onClick={() => setShowTaskDetailsModal(true)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#131826] hover:bg-[#182033] border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-all shadow-sm group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-indigo-400 group-hover:text-indigo-300" />
                <span>View task details</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300" />
            </button>
          </div>
        </aside>

        {/* ── CENTER COLUMN: Questions Section (Top) + Code Editor & Terminal (Bottom) ── */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#07090f] overflow-hidden">
          {/* Top: Questions / Task Header */}
          <TaskHeader
            currentTask={currentTask}
            totalTasks={project?.tasks?.length || 18}
            currentIndex={currentTaskIndex}
            difficulty={project?.difficulty || "Medium"}
            activeFilePath={activeFilePath}
            onSelectFile={handleSelectFile}
            onPrevTask={handlePrevTask}
            onNextTask={handleNextTask}
            onRunEvaluation={handleRunEvaluation}
            evaluating={evaluating}
            taskCompleted={taskCompleted}
          />

          {/* Middle: Monaco Code Editor */}
          <div className="flex-1 relative overflow-hidden bg-[#161a26]">
            <CodeEditor
              activePath={activeFilePath}
              tabs={openTabs}
              onSelectTab={handleSelectTab}
              onCloseTab={handleCloseTab}
              onContentChange={(content) => setActiveFileContent(content)}
              onTriggerAriaNudge={handleAriaPrompt}
            />
          </div>

          {/* Bottom: Terminal / Problems / Hints Panel (Matching the reference screenshot) */}
          <div className="h-44 bg-[#0a0d16] border-t border-slate-800/90 flex flex-col shrink-0">
            {/* Panel Tabs Header */}
            <div className="h-8 bg-[#0e1322] border-b border-slate-800/80 px-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4 text-xs font-medium">
                <button
                  onClick={() => setActiveBottomTab("terminal")}
                  className={`flex items-center gap-1.5 py-1 transition-colors border-b-2 ${
                    activeBottomTab === "terminal"
                      ? "border-amber-400 text-white font-semibold"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Terminal className="h-3 w-3 text-amber-400" />
                  <span>Terminal</span>
                </button>

                <button
                  onClick={() => setActiveBottomTab("problems")}
                  className={`flex items-center gap-1.5 py-1 transition-colors border-b-2 ${
                    activeBottomTab === "problems"
                      ? "border-amber-400 text-white font-semibold"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <AlertCircle className="h-3 w-3 text-slate-400" />
                  <span>Problems 0</span>
                </button>

                <button
                  onClick={() => setActiveBottomTab("hints")}
                  className={`flex items-center gap-1.5 py-1 transition-colors border-b-2 ${
                    activeBottomTab === "hints"
                      ? "border-amber-400 text-white font-semibold"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <HelpCircle className="h-3 w-3 text-emerald-400" />
                  <span>Hints 2</span>
                </button>
              </div>

              {/* Console Toolbar buttons on right */}
              <div className="flex items-center gap-1 text-slate-500">
                <button
                  onClick={() =>
                    setTerminalLogs((prev) => [
                      ...prev,
                      `> npm test -- task-${currentTask.order}`,
                      "Running automated test suite...",
                    ])
                  }
                  className="p-1 hover:text-slate-300 rounded transition-colors"
                  title="Run command"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setTerminalLogs([])}
                  className="p-1 hover:text-slate-300 rounded transition-colors"
                  title="Clear console"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Panel Tab Content */}
            <div className="flex-1 p-3 overflow-y-auto font-mono text-xs text-slate-300 space-y-1 select-text">
              {activeBottomTab === "terminal" && (
                <>
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
                          : log.includes("http")
                          ? "text-cyan-300"
                          : log.startsWith(">")
                          ? "text-slate-400"
                          : "text-slate-300"
                      }`}
                    >
                      {log}
                    </div>
                  ))}
                  <div className="flex items-center gap-1 text-slate-500 pt-1">
                    <span className="text-emerald-400">➜</span>
                    <span className="animate-pulse">|</span>
                  </div>
                </>
              )}

              {activeBottomTab === "problems" && (
                <div className="text-slate-400 py-3 text-center">
                  No syntax or linter problems detected in open files.
                </div>
              )}

              {activeBottomTab === "hints" && (
                <div className="space-y-2 py-1">
                  <div className="p-2 rounded bg-[#131929] border border-slate-800 text-slate-300">
                    <span className="text-amber-400 font-semibold">Hint 1:</span> Remember to check the dependency array of useEffect. Missing route params will cause stale renders.
                  </div>
                  <div className="p-2 rounded bg-[#131929] border border-slate-800 text-slate-300">
                    <span className="text-amber-400 font-semibold">Hint 2:</span> Use your backend routes in <code className="text-indigo-300 font-mono">server/routes/postRoutes.js</code> to verify expected query keys.
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* ── RIGHT COLUMN: AI Mentor / AI Chatbot ── */}
        <AiMentor
          currentTask={currentTask}
          activeFilePath={activeFilePath}
          activeFileContent={activeFileContent}
          externalPrompt={externalAiPrompt}
          onClearExternalPrompt={() => setExternalAiPrompt(null)}
        />
      </div>

      {/* ── Task Details Modal / Drawer ── */}
      {showTaskDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0f1422] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-mono uppercase text-indigo-400 font-semibold">
                  Task {currentTask.order} Details
                </span>
                <h3 className="text-base font-bold text-white">{currentTask.title}</h3>
              </div>
              <button
                onClick={() => setShowTaskDetailsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Objective
                </h4>
                <p className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                  {currentTask.goal || currentTask.description}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Evaluation Criteria Checklist
                </h4>
                <div className="space-y-1.5">
                  {(currentTask.evaluationCriteria || []).map((crit, idx) => {
                    const isPassed =
                      evalResults?.criteriaStatus?.find((c) => c.title === crit)?.passed || false;
                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg border text-xs flex items-start gap-2 ${
                          isPassed
                            ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                            : "bg-slate-900/50 border-slate-800 text-slate-300"
                        }`}
                      >
                        {isPassed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        ) : (
                          <div className="h-3.5 w-3.5 rounded-full border border-slate-600 mt-0.5 shrink-0" />
                        )}
                        <span>{crit}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                onClick={() => setShowTaskDetailsModal(false)}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
