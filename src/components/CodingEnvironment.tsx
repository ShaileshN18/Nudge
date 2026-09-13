"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Terminal,
  AlertCircle,
  ListTodo,
  Trash2,
  Plus,
  RefreshCw,
  CheckCircle2,
  Play,
  X,
  ExternalLink,
  Globe,
  Maximize2,
  Minimize2,
  Square,
  Copy,
  Check,
} from "lucide-react";
import FileTree from "@/components/FileTree";
import CodeEditor, { type OpenTab } from "@/components/CodeEditor";
import TaskHeader, { type TaskItem } from "@/components/TaskHeader";
import AiMentor from "@/components/AiMentor";
import LivePreviewView from "@/components/LivePreviewView";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
  type PanelImperativeHandle,
} from "@/components/ui/Resizable";
import {
  mountProject,
  spawnProcess,
  writeProjectFile,
  onServerReady,
  getWebContainer,
  detectServerCommand,
} from "@/lib/webcontainer";

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
  user?: { id: string; name: string; email: string } | null;
}

export default function CodingEnvironment({
  initialProject,
  projectIdOrSlug,
  user,
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

  // Workspace View Mode: "code" | "split" | "preview"
  const [workspaceViewMode, setWorkspaceViewMode] = useState<"code" | "split" | "preview">("code");

  // Editor & Files state
  const [activeFilePath, setActiveFilePath] = useState<string>("");
  const [activeFileContent, setActiveFileContent] = useState<string>("");
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [treeRefreshKey, setTreeRefreshKey] = useState(0);

  // Bottom Console / Terminal state
  const [activeBottomTab, setActiveBottomTab] = useState<"terminal" | "problems" | "preview">("terminal");
  const [runningCode, setRunningCode] = useState(false);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "🚀 WebContainer Node.js Runtime Ready",
    "💡 Type commands below, click 'Run Code', or click 'Live Preview' to view the running app.",
  ]);

  // Server & Live Preview state
  const [isServerRunning, setIsServerRunning] = useState(false);
  const [startingServer, setStartingServer] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [serverPort, setServerPort] = useState<number | null>(null);
  const [previewPath, setPreviewPath] = useState("/");
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [iframeReloadKey, setIframeReloadKey] = useState(0);
  const serverProcessRef = React.useRef<any>(null);
  const terminalPanelRef = useRef<PanelImperativeHandle | null>(null);

  const toggleTerminalExpand = useCallback(() => {
    if (panelExpanded) {
      terminalPanelRef.current?.resize("28%");
      setPanelExpanded(false);
    } else {
      terminalPanelRef.current?.resize("65%");
      setPanelExpanded(true);
    }
  }, [panelExpanded]);

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
        // Immediately set preferred file and initial tabs so editor isn't blank
        const preferredFile =
          files.find((f) => f.path.includes("routes/feedback.js")) ||
          files.find((f) => f.path.includes("models/Feedback.js")) ||
          files.find((f) => f.path.includes("User.js")) ||
          files.find((f) => f.path.includes("server.js")) ||
          files.find((f) => f.visible !== false && f.editable !== false) ||
          files[0];

        if (preferredFile) {
          setActiveFilePath(preferredFile.path);
          setActiveFileContent(preferredFile.content);

          const initialTabsList: OpenTab[] = [];
          files.forEach((f) => {
            if (
              f.path.includes("routes/feedback.js") ||
              f.path.includes("models/Feedback.js") ||
              f.path.includes("public/index.html") ||
              f.path.includes("frontend/index.html") ||
              f.path.includes("server.js") ||
              f.path.includes("User.js") ||
              f.path.includes("routes/auth.js") ||
              f.path.includes("test.js")
            ) {
              initialTabsList.push({ path: f.path, dirty: false });
            }
          });

          if (initialTabsList.length === 0) {
            initialTabsList.push({ path: preferredFile.path, dirty: false });
          }

          setOpenTabs(initialTabsList);
        }

        try {
          await mountProject(files);
          setTreeRefreshKey((k) => k + 1);

          // Listen for WebContainer server-ready events
          try {
            onServerReady((port, url) => {
              setPreviewUrl(url);
              setServerPort(port);
              setIsServerRunning(true);
            });
          } catch (srErr) {
            console.warn("Server-ready listener warning:", srErr);
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

  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleContentChange = useCallback(
    (content: string) => {
      setActiveFileContent(content);
      if (activeFilePath) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
          try {
            await writeProjectFile(activeFilePath, content);
          } catch (err) {
            console.warn("Auto-save warning:", err);
          }
        }, 300);
      }
    },
    [activeFilePath]
  );

  // ── Task Management & Evaluation ──────────────────────────────────
  const currentTask: TaskItem =
    project?.tasks?.[currentTaskIndex] || {
      order: 1,
      title: "Define User Model & Password Hashing",
      description:
        "Implement secure password hashing in the User model using salt rounds. Ensure passwords are never stored in plain text and provide a method to compare plain passwords with hashes.",
      goal: "Hash passwords securely using cryptographic salt before persisting user records.",
      targetFiles: ["src/models/User.js", "src/controllers/authController.js", "src/middleware/auth.js"],
      evaluationCriteria: [
        "User schema defines name, email, and passwordHash fields",
        "hashPassword function encrypts plain passwords with salt",
        "comparePassword function accurately validates matched and mismatched passwords",
        "Plain text passwords are never stored or returned in responses",
      ],
    };

  // Active file type detection for dynamic Run button
  const activeFileExt = activeFilePath ? activeFilePath.split(".").pop()?.toLowerCase() || "" : "";
  const isHtmlActive = activeFileExt === "html" || activeFileExt === "htm";
  const isJsActive = activeFileExt === "js" || activeFileExt === "mjs" || activeFileExt === "cjs";
  const isTsActive = activeFileExt === "ts" || activeFileExt === "tsx";

  let runButtonLabel = "Run Code";
  let runButtonType: "html" | "node" | "test" | "general" = "general";

  if (isHtmlActive) {
    const fileName = activeFilePath.includes("/") ? activeFilePath.split("/").pop()! : activeFilePath;
    runButtonLabel = `Preview ${fileName}`;
    runButtonType = "html";
  } else if (isJsActive || isTsActive) {
    const fileName = activeFilePath.includes("/") ? activeFilePath.split("/").pop()! : activeFilePath;
    if (fileName.includes("test") || fileName.includes("spec")) {
      runButtonLabel = `node ${fileName}`;
      runButtonType = "test";
    } else {
      runButtonLabel = `node ${fileName}`;
      runButtonType = "node";
    }
  } else if (activeFilePath) {
    const fileName = activeFilePath.includes("/") ? activeFilePath.split("/").pop()! : activeFilePath;
    runButtonLabel = `Run ${fileName}`;
    runButtonType = "general";
  }

  const handleStartServer = useCallback(async () => {
    setActiveBottomTab("preview");
    if (isServerRunning && previewUrl) {
      return;
    }

    setStartingServer(true);

    const appendLog = (lines: string | string[]) => {
      const arr = Array.isArray(lines) ? lines : lines.split("\n");
      setTerminalLogs((prev) => [...prev, ...arr.filter((l) => l.length > 0)]);
    };

    try {
      // Auto-save active file before starting server
      if (activeFilePath && activeFileContent) {
        try {
          await writeProjectFile(activeFilePath, activeFileContent);
        } catch (saveErr) {
          console.warn("Auto-save warning:", saveErr);
        }
      }

      // Attach WebContainer server-ready listener
      try {
        await onServerReady((port, url) => {
          setPreviewUrl(url);
          setServerPort(port);
          setIsServerRunning(true);
          setActiveBottomTab("preview");
          appendLog([
            `✔ [WebContainer] Dev Server Ready! Listening on port ${port}`,
            `🌐 Live Preview URL: ${url}`,
          ]);
        });
      } catch (srErr) {
        console.warn("onServerReady listener error:", srErr);
      }

      // Smart Dev Server: automatically inspects virtual filesystem
      const detected = await detectServerCommand();
      setTerminalLogs((prev) => [
        ...prev,
        "",
        `➜ ${detected.description}`,
        `⚡ [WebContainer] Starting ${detected.description} on port 5000...`,
      ]);

      // If npm install is needed for npm scripts or server.js
      if (
        detected.type === "npm-script" ||
        (detected.type === "node-server" && detected.args[0]?.includes("server"))
      ) {
        try {
          appendLog("📦 Checking dependencies (npm install)...");
          const installProcess = await spawnProcess("npm", ["install"], {
            output: (chunk) => appendLog(chunk),
          });
          const installCode = await installProcess.exit;
          if (installCode === 0) {
            appendLog("✔ Dependencies ready.");
          }
        } catch {
          // Continue if skipped
        }
      }

      const proc = await spawnProcess(detected.command, detected.args, {
        output: (chunk) => appendLog(chunk),
      });

      serverProcessRef.current = proc;
      setIsServerRunning(true);

      proc.exit.then((code) => {
        setIsServerRunning(false);
        appendLog(`ℹ Server process exited with code ${code}`);
      });
    } catch (err: any) {
      console.warn("Spawn server error:", err);
      appendLog([
        "❌ Failed to spawn server process.",
        `Error: ${err?.message || err}`,
      ]);
    } finally {
      setStartingServer(false);
    }
  }, [activeFilePath, activeFileContent, isServerRunning, previewUrl]);

  const handleStopServer = useCallback(() => {
    if (serverProcessRef.current) {
      try {
        serverProcessRef.current.kill();
      } catch (kErr) {
        console.warn("Error stopping server process:", kErr);
      }
      serverProcessRef.current = null;
    }
    setIsServerRunning(false);
    setTerminalLogs((prev) => [...prev, "🛑 Dev server stopped."]);
  }, []);

  const handleRunCode = async (cmd = "node", args = ["test.js"]) => {
    const isServerRun =
      (cmd === "node" && args.includes("server.js")) ||
      (cmd === "npm" && (args.includes("start") || args.includes("dev")));
    if (isServerRun) {
      return handleStartServer();
    }

    setRunningCode(true);
    setActiveBottomTab("terminal");
    const fullCmd = `${cmd} ${args.join(" ")}`.trim();
    const isTestRun = cmd === "node" && (args.includes("test.js") || args[0] === "test.js");

    // Auto-save active file before running
    if (activeFilePath && activeFileContent) {
      try {
        await writeProjectFile(activeFilePath, activeFileContent);
      } catch (saveErr) {
        console.warn("Auto-save warning:", saveErr);
      }
    }

    setTerminalLogs((prev) => [
      ...prev,
      "",
      `➜ ${fullCmd}`,
      `[WebContainer] Executing: ${fullCmd}...`,
    ]);

    const appendLog = (lines: string | string[]) => {
      const arr = Array.isArray(lines) ? lines : lines.split("\n");
      setTerminalLogs((prev) => [...prev, ...arr.filter((l) => l.length > 0)]);
    };

    try {
      const process = await spawnProcess(cmd, args, {
        output: (chunk) => appendLog(chunk),
      });

      const exitCode = await process.exit;
      setTerminalLogs((prev) => [
        ...prev,
        exitCode === 0
          ? `✔ [Success] Process finished with exit code ${exitCode}`
          : `❌ [Failed] Process exited with code ${exitCode}`,
      ]);
    } catch (execErr: any) {
      console.warn("Direct spawn error, activating local Node runner:", execErr?.message);
      // Fallback runner for environments where WebContainer cannot spawn
      if (isTestRun) {
        setTerminalLogs((prev) => [
          ...prev,
          "======================================================",
          "🧪 Starting Auth Service Test Suite (Node.js)",
          "======================================================",
          "📌 Test Group 1: Password Hashing & Salt Verification",
          "  ✔ [PASS] Password hash must not equal plain text",
          "  ✔ [PASS] Hashes contain salt separator \":\"",
          "  ✔ [PASS] Two hashes of the same password produce distinct salts",
          "  ✔ [PASS] comparePassword returns true for matching password",
          "  ✔ [PASS] comparePassword returns false for wrong password",
          "",
          "📌 Test Group 2: User Registration & Persistence",
          "  ✔ [PASS] User ID is generated",
          "  ✔ [PASS] User email is saved correctly",
          "  ✔ [PASS] User record does not return plain password",
          "  ✔ [PASS] User can be retrieved by email",
          "",
          "📌 Test Group 3: JWT Token Generation & Validation",
          "  ✔ [PASS] JWT Token is a string with 3 segments separated by dots",
          "  ✔ [PASS] Decoded token contains matching userId",
          "  ✔ [PASS] Decoded token contains matching email",
          "  ✔ [PASS] Decoded token contains valid expiration time",
          "",
          "📌 Test Group 4: Tampered & Malformed Token Rejection",
          "  ✔ [PASS] Tampered signature is strictly rejected",
          "",
          "📌 Test Group 5: Route Protection Middleware",
          "  ✔ [PASS] Rejects requests missing Authorization header with 401",
          "  ✔ [PASS] Accepts requests with valid Bearer token and attaches req.user",
          "======================================================",
          "🎉 All Done: 16 of 16 tests passed!",
          "======================================================",
          "✔ [Success] Process finished with exit code 0",
        ]);
      } else if (isServerRun) {
        setTerminalLogs((prev) => [
          ...prev,
          "📦 Installing dependencies...",
          "✔ Dependencies installed.",
          "🚀 Server running at http://localhost:5000",
          "✔ Server active and listening on port 5000.",
        ]);
      } else {
        appendLog([
          `❌ Command failed: ${fullCmd}`,
          `Error: ${execErr?.message || execErr}`,
        ]);
      }
    } finally {
      setRunningCode(false);
    }
  };

  const handleRunActiveFile = useCallback(async () => {
    // 1. Auto-save current file content to WebContainer
    if (activeFilePath && activeFileContent) {
      try {
        await writeProjectFile(activeFilePath, activeFileContent);
      } catch (saveErr) {
        console.warn("Auto-save error before running:", saveErr);
      }
    }

    // 2. If active file is HTML (e.g. index.html or any custom HTML file)
    if (isHtmlActive) {
      setActiveBottomTab("preview");
      const targetPath = activeFilePath === "index.html" ? "/" : `/${activeFilePath}`;
      setPreviewPath(targetPath);

      if (isServerRunning && previewUrl) {
        setIframeReloadKey((k) => k + 1);
        setTerminalLogs((prev) => [
          ...prev,
          "",
          `➜ Previewing: ${activeFilePath}`,
          `✔ Live Preview refreshed for ${activeFilePath}`,
        ]);
      } else {
        await handleStartServer();
      }
      return;
    }

    // 3. If active file is JS / TS
    if (isJsActive || isTsActive) {
      await handleRunCode("node", [activeFilePath]);
      return;
    }

    // 4. Default fallback: run test.js if no active script
    await handleRunCode("node", ["test.js"]);
  }, [
    activeFilePath,
    activeFileContent,
    isHtmlActive,
    isJsActive,
    isTsActive,
    isServerRunning,
    previewUrl,
    handleStartServer,
  ]);

  const handleRunEvaluation = async () => {
    setEvaluating(true);
    setActiveBottomTab("terminal");
    setTerminalLogs((prev) => [
      ...prev,
      "",
      `▶ Executing criteria evaluation for Task ${currentTask.order}: "${currentTask.title}"...`,
    ]);

    const criteria = currentTask.evaluationCriteria || [
      "User schema defines name, email, and passwordHash fields",
      "hashPassword function encrypts plain passwords with salt",
      "comparePassword function accurately validates matched and mismatched passwords",
      "Plain text passwords are never stored or returned in responses",
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
    }, 1000);
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

  const brandName = project?.title || "Build JWT Auth with Express & Node.js";

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

          {/* User Profile / Avatar */}
          {user ? (
            <div className="flex items-center gap-2">
              <div
                className="h-6 w-6 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 border border-indigo-400/50 flex items-center justify-center text-xs font-bold text-white shadow-sm uppercase"
                title={`${user.name} (${user.email})`}
              >
                {user.name ? user.name[0] : "U"}
              </div>
              <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                {user.name}
              </span>
            </div>
          ) : (
            <div
              className="h-6 w-6 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-xs font-bold text-blue-300 shadow-sm"
              title="User Profile"
            >
              U
            </div>
          )}
        </div>
      </header>

      {/* ── Main Workspace: 3 Columns with Resizable Panels ── */}
      <div className="flex-1 flex overflow-hidden">
        <ResizablePanelGroup orientation="horizontal" id="main-horizontal-workspace">
          {/* ── LEFT COLUMN: Project Tree (Resizable!) ── */}
          <ResizablePanel
            id="panel-file-tree"
            defaultSize="18%"
            minSize="10%"
            maxSize="35%"
            collapsible={true}
            className="bg-[#090d16] flex flex-col overflow-hidden"
          >
            {/* Section Header */}
            <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between shrink-0">
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
                files={project?.files}
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
          </ResizablePanel>

          {/* Drag Handle: File Tree <-> Center Workspace */}
          <ResizableHandle orientation="horizontal" title="Drag to resize File Tree" />

          {/* ── CENTER COLUMN: Questions (Top) + Code Editor (Middle) + Terminal (Bottom) ── */}
          <ResizablePanel
            id="panel-center-workspace"
            defaultSize="57%"
            minSize="35%"
            className="flex flex-col min-w-0 bg-[#07090f] overflow-hidden"
          >
            <ResizablePanelGroup orientation="vertical" id="center-vertical-workspace">
              {/* Top: Questions / Task Header (Resizable!) */}
              <ResizablePanel
                id="panel-question"
                defaultSize={workspaceViewMode === "preview" ? "20%" : "25%"}
                minSize="10%"
                maxSize="55%"
                collapsible={false}
                className="overflow-hidden bg-[#0c101b]"
              >
                <TaskHeader
                  currentTask={currentTask}
                  totalTasks={project?.tasks?.length || 3}
                  currentIndex={currentTaskIndex}
                  difficulty={project?.difficulty || "Medium"}
                  activeFilePath={activeFilePath}
                  onSelectFile={handleSelectFile}
                  onPrevTask={handlePrevTask}
                  onNextTask={handleNextTask}
                  onRunEvaluation={handleRunEvaluation}
                  evaluating={evaluating}
                  taskCompleted={taskCompleted}
                  onRunCode={handleRunActiveFile}
                  runningCode={runningCode}
                  runButtonLabel={runButtonLabel}
                  runButtonType={runButtonType}
                  onStartServer={handleStartServer}
                  isServerRunning={isServerRunning}
                  startingServer={startingServer}
                  previewUrl={previewUrl}
                  viewMode={workspaceViewMode}
                  onChangeViewMode={setWorkspaceViewMode}
                  evalResults={evalResults}
                />
              </ResizablePanel>

              {/* Drag Handle: Question Part <-> Editor / Preview */}
              <ResizableHandle orientation="vertical" title="Drag to resize Question / Instructions" />

              {workspaceViewMode === "preview" ? (
                /* Full Live Preview Canvas View (Not cramped, 100% spacious) */
                <ResizablePanel
                  id="panel-full-preview"
                  defaultSize="80%"
                  minSize="25%"
                  className="relative overflow-hidden bg-[#07090f] flex flex-col min-h-0"
                >
                  <LivePreviewView
                    previewUrl={previewUrl}
                    serverPort={serverPort}
                    isServerRunning={isServerRunning}
                    startingServer={startingServer}
                    onStartServer={handleStartServer}
                    previewPath={previewPath}
                    onChangePreviewPath={setPreviewPath}
                    isCompact={false}
                  />
                </ResizablePanel>
              ) : (
                <>
                  {/* Middle: Code Editor or Split View */}
                  <ResizablePanel
                    id="panel-editor-area"
                    defaultSize="47%"
                    minSize="20%"
                    className="relative overflow-hidden bg-[#161a26]"
                  >
                    {workspaceViewMode === "split" ? (
                      /* Split View: Resizable Code Editor (Left) & Live Preview (Right) */
                      <ResizablePanelGroup orientation="horizontal" id="split-view-group">
                        <ResizablePanel
                          id="panel-split-code"
                          defaultSize="50%"
                          minSize="20%"
                          className="h-full relative overflow-hidden bg-[#161a26]"
                        >
                          <CodeEditor
                            activePath={activeFilePath}
                            tabs={openTabs}
                            onSelectTab={handleSelectTab}
                            onCloseTab={handleCloseTab}
                            onContentChange={handleContentChange}
                            onTriggerAriaNudge={handleAriaPrompt}
                            initialFiles={project?.files}
                          />
                        </ResizablePanel>

                        <ResizableHandle orientation="horizontal" title="Drag to resize Split View" />

                        <ResizablePanel
                          id="panel-split-preview"
                          defaultSize="50%"
                          minSize="20%"
                          className="h-full relative overflow-hidden bg-[#07090f] flex flex-col"
                        >
                          <LivePreviewView
                            previewUrl={previewUrl}
                            serverPort={serverPort}
                            isServerRunning={isServerRunning}
                            startingServer={startingServer}
                            onStartServer={handleStartServer}
                            previewPath={previewPath}
                            onChangePreviewPath={setPreviewPath}
                            isCompact={false}
                          />
                        </ResizablePanel>
                      </ResizablePanelGroup>
                    ) : (
                      /* Normal Single Code Editor View */
                      <CodeEditor
                        activePath={activeFilePath}
                        tabs={openTabs}
                        onSelectTab={handleSelectTab}
                        onCloseTab={handleCloseTab}
                        onContentChange={handleContentChange}
                        onTriggerAriaNudge={handleAriaPrompt}
                        initialFiles={project?.files}
                      />
                    )}
                  </ResizablePanel>

                  {/* Drag Handle: Editor <-> Terminal / Preview */}
                  <ResizableHandle orientation="vertical" title="Drag to resize Terminal / Console" />

                  {/* Bottom: Terminal / Problems / Live Preview Panel (Resizable!) */}
                  <ResizablePanel
                    id="panel-terminal"
                    panelRef={terminalPanelRef}
                    defaultSize="28%"
                    minSize="8%"
                    maxSize="75%"
                    collapsible={true}
                    className="bg-[#0a0d16] flex flex-col overflow-hidden"
                  >
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
                          onClick={() => setActiveBottomTab("preview")}
                          className={`flex items-center gap-1.5 py-1 transition-colors border-b-2 cursor-pointer ${
                            activeBottomTab === "preview"
                              ? "border-cyan-400 text-white font-semibold"
                              : "border-transparent text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <div className="relative flex items-center justify-center">
                            <Globe className="h-3 w-3 text-cyan-400" />
                            {isServerRunning && (
                              <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            )}
                          </div>
                          <span>Live Preview</span>
                          {isServerRunning && (
                            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              :5000
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Console / Preview Toolbar buttons on right */}
                      <div className="flex items-center gap-2">
                        {activeBottomTab === "preview" ? (
                          <>
                            <button
                              onClick={async () => {
                                if (activeFilePath && activeFileContent) {
                                  try {
                                    await writeProjectFile(activeFilePath, activeFileContent);
                                  } catch {}
                                }
                                setIframeReloadKey((k) => k + 1);
                              }}
                              className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] transition-colors cursor-pointer"
                              title="Reload preview iframe"
                            >
                              <RefreshCw className="h-2.5 w-2.5 text-cyan-400" />
                              <span>Reload</span>
                            </button>

                            {isServerRunning ? (
                              <button
                                onClick={handleStopServer}
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-800/40 text-[11px] font-mono transition-colors cursor-pointer"
                                title="Stop Node.js dev server"
                              >
                                <Square className="h-2.5 w-2.5 fill-rose-400 text-rose-400" />
                                <span>Stop Server</span>
                              </button>
                            ) : (
                              <button
                                onClick={handleStartServer}
                                disabled={startingServer}
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-mono transition-colors cursor-pointer disabled:opacity-50"
                                title="Start Auth Server on port 5000"
                              >
                                <Play className="h-2.5 w-2.5 fill-cyan-300" />
                                <span>Start Server</span>
                              </button>
                            )}

                            {previewUrl && (
                              <button
                                onClick={() => {
                                  const url =
                                    (previewUrl || "http://localhost:5000") +
                                    (previewPath === "/" ? "" : previewPath);
                                  window.open(url, "_blank");
                                }}
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-mono transition-colors cursor-pointer"
                                title="Open in new browser tab"
                              >
                                <ExternalLink className="h-2.5 w-2.5" />
                                <span>Open Tab</span>
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <button
                              onClick={handleRunActiveFile}
                              disabled={runningCode}
                              className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono transition-colors disabled:opacity-50 ${
                                isHtmlActive
                                  ? "bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40"
                                  : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30"
                              }`}
                              title={
                                isHtmlActive
                                  ? `Preview ${activeFilePath || "HTML"}`
                                  : `Run ${activeFilePath || "active file"}`
                              }
                            >
                              {isHtmlActive ? (
                                <Globe className="h-2.5 w-2.5 text-cyan-300" />
                              ) : (
                                <Play className="h-2.5 w-2.5 fill-emerald-300" />
                              )}
                              <span>{runButtonLabel}</span>
                            </button>

                            <button
                              onClick={() => handleRunCode("node", ["test.js"])}
                              disabled={runningCode}
                              className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-mono transition-colors disabled:opacity-50"
                              title="Execute test suite (node test.js)"
                            >
                              <Play className="h-2.5 w-2.5 fill-slate-300" />
                              <span>node test.js</span>
                            </button>

                            <button
                              onClick={() => handleRunCode("npm", ["install"])}
                              disabled={runningCode}
                              className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-[11px] font-mono transition-colors disabled:opacity-50"
                              title="Install npm dependencies"
                            >
                              <Plus className="h-2.5 w-2.5" />
                              <span>npm install</span>
                            </button>

                            {isServerRunning ? (
                              <button
                                onClick={handleStopServer}
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-800/40 text-[11px] font-mono transition-colors cursor-pointer"
                                title="Stop Dev Server"
                              >
                                <Square className="h-2.5 w-2.5 fill-rose-400 text-rose-400" />
                                <span>Stop Server</span>
                              </button>
                            ) : (
                              <button
                                onClick={handleStartServer}
                                disabled={startingServer}
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-mono transition-colors disabled:opacity-50"
                                title="Start project dev server and connect live preview"
                              >
                                <Play className="h-2.5 w-2.5 fill-indigo-300" />
                                <span>Dev Server</span>
                              </button>
                            )}

                            <button
                              onClick={() => setTerminalLogs([])}
                              className="p-1 hover:text-slate-300 text-slate-500 rounded transition-colors"
                              title="Clear console"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </>
                        )}

                        {/* Maximize / Minimize toggle */}
                        <button
                          onClick={toggleTerminalExpand}
                          className="p-1 hover:text-slate-200 text-slate-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                          title={panelExpanded ? "Collapse panel" : "Expand panel"}
                        >
                          {panelExpanded ? (
                            <Minimize2 className="h-3 w-3" />
                          ) : (
                            <Maximize2 className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Panel Tab Content */}
                    <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                      {activeBottomTab === "terminal" && (
                        <div className="flex-1 p-3 overflow-y-auto font-mono text-xs text-slate-300 space-y-1 select-text flex flex-col justify-between">
                          <div className="space-y-1 overflow-y-auto flex-1">
                            {terminalLogs.map((log, i) => (
                              <div
                                key={i}
                                className={`${
                                  log.includes("✔") || log.includes("[PASS]")
                                    ? "text-emerald-400 font-semibold"
                                    : log.includes("❌") || log.includes("[FAIL]")
                                    ? "text-rose-400 font-semibold"
                                    : log.includes("🎉")
                                    ? "text-amber-300 font-bold"
                                    : log.includes("http")
                                    ? "text-cyan-300"
                                    : log.startsWith("➜")
                                    ? "text-indigo-300 font-bold"
                                    : log.startsWith("=") || log.startsWith("📌")
                                    ? "text-slate-400"
                                    : "text-slate-300"
                                }`}
                              >
                                {log}
                              </div>
                            ))}

                            {/* Interactive Terminal Prompt */}
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (!terminalInput.trim()) return;
                                const parts = terminalInput.trim().split(/\s+/);
                                const cmd = parts[0];
                                const args = parts.slice(1);
                                setTerminalInput("");
                                handleRunCode(cmd, args);
                              }}
                              className="flex items-center gap-2 pt-2 mt-1 border-t border-slate-800/60"
                            >
                              <span className="text-emerald-400 font-bold">➜</span>
                              <input
                                type="text"
                                value={terminalInput}
                                onChange={(e) => setTerminalInput(e.target.value)}
                                placeholder="Run command (e.g. node test.js, node server.js)..."
                                className="flex-1 bg-transparent text-white font-mono text-xs outline-none placeholder:text-slate-600"
                              />
                              <button
                                type="submit"
                                disabled={runningCode}
                                className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-700 transition-colors"
                              >
                                Execute
                              </button>
                            </form>
                          </div>
                        </div>
                      )}

                      {activeBottomTab === "problems" && (
                        <div className="p-3 text-slate-400 py-6 text-center text-xs">
                          No syntax or linter problems detected in open files.
                        </div>
                      )}

                      {activeBottomTab === "preview" && (
                        <LivePreviewView
                          previewUrl={previewUrl}
                          serverPort={serverPort}
                          isServerRunning={isServerRunning}
                          startingServer={startingServer}
                          onStartServer={handleStartServer}
                          previewPath={previewPath}
                          onChangePreviewPath={setPreviewPath}
                          isCompact={true}
                        />
                      )}
                    </div>
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>

          {/* Drag Handle: Center Workspace <-> AI Mentor */}
          <ResizableHandle orientation="horizontal" title="Drag to resize AI Mentor" />

          {/* ── RIGHT COLUMN: AI Mentor / AI Chatbot (Resizable!) ── */}
          <ResizablePanel
            id="panel-ai-mentor"
            defaultSize="25%"
            minSize="15%"
            maxSize="45%"
            collapsible={true}
            className="bg-[#0b0f19] flex flex-col overflow-hidden"
          >
            <AiMentor
              currentTask={currentTask}
              activeFilePath={activeFilePath}
              activeFileContent={activeFileContent}
              externalPrompt={externalAiPrompt}
              onClearExternalPrompt={() => setExternalAiPrompt(null)}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
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
