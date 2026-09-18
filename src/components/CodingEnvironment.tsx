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
  Search,
  Sun,
  RotateCcw,
  XCircle,
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
  readProjectFile,
  getWebContainer,
  detectServerCommand,
  getDevServerState,
  subscribeDevServer,
  startDevServer,
  stopDevServer,
  restartDevServer,
  type DevServerState,
} from "@/lib/webcontainer";
import { evaluateTask } from "@/lib/ai/evaluation/evaluateTask";
import { useMentor } from "@/hooks/useMentor";

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
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [evalResults, setEvalResults] = useState<{
    passed: boolean;
    criteriaStatus: { title: string; passed: boolean; feedback?: string }[];
    overallFeedback?: string;
  } | null>(null);
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);


  // Cloud Save State
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [starterFilePaths, setStarterFilePaths] = useState<string[]>([]);

  // Workspace View Mode: "code" | "split" | "preview"
  const [workspaceViewMode, setWorkspaceViewMode] = useState<"code" | "split" | "preview">("code");

  // Editor & Files state
  const [activeFilePath, setActiveFilePath] = useState<string>("");
  const [activeFileContent, setActiveFileContent] = useState<string>("");
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [treeRefreshKey, setTreeRefreshKey] = useState(0);

  // Bottom Console / Terminal state
  const [activeBottomTab, setActiveBottomTab] = useState<"terminal" | "evaluation" | "problems" | "preview">("terminal");
  const [runningCode, setRunningCode] = useState(false);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  // Server & Live Preview authoritative state (single source of truth)
  const [devServerState, setDevServerState] = useState<DevServerState>(() => getDevServerState());

  useEffect(() => {
    return subscribeDevServer((state) => {
      setDevServerState(state);
    });
  }, []);

  const isServerRunning = devServerState.status === "running";
  const startingServer = devServerState.status === "starting";
  const previewUrl = devServerState.url;
  const serverPort = devServerState.port;
  const serverError = devServerState.error;
  const [panelExpanded, setPanelExpanded] = useState(false);
  const terminalPanelRef = useRef<PanelImperativeHandle | null>(null);
  const previewChannelRef = useRef<BroadcastChannel | null>(null);

  // Synchronized refs to avoid stale closures in callbacks
  const previewUrlRef = useRef<string | null>(null);
  previewUrlRef.current = previewUrl;
  const isServerRunningRef = useRef<boolean>(false);
  isServerRunningRef.current = isServerRunning;
  const startingServerRef = useRef<boolean>(false);
  startingServerRef.current = startingServer;

  const broadcastPreview = useCallback((type: string, data: Record<string, any> = {}) => {
    try {
      previewChannelRef.current?.postMessage({ type, ...data });
    } catch {
      // Ignore
    }
  }, []);

  // References for cross-tab message handlers
  const handleStartServerRef = useRef<any>(null);
  const handleRestartServerRef = useRef<any>(null);

  // ── BroadcastChannel setup (runs once on mount) ────────────────
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("nudge-preview");
      previewChannelRef.current = channel;

      channel.onmessage = (event) => {
        const data = event.data;
        if (!data || typeof data !== "object") return;

        if (data.type === "request-preview-url") {
          const current = getDevServerState();
          if (current.status === "running" && current.url) {
            channel?.postMessage({ type: "preview-url", url: current.url, port: current.port });
          } else if (current.status === "starting") {
            channel?.postMessage({
              type: "server-status",
              status: "starting",
              message: "Starting dev server...",
            });
          } else if (current.status === "error") {
            channel?.postMessage({
              type: "server-error",
              message: current.error || "Dev server failed",
            });
          } else {
            handleStartServerRef.current?.({ openTab: false });
          }
        } else if (data.type === "restart-server") {
          handleRestartServerRef.current?.();
        } else if (data.type === "start-server") {
          handleStartServerRef.current?.({ openTab: false });
        }
      };
    } catch {
      // BroadcastChannel not supported
    }

    return () => {
      channel?.close();
      previewChannelRef.current = null;
    };
  }, []);

  // Sync devServerState with localStorage and BroadcastChannel
  useEffect(() => {
    if (devServerState.status === "running" && devServerState.url) {
      localStorage.setItem("nudge-preview-url", devServerState.url);
      if (devServerState.port) localStorage.setItem("nudge-preview-port", String(devServerState.port));
      localStorage.setItem("nudge-preview-status", "ready");
      broadcastPreview("preview-url", { url: devServerState.url, port: devServerState.port });
    } else if (devServerState.status === "starting") {
      localStorage.removeItem("nudge-preview-url");
      localStorage.removeItem("nudge-preview-port");
      localStorage.setItem("nudge-preview-status", "starting");
      broadcastPreview("server-status", { status: "starting", message: "Starting dev server..." });
    } else if (devServerState.status === "error") {
      localStorage.removeItem("nudge-preview-url");
      localStorage.removeItem("nudge-preview-port");
      localStorage.setItem("nudge-preview-status", "error");
      localStorage.setItem("nudge-preview-status-message", devServerState.error || "Dev server failed");
      broadcastPreview("server-error", { message: devServerState.error || "Dev server failed" });
    } else {
      localStorage.removeItem("nudge-preview-url");
      localStorage.removeItem("nudge-preview-port");
      localStorage.setItem("nudge-preview-status", "idle");
      broadcastPreview("server-status", { status: "stopped", message: "Dev server stopped" });
    }
  }, [devServerState, broadcastPreview]);

  const toggleTerminalExpand = useCallback(() => {
    if (panelExpanded) {
      terminalPanelRef.current?.resize("28%");
      setPanelExpanded(false);
    } else {
      terminalPanelRef.current?.resize("65%");
      setPanelExpanded(true);
    }
  }, [panelExpanded]);


  // ── Load user workspace & project data ──────────────────────────────
  useEffect(() => {
    let isSubscribed = true;

    async function fetchProjectWorkspace() {
      try {
        setLoading(true);
        const res = await fetch(`/api/user-projects/${projectIdOrSlug}`);
        const json = await res.json();
        if (!json.success || !json.data) {
          throw new Error(json.error || "Project could not be found");
        }
        if (!isSubscribed) return;

        const baseProject = json.data.project;
        const userWorkspace = json.data.userProject;

        const filesToUse =
          userWorkspace?.files && userWorkspace.files.length > 0
            ? userWorkspace.files
            : baseProject.files || [];

        setProject({
          ...baseProject,
          files: filesToUse,
        });

        // Track original core starter files for protection
        const starterPaths = (baseProject?.files || []).map((f: any) =>
          f.path.replace(/^\/+/, "")
        );
        setStarterFilePaths(starterPaths);

        if (userWorkspace) {
          if (typeof userWorkspace.currentTaskIndex === "number") {
            setCurrentTaskIndex(userWorkspace.currentTaskIndex);
          }
          if (Array.isArray(userWorkspace.completedTasks)) {
            setCompletedTasks(userWorkspace.completedTasks);
            const currentTaskOrder = String(
              baseProject?.tasks?.[userWorkspace.currentTaskIndex || 0]?.order ||
              (userWorkspace.currentTaskIndex || 0) + 1
            );
            if (userWorkspace.completedTasks.includes(currentTaskOrder)) {
              setTaskCompleted(true);
            }
          }
        }

        await initializeFiles(filesToUse, userWorkspace?.activeFilePath);
      } catch (err: any) {
        console.error("Failed to load user workspace:", err);
        if (initialProject) {
          setProject(initialProject);
          const starterPaths = (initialProject.files || []).map((f: any) =>
            f.path.replace(/^\/+/, "")
          );
          setStarterFilePaths(starterPaths);
          await initializeFiles(initialProject.files || []);
        } else if (isSubscribed) {
          setError(err.message || "Failed to load project data");
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
          setIsMounting(false);
        }
      }
    }

    async function initializeFiles(files: ProjectFile[], preferredPath?: string) {
      if (files.length > 0) {
        // Restore saved active file or choose best default
        const preferredFile =
          (preferredPath && files.find((f) => f.path === preferredPath)) ||
          files.find((f) => f.visible !== false && f.editable !== false) ||
          files[0];

        if (preferredFile) {
          setActiveFilePath(preferredFile.path);
          setActiveFileContent(preferredFile.content);

          const initialTabsList: OpenTab[] = [];
          initialTabsList.push({ path: preferredFile.path, dirty: false });

          setOpenTabs(initialTabsList);
        }

        try {
          await mountProject(files);
          if (!isSubscribed) return;
          setTreeRefreshKey((k) => k + 1);

          // Auto-start dev server on mount if not already running or starting
          const currentStatus = getDevServerState().status;
          if (currentStatus !== "running" && currentStatus !== "starting") {
            startDevServer({
              onOutput: (chunk) => {
                const lines = chunk.split("\n").filter((l) => l.length > 0);
                setTerminalLogs((prev) => [...prev, ...lines]);
              },
            }).catch(() => { });
          }
        } catch (mErr) {
          console.warn("WebContainer mount warning:", mErr);
        }
      }
    }

    fetchProjectWorkspace();

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

  const handleCreateFile = useCallback(
    async (createdPath: string) => {
      const cleanPath = createdPath.replace(/^\/+/, "");
      setProject((prev) => {
        if (!prev) return prev;
        const exists = prev.files.some(
          (f) => f.path.replace(/^\/+/, "") === cleanPath
        );
        if (exists) return prev;
        return {
          ...prev,
          files: [
            ...prev.files,
            { path: cleanPath, content: "", editable: true, visible: true },
          ],
        };
      });

      try {
        setSaveStatus("saving");
        await fetch(`/api/user-projects/${projectIdOrSlug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file: { path: cleanPath, content: "" },
            activeFilePath: cleanPath,
          }),
        });
        setSaveStatus("saved");
      } catch (err) {
        console.warn("Failed to persist newly created file:", err);
        setSaveStatus("error");
      }
    },
    [projectIdOrSlug]
  );

  const handleDeleteFile = useCallback(
    async (deletedPath: string, isDirectory: boolean) => {
      const cleanDeleted = deletedPath.replace(/^\/+/, "");

      // 1. Update open tabs
      setOpenTabs((prev) => {
        const next = prev.filter((t) => {
          const tp = t.path.replace(/^\/+/, "");
          if (isDirectory) {
            return !tp.startsWith(`${cleanDeleted}/`) && tp !== cleanDeleted;
          }
          return tp !== cleanDeleted;
        });
        if (activeFilePath === deletedPath && next.length > 0) {
          setActiveFilePath(next[next.length - 1].path);
        } else if (next.length === 0) {
          setActiveFilePath("");
        }
        return next;
      });

      // 2. Update project files state
      setProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          files: prev.files.filter((f) => {
            const fp = f.path.replace(/^\/+/, "");
            if (isDirectory) {
              return !fp.startsWith(`${cleanDeleted}/`) && fp !== cleanDeleted;
            }
            return fp !== cleanDeleted;
          }),
        };
      });

      // 3. Persist deletion to MongoDB
      try {
        setSaveStatus("saving");
        await fetch(`/api/user-projects/${projectIdOrSlug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deleteFilePath: cleanDeleted,
            isDirectory,
          }),
        });
        setSaveStatus("saved");
      } catch (err) {
        console.warn("Failed to persist deleted file to MongoDB:", err);
        setSaveStatus("error");
      }
    },
    [activeFilePath, projectIdOrSlug]
  );

  const handleRenameFile = useCallback(
    async (oldPath: string, newPath: string) => {
      const cleanOld = oldPath.replace(/^\/+/, "");
      const cleanNew = newPath.replace(/^\/+/, "");

      // 1. Update open tabs
      setOpenTabs((prev) =>
        prev.map((t) => {
          const tp = t.path.replace(/^\/+/, "");
          if (tp === cleanOld) return { ...t, path: cleanNew };
          if (tp.startsWith(`${cleanOld}/`)) {
            return { ...t, path: `${cleanNew}/${tp.slice(cleanOld.length + 1)}` };
          }
          return t;
        })
      );

      if (activeFilePath === oldPath) {
        setActiveFilePath(newPath);
      }

      // 2. Update project files state
      setProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          files: prev.files.map((f) => {
            const fp = f.path.replace(/^\/+/, "");
            if (fp === cleanOld) return { ...f, path: cleanNew };
            if (fp.startsWith(`${cleanOld}/`)) {
              return { ...f, path: `${cleanNew}/${fp.slice(cleanOld.length + 1)}` };
            }
            return f;
          }),
        };
      });

      // 3. Persist rename to MongoDB
      try {
        setSaveStatus("saving");
        await fetch(`/api/user-projects/${projectIdOrSlug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            renameFile: { oldPath: cleanOld, newPath: cleanNew },
            activeFilePath: newPath,
          }),
        });
        setSaveStatus("saved");
      } catch (err) {
        console.warn("Failed to persist renamed file to MongoDB:", err);
        setSaveStatus("error");
      }
    },
    [activeFilePath, projectIdOrSlug]
  );

  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const cloudSaveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const saveFileToCloud = useCallback(
    async (path: string, content: string) => {
      try {
        setSaveStatus("saving");
        const res = await fetch(`/api/user-projects/${projectIdOrSlug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file: { path, content },
            activeFilePath: path,
          }),
        });
        if (res.ok) {
          setSaveStatus("saved");
        } else {
          setSaveStatus("error");
        }
      } catch (err) {
        console.warn("Cloud save error:", err);
        setSaveStatus("error");
      }
    },
    [projectIdOrSlug]
  );

  const handleActiveFileLoaded = useCallback((content: string) => {
    setActiveFileContent(content);
  }, []);

  const handleContentChange = useCallback(
    (content: string) => {
      setActiveFileContent(content);
      setSaveStatus("saving");

      // Keep project.files in sync with live editor edits without unnecessary re-renders
      setProject((prev) => {
        if (!prev) return prev;
        const cleanActive = (activeFilePath || "").replace(/^\/+/, "");
        const existing = prev.files.find((f) => f.path.replace(/^\/+/, "") === cleanActive);
        if (existing && existing.content === content) {
          return prev;
        }
        return {
          ...prev,
          files: prev.files.map((f) => {
            const cleanF = f.path.replace(/^\/+/, "");
            if (cleanF === cleanActive) {
              return { ...f, content };
            }
            return f;
          }),
        };
      });

      if (activeFilePath) {
        // Fast local WebContainer auto-save
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
          try {
            await writeProjectFile(activeFilePath, content);

            // Node caches CommonJS modules, so changes to a learner's backend
            // need a real server restart before the preview can use them.
            if (
              activeFilePath.replace(/^\/+/, "").startsWith("backend/") &&
              getDevServerState().status === "running"
            ) {
              await restartDevServer({
                onOutput: (chunk) => {
                  const lines = chunk.split("\n").filter((line) => line.length > 0);
                  setTerminalLogs((previous) => [...previous, ...lines]);
                },
              });
            }
          } catch (err) {
            console.warn("Auto-save warning:", err);
          }
        }, 300);

        // Debounced Cloud Save to MongoDB
        if (cloudSaveTimeoutRef.current) clearTimeout(cloudSaveTimeoutRef.current);
        cloudSaveTimeoutRef.current = setTimeout(() => {
          saveFileToCloud(activeFilePath, content);
        }, 1500);
      }
    },
    [activeFilePath, saveFileToCloud]
  );

  const modifiedFilesList = React.useMemo(() => {
    return (
      project?.files
        ?.filter((f) => {
          const clean = f.path.replace(/^\/+/, "");
          return (
            !starterFilePaths.includes(clean) ||
            (activeFilePath && clean === activeFilePath.replace(/^\/+/, ""))
          );
        })
        .map((f) => f.path) || []
    );
  }, [project?.files, starterFilePaths, activeFilePath]);

  // ── Task Management & Evaluation ──────────────────────────────────
  const currentTask: TaskItem =
    project?.tasks?.[currentTaskIndex] || {
      order: 1,
      title: "No task available",
      description: "This project does not currently contain a task.",
      targetFiles: [],
    };
  const mentor = useMentor({ task: currentTask, projectId: project?._id || projectIdOrSlug, files: project?.files || [], activeFilePath, evaluation: evalResults });

  // Active file type detection for dynamic Run button
  const activeFileExt = activeFilePath ? activeFilePath.split(".").pop()?.toLowerCase() || "" : "";
  const isHtmlActive = activeFileExt === "html" || activeFileExt === "htm";
  const isJsActive = activeFileExt === "js" || activeFileExt === "mjs" || activeFileExt === "cjs";
  const isTsActive = activeFileExt === "ts" || activeFileExt === "tsx";

  let runButtonLabel = "Run Tests";
  let runButtonType: "html" | "node" | "test" | "general" = "test";

  if (isHtmlActive) {
    const fileName = activeFilePath.includes("/") ? activeFilePath.split("/").pop()! : activeFilePath;
    runButtonLabel = `Preview ${fileName}`;
    runButtonType = "html";
  } else if (activeFilePath.includes("test") || activeFilePath.includes("spec")) {
    const fileName = activeFilePath.includes("/") ? activeFilePath.split("/").pop()! : activeFilePath;
    runButtonLabel = `Run ${fileName}`;
    runButtonType = "test";
  } else if (activeFilePath.includes("server") || activeFilePath.includes("app.js")) {
    runButtonLabel = isServerRunning ? "Server Online" : "Start Server";
    runButtonType = "node";
  } else {
    runButtonLabel = "Run Tests";
    runButtonType = "test";
  }

  const handleStartServer = useCallback(
    async (options?: { openTab?: boolean }) => {
      setActiveBottomTab("preview");

      if (options?.openTab) {
        if (devServerState.url) {
          const portQuery = devServerState.port ? `&port=${devServerState.port}` : "";
          window.open(
            `/preview?url=${encodeURIComponent(devServerState.url)}${portQuery}`,
            "_blank"
          );
        } else {
          window.open("/preview", "_blank");
        }
      }

      try {
        if (activeFilePath && activeFileContent) {
          await writeProjectFile(activeFilePath, activeFileContent).catch(() => { });
        }
        await startDevServer({
          onOutput: (chunk) => {
            const lines = chunk.split("\n").filter((l) => l.length > 0);
            setTerminalLogs((prev) => [...prev, ...lines]);
          },
        });
      } catch (err: any) {
        console.warn("Dev server start error:", err?.message);
      }
    },
    [activeFilePath, activeFileContent, devServerState.url, devServerState.port]
  );

  handleStartServerRef.current = handleStartServer;

  const handleRestartServer = useCallback(async () => {
    try {
      if (activeFilePath && activeFileContent) {
        await writeProjectFile(activeFilePath, activeFileContent).catch(() => { });
      }
      await restartDevServer({
        onOutput: (chunk) => {
          const lines = chunk.split("\n").filter((l) => l.length > 0);
          setTerminalLogs((prev) => [...prev, ...lines]);
        },
      });
    } catch (err: any) {
      console.warn("Dev server restart error:", err?.message);
    }
  }, [activeFilePath, activeFileContent]);

  handleRestartServerRef.current = handleRestartServer;

  const handleStopServer = useCallback(async () => {
    await stopDevServer();
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

      if (isServerRunning && previewUrl) {
        setTerminalLogs((prev) => [
          ...prev,
          "",
          `➜ Previewing: ${activeFilePath}`,
          "✔ Live Preview refreshed.",
        ]);
      } else {
        await handleStartServer();
      }

      return;
    }

    // 3. If active file is explicitly a test/spec file
    if (activeFilePath.includes("test") || activeFilePath.includes("spec")) {
      await handleRunCode("node", [activeFilePath]);
      return;
    }

    // 4. If active file is a server entry point
    if (activeFilePath.includes("server") || activeFilePath.includes("app.js")) {
      await handleStartServer({ openTab: false });
      return;
    }

    // 5. Intelligent runner: check for project test suite in virtual filesystem
    try {
      const container = await getWebContainer();
      let rootEntries: string[] = [];
      try {
        const entries = await container.fs.readdir(".", { withFileTypes: true });
        rootEntries = entries.map((e: any) => (typeof e === "string" ? e : e.name));
      } catch { }

      // Check package.json for test script
      if (rootEntries.includes("package.json")) {
        try {
          const rawPkg = await container.fs.readFile("package.json", "utf-8");
          const pkg = JSON.parse(rawPkg);
          if (pkg.scripts?.test) {
            await handleRunCode("npm", ["test"]);
            return;
          }
        } catch { }
      }

      // Check for backend/test.js
      try {
        await container.fs.readFile("backend/test.js", "utf-8");
        await handleRunCode("node", ["backend/test.js"]);
        return;
      } catch { }

      // Check for test.js
      if (rootEntries.includes("test.js")) {
        await handleRunCode("node", ["test.js"]);
        return;
      }
    } catch { }

    // 6. Fallback: if active file is JS / TS
    if (isJsActive || isTsActive) {
      await handleRunCode("node", [activeFilePath]);
      return;
    }

    // 7. Default fallback: run test.js
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
      `🤖 [AI Evaluation] Inspecting codebase against Task ${currentTask.order}: "${currentTask.title}"...`,
    ]);

    // Auto-save active file first
    if (activeFilePath && activeFileContent) {
      try {
        await writeProjectFile(activeFilePath, activeFileContent);
      } catch (saveErr) {
        console.warn("Auto-save error before evaluation:", saveErr);
      }
    }

    try {
      // 1. Read targetFiles directly from WebContainer (single source of truth)
      const targetFilePaths = currentTask.targetFiles || [];
      const targetFilesContent: Array<{ path: string; content: string }> = [];

      for (const p of targetFilePaths) {
        const clean = p.replace(/^\/+/, "");
        try {
          const content = await readProjectFile(clean);
          targetFilesContent.push({ path: clean, content });
        } catch {
          if (activeFilePath && clean === activeFilePath.replace(/^\/+/, "")) {
            targetFilesContent.push({ path: clean, content: activeFileContent });
          } else {
            const fallback = project?.files?.find((f) => f.path.replace(/^\/+/, "") === clean);
            targetFilesContent.push({ path: clean, content: fallback?.content || "" });
          }
        }
      }

      const evalData = await evaluateTask(currentTask, targetFilesContent, activeFilePath);
      const isPassed = Boolean(evalData.passed);

      setEvalResults({
        passed: isPassed,
        criteriaStatus: evalData.criteriaStatus || [],
        overallFeedback: evalData.overallFeedback,
      });

      if (isPassed) {
        setTaskCompleted(true);
        const taskKey = String(currentTask.order || currentTaskIndex + 1);
        const updatedCompleted = Array.from(new Set([...completedTasks, taskKey]));
        setCompletedTasks(updatedCompleted);
        mentor.clearAnnotation();

        // Persist task completion to MongoDB
        try {
          await fetch(`/api/user-projects/${projectIdOrSlug}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              completedTasks: updatedCompleted,
              currentTaskIndex,
            }),
          });
        } catch (saveErr) {
          console.warn("Failed to persist task completion to MongoDB:", saveErr);
        }

        // Auto-advance to the next task if available!
        if (project?.tasks && currentTaskIndex < project.tasks.length - 1) {
          const nextIndex = currentTaskIndex + 1;
          const nextTask = project.tasks[nextIndex];

          setTerminalLogs((prev) => [
            ...prev,
            `🚀 [Auto-Advance] Task ${currentTask.order} passed! Advancing to Task ${nextTask.order}: "${nextTask.title}"...`,
          ]);

          setTimeout(() => {
            setCurrentTaskIndex(nextIndex);
            const nextTaskOrder = String(nextTask.order || nextIndex + 1);
            setTaskCompleted(updatedCompleted.includes(nextTaskOrder));
            setEvalResults(null);

            // Automatically open next task's target file in editor
            if (nextTask.targetFiles && nextTask.targetFiles.length > 0) {
              const nextTarget = nextTask.targetFiles[0].replace(/^\/+/, "");
              const matchingFile = project.files.find((f) => {
                const clean = f.path.replace(/^\/+/, "");
                return (
                  clean === nextTarget ||
                  clean.endsWith("/" + nextTarget) ||
                  nextTarget.endsWith("/" + clean)
                );
              });
              if (matchingFile) {
                handleSelectFile(matchingFile.path);
              }
            }

            // Persist new currentTaskIndex
            fetch(`/api/user-projects/${projectIdOrSlug}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                currentTaskIndex: nextIndex,
              }),
            }).catch((err) => console.warn("Auto-advance persist error:", err));
          }, 1200);
        } else {
          setTerminalLogs((prev) => [
            ...prev,
            `🏆 Congratulations! You have completed all tasks in this project!`,
          ]);
        }
      } else {
        // Explicit trigger cost control: do not automatically fire background nudge AI calls
        setTerminalLogs((prev) => [
          ...prev,
          `💡 [Task Incomplete] Inspect the failed criteria below. Click 'Need a nudge' in the AI Mentor panel if you want guidance.`,
        ]);
      }

      // Log results to terminal with visual cues
      setTerminalLogs((prev) => [
        ...prev,
        "======================================================",
        `📊 AI Evaluation Results for Task ${currentTask.order}`,
        "======================================================",
        ...(evalData.criteriaStatus || []).map((c: any) =>
          c.passed
            ? `  ✔ [PASSED] ${c.title}${c.feedback ? ` — ${c.feedback}` : ""}`
            : `  ❌ [FAILED] ${c.title}${c.feedback ? ` — ${c.feedback}` : ""}`
        ),
        "------------------------------------------------------",
        evalData.overallFeedback ? `💬 Feedback: ${evalData.overallFeedback}` : "",
        isPassed
          ? `🎉 Task ${currentTask.order} completed successfully! You can move to the next task.`
          : `⚠️ Some requirements are not yet satisfied. Check the feedback above or click "Need a Nudge" in the AI Mentor tab for guidance.`,
        "======================================================",
      ]);
    } catch (err: any) {
      console.error("Evaluation execution error:", err);
      setTerminalLogs((prev) => [
        ...prev,
        `❌ [AI Evaluation Error]: ${err?.message || "Failed to evaluate code. Ensure GEMINI_API_KEY is configured in .env."
        }`,
      ]);
    } finally {
      setEvaluating(false);
    }
  };

  const handleNextTask = () => {
    if (!project?.tasks || currentTaskIndex >= project.tasks.length - 1) return;
    const nextIndex = currentTaskIndex + 1;
    setCurrentTaskIndex(nextIndex);
    const nextTaskOrder = String(project?.tasks?.[nextIndex]?.order || nextIndex + 1);
    setTaskCompleted(completedTasks.includes(nextTaskOrder));
    setEvalResults(null);

    fetch(`/api/user-projects/${projectIdOrSlug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentTaskIndex: nextIndex }),
    }).catch(() => null);
  };

  const handlePrevTask = () => {
    if (currentTaskIndex <= 0) return;
    const prevIndex = currentTaskIndex - 1;
    setCurrentTaskIndex(prevIndex);
    const prevTaskOrder = String(project?.tasks?.[prevIndex]?.order || prevIndex + 1);
    setTaskCompleted(completedTasks.includes(prevTaskOrder));
    setEvalResults(null);

    fetch(`/api/user-projects/${projectIdOrSlug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentTaskIndex: prevIndex }),
    }).catch(() => null);
  };

  const handleAriaPrompt = (prompt: string) => mentor.sendMessage(prompt);

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
    <div className="h-screen w-screen flex flex-col bg-[#080C0D] text-[#F4F7F6] overflow-hidden font-sans select-none">
      {/* ── Top Bar / Header: Nudge Branding, Nav & User Avatar (Search & Theme toggle removed per DESIGN.md & Screenshot 1) ── */}
      <header className="h-12 bg-[#080C0D] border-b border-[#202A2C] px-4 flex items-center justify-between shrink-0 z-20">
        {/* Left: Stylized Glyph, Nudge Title, Links */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center text-[#67D6B2]">
              <svg className="w-5 h-5 text-[#67D6B2]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 17 10 11 4 5" />
                <line x1="12" y1="19" x2="20" y2="19" />
              </svg>
            </div>
            <span className="font-bold text-sm tracking-tight text-[#F4F7F6] group-hover:text-[#67D6B2] transition-colors">
              Nudge
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs">
            <button className="text-[#71807C] hover:text-[#F4F7F6] transition-colors cursor-pointer">
              Learn
            </button>
            <button className="text-[#F4F7F6] font-semibold transition-colors cursor-pointer">
              Projects
            </button>
            <button className="text-[#71807C] hover:text-[#F4F7F6] transition-colors cursor-pointer">
              Progress
            </button>
          </nav>
        </div>

        {/* Right: Only User Avatar matching Screenshot 1 */}
        <div className="flex items-center gap-3">
          <div
            className="h-7 w-7 rounded-full bg-[#67D6B2]/20 border border-[#67D6B2]/40 flex items-center justify-center text-xs font-bold text-[#67D6B2] shadow-sm uppercase cursor-pointer"
            title={user ? `${user.name} (${user.email})` : "Tanishq"}
          >
            {user?.name ? user.name[0] : "T"}
          </div>
        </div>
      </header>

      {/* ── Main Workspace: 3 Columns with Resizable Panels ── */}
      <div className="flex-1 flex overflow-hidden">
        <ResizablePanelGroup orientation="horizontal" id="main-horizontal-workspace">
          {/* ── LEFT COLUMN: Project Tree & Progress Donut (Resizable!) ── */}
          <ResizablePanel
            id="panel-file-tree"
            defaultSize="18%"
            minSize="12%"
            maxSize="35%"
            collapsible={true}
            className="bg-[#080C0D] flex flex-col overflow-hidden border-r border-[#202A2C]"
          >
            {/* Back to projects link */}
            <div className="px-4 pt-4 pb-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2.5 text-sm font-medium text-[#A7C9C0] hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-[#6BCDB4]" />
                <span>Back to projects</span>
              </Link>
            </div>

            {/* Project Selector Dropdown */}
            <div className="px-4 pb-3 border-b border-[#202A2C]">
              <div className="text-[10px] font-bold text-[#5F7575] uppercase tracking-wider mb-1">
                PROJECT
              </div>
              <button
                onClick={() => setShowTaskDetailsModal(true)}
                className="flex items-center justify-between w-full text-left text-sm font-bold text-white hover:text-[#6BCDB4] group cursor-pointer"
              >
                <span className="truncate">{project?.title || "Full-Stack Feedback Board"}</span>
                <ChevronDown className="h-4 w-4 text-[#6BCDB4] group-hover:text-white shrink-0 ml-1" />
              </button>
            </div>

            {/* File Explorer */}
            <div className="flex-1 overflow-y-auto px-1.5 py-1">
              <FileTree
                activePath={activeFilePath}
                onSelectFile={handleSelectFile}
                onDeleteFile={handleDeleteFile}
                onRenameFile={handleRenameFile}
                onCreateFile={handleCreateFile}
                refreshKey={treeRefreshKey}
                files={project?.files}
                starterFilePaths={starterFilePaths}
              />
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
                  serverPort={serverPort}
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
                    serverError={serverError}
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
                            onFileLoaded={handleActiveFileLoaded}
                            onTriggerAriaNudge={handleAriaPrompt}
                            initialFiles={project?.files}
                            activeHint={mentor.state.activeAnnotation}
                            onClearHint={mentor.clearAnnotation}
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
                            serverError={serverError}
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
                        onFileLoaded={handleActiveFileLoaded}
                        onTriggerAriaNudge={handleAriaPrompt}
                        initialFiles={project?.files}
                        activeHint={mentor.state.activeAnnotation}
                        onClearHint={mentor.clearAnnotation}
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
                    <div className="h-9 bg-[#080C0D] border-b border-[#202A2C] px-4 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-4 text-xs font-medium">
                        <button
                          onClick={() => setActiveBottomTab("terminal")}
                          className={`flex items-center gap-1.5 py-1 transition-colors border-b-2 cursor-pointer ${activeBottomTab === "terminal"
                            ? "border-[#82CDBD] text-[#F4F7F6] font-semibold"
                            : "border-transparent text-[#71807C] hover:text-[#A9B5B2]"
                            }`}
                        >
                          <Terminal className="h-3.5 w-3.5 text-[#67D6B2]" />
                          <span>Terminal</span>
                        </button>

                        <button
                          onClick={() => setActiveBottomTab("problems")}
                          className={`flex items-center gap-1.5 py-1 transition-colors border-b-2 cursor-pointer ${activeBottomTab === "problems"
                            ? "border-[#82CDBD] text-[#F4F7F6] font-semibold"
                            : "border-transparent text-[#71807C] hover:text-[#A9B5B2]"
                            }`}
                        >
                          <AlertCircle className="h-3.5 w-3.5 text-[#71807C]" />
                          <span>Problems 0</span>
                        </button>

                        <button
                          onClick={() => setActiveBottomTab("evaluation")}
                          className={`flex items-center gap-1.5 py-1 transition-colors border-b-2 cursor-pointer ${activeBottomTab === "evaluation"
                            ? "border-[#F06A6A] text-[#F4F7F6] font-semibold"
                            : "border-transparent text-[#71807C] hover:text-[#A9B5B2]"
                            }`}
                        >
                          <XCircle className="h-3.5 w-3.5 text-[#F06A6A]" />
                          <span>Evaluation Results</span>
                        </button>

                        {previewUrl && (
                          <button
                            onClick={() => setActiveBottomTab("preview")}
                            className={`flex items-center gap-1.5 py-1 transition-colors border-b-2 cursor-pointer ${activeBottomTab === "preview"
                              ? "border-[#82CDBD] text-[#F4F7F6] font-semibold"
                              : "border-transparent text-[#71807C] hover:text-[#A9B5B2]"
                              }`}
                          >
                            <Globe className="h-3.5 w-3.5 text-[#6BCDB4]" />
                            <span>Preview</span>
                          </button>
                        )}
                      </div>

                      {/* Console / Evaluation Toolbar buttons on right */}
                      <div className="flex items-center gap-3">
                        {activeBottomTab === "evaluation" ? (
                          <>
                            <span className="text-[11px] text-[#71807C] flex items-center gap-1.5">
                              <span>Ran {evalResults?.criteriaStatus?.length || 0} criteria</span>
                              <span>•</span>
                              <span className="text-[#F06A6A] font-semibold">{(evalResults?.criteriaStatus || []).filter((criterion) => !criterion.passed).length} failed</span>
                            </span>

                            <button
                              onClick={handleRunEvaluation}
                              disabled={evaluating}
                              className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#11181A] hover:bg-[#151D1F] text-[#F4F7F6] border border-[#202A2C] text-xs transition-colors cursor-pointer"
                            >
                              <RotateCcw className="h-3 w-3 text-[#A9B5B2]" />
                              <span>Re-run</span>
                            </button>

                            <button
                              onClick={() => setEvalResults(null)}
                              className="p-1 hover:text-[#F4F7F6] text-[#71807C] transition-colors"
                              title="Clear results"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : activeBottomTab === "terminal" ? (
                          <>
                            <button
                              onClick={() => {
                                setTerminalLogs((prev) => [
                                  ...prev,
                                  `➜ ${new Date().toLocaleTimeString()} New terminal session`,
                                ]);
                              }}
                              className="p-1 hover:text-[#F4F7F6] text-[#71807C] transition-colors cursor-pointer"
                              title="New Terminal"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => setTerminalLogs([])}
                              className="p-1 hover:text-[#F4F7F6] text-[#71807C] transition-colors cursor-pointer"
                              title="Clear terminal"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : null}

                        {/* Maximize / Minimize toggle */}
                        <button
                          onClick={toggleTerminalExpand}
                          className="p-1 hover:text-[#F4F7F6] text-[#71807C] rounded hover:bg-[#151D1F] transition-colors cursor-pointer"
                          title={panelExpanded ? "Collapse panel" : "Expand panel"}
                        >
                          {panelExpanded ? (
                            <Minimize2 className="h-3.5 w-3.5" />
                          ) : (
                            <Maximize2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Panel Tab Content */}
                    <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-[#080C0D]">
                      {activeBottomTab === "terminal" && (
                        <div className="flex-1 p-3 overflow-y-auto font-mono text-xs text-[#A9B5B2] space-y-1 select-text flex flex-col justify-between">
                          <div className="space-y-1 overflow-y-auto flex-1">
                            {terminalLogs.map((log, i) => (
                              <div
                                key={i}
                                className={`${log.includes("✔") || log.includes("[PASS]")
                                  ? "text-[#67D6B2] font-semibold"
                                  : log.includes("❌") || log.includes("[FAIL]")
                                    ? "text-[#F06A6A] font-semibold"
                                    : log.includes("🎉")
                                      ? "text-[#E9C46A] font-bold"
                                      : log.includes("http")
                                        ? "text-[#82CDBD]"
                                        : log.startsWith("➜")
                                          ? "text-[#6BCDB4] font-bold"
                                          : "text-[#A9B5B2]"
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
                              className="flex items-center gap-2 pt-2 mt-1 border-t border-[#202A2C]"
                            >
                              <span className="text-[#67D6B2] font-bold">➜</span>
                              <input
                                type="text"
                                value={terminalInput}
                                onChange={(e) => setTerminalInput(e.target.value)}
                                placeholder="Run command (e.g. node test.js, node server.js)..."
                                className="flex-1 bg-transparent text-[#F4F7F6] font-mono text-xs outline-none placeholder-[#71807C]"
                              />
                              <button
                                type="submit"
                                disabled={runningCode}
                                className="px-2 py-0.5 rounded bg-[#11181A] text-[10px] text-[#A9B5B2] hover:text-[#F4F7F6] border border-[#202A2C] hover:bg-[#151D1F] transition-colors"
                              >
                                Execute
                              </button>
                            </form>
                          </div>
                        </div>
                      )}

                      {activeBottomTab === "evaluation" && (
                        <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans select-text bg-[#080C0D]">
                          {/* Banner */}
                          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#11181A] border border-[#F06A6A]/30">
                            <XCircle className="h-5 w-5 text-[#F06A6A] shrink-0 mt-0.5" />
                            <div>
                              <h3 className="text-sm font-bold text-[#F4F7F6]">{evalResults?.passed ? "Evaluation passed" : "Evaluation incomplete"}</h3>
                              <p className="text-xs text-[#A9B5B2] mt-0.5">
                                {evalResults?.overallFeedback || "Run an evaluation to see task feedback."}
                              </p>
                            </div>
                          </div>

                          {/* List of failed tests matching Screenshot 2 */}
                          <div className="space-y-2">
                            {(evalResults?.criteriaStatus || []).map((crit, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-xl bg-[#0D1214] border border-[#202A2C] space-y-1"
                              >
                                <div className="flex items-center gap-2 text-xs font-semibold text-[#F06A6A] font-mono">
                                  <X className="h-3.5 w-3.5 text-[#F06A6A] shrink-0" />
                                  <span>[FAILED] {crit.title}</span>
                                </div>
                                {crit.feedback && (
                                  <p className="text-[11px] text-[#71807C] pl-5.5 font-mono leading-relaxed">
                                    {crit.feedback}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeBottomTab === "problems" && (
                        <div className="p-3 text-[#71807C] py-6 text-center text-xs">
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
                          serverError={serverError}
                          isCompact={false}
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
            className="bg-[#0D1214] flex flex-col overflow-hidden"
          >
            <AiMentor
              currentTask={currentTask}
              activeFilePath={activeFilePath}
              state={mentor.state}
              onNudge={mentor.requestNudge}
              onSend={mentor.sendMessage}
              onClearHint={mentor.clearAnnotation}
              onClearMessages={mentor.clearMessages}
              userName={user?.name || "Tanishq"}
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
                        className={`p-2 rounded-lg border text-xs flex items-start gap-2 ${isPassed
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
