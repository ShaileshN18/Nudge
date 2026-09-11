"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import {
  X,
  FileCode,
  AlertTriangle,
  Plus,
  Columns,
  Maximize2,
  Minimize2,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import { readProjectFile, writeProjectFile } from "@/lib/webcontainer";

// ─── Types ───────────────────────────────────────────────────────────

export interface OpenTab {
  path: string;
  dirty: boolean;
}

interface CodeEditorProps {
  /** Currently visible file path */
  activePath: string;
  /** All open tabs — managed by parent */
  tabs: OpenTab[];
  /** Called when user clicks a tab */
  onSelectTab: (path: string) => void;
  /** Called when user closes a tab via × */
  onCloseTab: (path: string) => void;
  /** Optional callback reporting live editor content changes */
  onContentChange?: (content: string) => void;
  /** Optional callback when user clicks Aria nudge suggestion */
  onTriggerAriaNudge?: (prompt: string) => void;
  /** Optional new tab trigger */
  onNewTab?: () => void;
}

// ─── Language Detection ─────────────────────────────────────────────

function getLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    ts: "typescript",
    tsx: "typescript",
    json: "json",
    html: "html",
    htm: "html",
    css: "css",
    scss: "scss",
    less: "less",
    md: "markdown",
    mdx: "markdown",
    py: "python",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    svg: "xml",
    sh: "shell",
    bash: "shell",
    sql: "sql",
    graphql: "graphql",
    gql: "graphql",
    toml: "ini",
    env: "ini",
    gitignore: "plaintext",
    dockerfile: "dockerfile",
  };
  const basename = path.split("/").pop() ?? "";
  if (basename === ".gitignore") return "plaintext";
  if (basename === ".env" || basename.startsWith(".env.")) return "ini";
  if (basename === "Dockerfile") return "dockerfile";
  return map[ext] || "plaintext";
}

// ─── Binary Detection ───────────────────────────────────────────────

const BINARY_EXTS = new Set([
  "png", "jpg", "jpeg", "gif", "ico", "bmp", "webp", "avif",
  "woff", "woff2", "ttf", "otf", "eot",
  "mp3", "mp4", "wav", "ogg", "webm",
  "zip", "tar", "gz", "bz2", "7z",
  "pdf", "exe", "dll", "so", "dylib",
  "wasm",
]);

function isBinaryPath(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return BINARY_EXTS.has(ext);
}

function getTabBadge(path: string) {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "js" || ext === "jsx" || ext === "mjs") {
    return <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-yellow-400/15 text-yellow-300 border border-yellow-500/30 shrink-0 leading-none">JS</span>;
  }
  if (ext === "ts" || ext === "tsx") {
    return <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-cyan-400/15 text-cyan-300 border border-cyan-500/30 shrink-0 leading-none">TS</span>;
  }
  if (ext === "json") {
    return <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-500/30 shrink-0 leading-none">{}</span>;
  }
  return <FileCode className="h-3.5 w-3.5 text-slate-400 shrink-0" />;
}

// ─── CodeEditor Component ───────────────────────────────────────────

export default function CodeEditor({
  activePath,
  tabs,
  onSelectTab,
  onCloseTab,
  onContentChange,
  onTriggerAriaNudge,
  onNewTab,
}: CodeEditorProps) {
  const contentCache = useRef<
    Map<string, { content: string; savedContent: string }>
  >(new Map());

  const [currentContent, setCurrentContent] = useState<string>("");
  const [loadingFile, setLoadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [showAriaNudge, setShowAriaNudge] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorRef = useRef<any>(null);

  // ── Load file from WebContainer or cache ──────────────────────────

  const loadFile = useCallback(async (path: string) => {
    if (!path) return;

    if (contentCache.current.has(path)) {
      const cached = contentCache.current.get(path)!;
      setCurrentContent(cached.content);
      onContentChange?.(cached.content);
      setFileError(null);
      return;
    }

    if (isBinaryPath(path)) {
      setFileError("Binary file — cannot display in editor.");
      setCurrentContent("");
      return;
    }

    setLoadingFile(true);
    setFileError(null);
    try {
      const content = await readProjectFile(path);
      contentCache.current.set(path, { content, savedContent: content });
      setCurrentContent(content);
      onContentChange?.(content);
    } catch (err: any) {
      setFileError(err?.message || "Could not read file.");
      setCurrentContent("");
    } finally {
      setLoadingFile(false);
    }
  }, [onContentChange]);

  useEffect(() => {
    loadFile(activePath);
  }, [activePath, loadFile]);

  // ── Handle editor content changes ─────────────────────────────────

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      const val = value ?? "";
      setCurrentContent(val);
      onContentChange?.(val);

      const cached = contentCache.current.get(activePath);
      if (cached) {
        cached.content = val;
      } else {
        contentCache.current.set(activePath, {
          content: val,
          savedContent: val,
        });
      }
    },
    [activePath, onContentChange]
  );

  // ── Save to WebContainer ──────────────────────────────────────────

  const saveFile = useCallback(async () => {
    if (!activePath || fileError) return;
    const cached = contentCache.current.get(activePath);
    if (!cached) return;

    try {
      await writeProjectFile(activePath, cached.content);
      cached.savedContent = cached.content;
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } catch (err) {
      console.error("Save failed:", err);
    }
  }, [activePath, fileError]);

  // ── Register Ctrl/Cmd+S in Monaco ─────────────────────────────────

  const handleEditorMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;

      editor.addAction({
        id: "nudge-save-file",
        label: "Save File to WebContainer",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
        run: () => {
          saveFile();
        },
      });
    },
    [saveFile]
  );

  function isTabDirty(path: string): boolean {
    const cached = contentCache.current.get(path);
    if (!cached) return false;
    return cached.content !== cached.savedContent;
  }

  function tabName(path: string): string {
    return path.split("/").pop() || path;
  }

  // Check if Aria Nudge should be shown for the current active file
  const isPostFile = activePath.endsWith("Post.jsx") || activePath.endsWith("Post.js");

  return (
    <div
      className={`w-full h-full flex flex-col bg-[#161a26] relative ${
        isFullscreen ? "fixed inset-0 z-50 bg-[#161a26]" : ""
      }`}
    >
      {/* Tab Bar */}
      <div className="h-10 flex items-center justify-between bg-[#111420] border-b border-[#1c2235] px-2 shrink-0 select-none overflow-x-auto">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = tab.path === activePath;
            const dirty = isTabDirty(tab.path);
            return (
              <div
                key={tab.path}
                onClick={() => onSelectTab(tab.path)}
                className={`group flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-t cursor-pointer border-r border-[#1c2235] select-none transition-all ${
                  isActive
                    ? "bg-[#181d2c] text-white border-t-2 border-t-amber-400 font-semibold"
                    : "bg-[#0d101a] text-slate-400 hover:text-slate-200 hover:bg-[#131725] border-t-2 border-t-transparent"
                }`}
              >
                {getTabBadge(tab.path)}
                <span className="truncate max-w-[130px]">{tabName(tab.path)}</span>

                {dirty && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.path);
                    contentCache.current.delete(tab.path);
                  }}
                  className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-700 text-slate-500 hover:text-slate-200 transition-all"
                  title="Close tab"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}

          {onNewTab && (
            <button
              onClick={onNewTab}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Add Tab / New File"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}

          {savedFlash && (
            <div className="ml-2 px-2 py-0.5 text-[10px] text-emerald-400 font-semibold animate-pulse">
              ✓ Saved
            </div>
          )}
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={() => setShowAriaNudge((prev) => !prev)}
            className={`p-1.5 rounded hover:bg-slate-800 transition-colors ${
              showAriaNudge ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"
            }`}
            title="Toggle Aria Smart Nudge"
          >
            <Lightbulb className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Editor"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 w-full relative overflow-hidden">
        {loadingFile ? (
          <div className="flex items-center justify-center h-full text-xs text-slate-500">
            Loading file…
          </div>
        ) : fileError ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
            <AlertTriangle className="h-8 w-8 text-amber-500/60" />
            <p className="text-xs">{fileError}</p>
          </div>
        ) : !activePath ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-600">
            <FileCode className="h-10 w-10" />
            <p className="text-xs">Select a file from the explorer or tabs</p>
          </div>
        ) : (
          <Editor
            height="100%"
            path={activePath}
            language={getLanguage(activePath)}
            value={currentContent}
            theme="vs-dark"
            options={{
              fontSize: 13,
              fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
              fontLigatures: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: "on",
              automaticLayout: true,
              tabSize: 2,
              renderWhitespace: "selection",
              bracketPairColorization: { enabled: true },
              padding: { top: 12 },
              smoothScrolling: true,
              cursorSmoothCaretAnimation: "on",
              cursorBlinking: "smooth",
            }}
            onChange={handleEditorChange}
            onMount={handleEditorMount}
          />
        )}

        {/* Inline Aria Smart Nudge Tooltip (Matching the reference screenshot) */}
        {showAriaNudge && isPostFile && (
          <div className="absolute top-20 right-12 z-20 max-w-sm bg-[#131929]/95 backdrop-blur-md border border-emerald-500/30 rounded-xl p-3 shadow-2xl shadow-emerald-950/40 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <div className="h-5 w-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <span className="text-[10px]">🤖</span>
                </div>
                <span>Aria</span>
              </div>
              <button
                onClick={() => setShowAriaNudge(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Dismiss hint"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed mb-3">
              This effect runs on mount, but not when the id changes.
            </p>

            <button
              onClick={() =>
                onTriggerAriaNudge?.(
                  "Explain why this effect runs on mount, but not when the id changes, and how to fix the dependency array."
                )
              }
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-all cursor-pointer group"
            >
              <Lightbulb className="h-3.5 w-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Think: dependency array</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
