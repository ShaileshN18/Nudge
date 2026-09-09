"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { X, FileCode, AlertTriangle } from "lucide-react";
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
  // handle dotfiles like .gitignore, .env
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

// ─── CodeEditor Component ───────────────────────────────────────────

export default function CodeEditor({
  activePath,
  tabs,
  onSelectTab,
  onCloseTab,
}: CodeEditorProps) {
  // Content cache: maps path → { content, savedContent }
  const contentCache = useRef<
    Map<string, { content: string; savedContent: string }>
  >(new Map());

  const [currentContent, setCurrentContent] = useState<string>("");
  const [loadingFile, setLoadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const editorRef = useRef<any>(null);

  // ── Load file from WebContainer or cache ──────────────────────────

  const loadFile = useCallback(async (path: string) => {
    if (!path) return;

    // Check cache first
    const cached = contentCache.current.get(path);
    if (cached) {
      setCurrentContent(cached.content);
      setFileError(null);
      return;
    }

    // Binary guard
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
    } catch (err: any) {
      setFileError(err?.message || "Could not read file.");
      setCurrentContent("");
    } finally {
      setLoadingFile(false);
    }
  }, []);

  useEffect(() => {
    loadFile(activePath);
  }, [activePath, loadFile]);

  // ── Handle editor content changes ─────────────────────────────────

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      const val = value ?? "";
      setCurrentContent(val);
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
    [activePath]
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

      // Ctrl/Cmd + S → save
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

  // ── Check if a tab is dirty ───────────────────────────────────────

  function isTabDirty(path: string): boolean {
    const cached = contentCache.current.get(path);
    if (!cached) return false;
    return cached.content !== cached.savedContent;
  }

  // ── Tab name helper ───────────────────────────────────────────────

  function tabName(path: string): string {
    return path.split("/").pop() || path;
  }

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div className="h-full w-full flex flex-col bg-[#1e1e1e]">
      {/* Tab Bar */}
      <div className="flex items-center bg-[#252526] border-b border-[#1e1e1e] overflow-x-auto shrink-0">
        {tabs.map((tab) => {
          const isActive = tab.path === activePath;
          const dirty = isTabDirty(tab.path);
          return (
            <div
              key={tab.path}
              className={`group flex items-center gap-1.5 px-3 py-[7px] text-xs font-mono cursor-pointer border-r border-[#1e1e1e] select-none transition-colors ${
                isActive
                  ? "bg-[#1e1e1e] text-slate-200 border-t-2 border-t-indigo-500"
                  : "bg-[#2d2d2d] text-slate-400 hover:text-slate-200 border-t-2 border-t-transparent"
              }`}
              onClick={() => onSelectTab(tab.path)}
            >
              <FileCode className="h-3.5 w-3.5 text-indigo-400/70 shrink-0" />
              <span className="truncate max-w-[140px]">{tabName(tab.path)}</span>
              {dirty && (
                <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.path);
                  // Remove from cache when tab is closed
                  contentCache.current.delete(tab.path);
                }}
                className="ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-700 text-slate-500 hover:text-slate-200 transition-all"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}

        {/* Saved flash */}
        {savedFlash && (
          <div className="ml-2 px-2 py-0.5 text-[10px] text-emerald-400 font-semibold animate-pulse">
            ✓ Saved
          </div>
        )}
      </div>

      {/* Editor Area */}
      <div className="flex-1 w-full relative">
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
            <p className="text-xs">Select a file to start editing</p>
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
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: "on",
              automaticLayout: true,
              tabSize: 2,
              renderWhitespace: "selection",
              bracketPairColorization: { enabled: true },
              padding: { top: 8 },
              smoothScrolling: true,
              cursorSmoothCaretAnimation: "on",
              cursorBlinking: "smooth",
            }}
            onChange={handleEditorChange}
            onMount={handleEditorMount}
          />
        )}
      </div>
    </div>
  );
}
