"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import {
  X,
  FileCode,
  AlertTriangle,
  Plus,
  Maximize2,
  Minimize2,
  Lightbulb,
} from "lucide-react";
import { readProjectFile, writeProjectFile } from "@/lib/webcontainer";

// ─── Types ───────────────────────────────────────────────────────────

export interface OpenTab {
  path: string;
  dirty: boolean;
}

export interface EditorHint {
  targetFile: string;
  startLine: number;
  endLine: number;
  hint: string;
  concept?: string;
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
  /** Optional callback when a file finishes loading into the editor */
  onFileLoaded?: (content: string) => void;
  /** Optional callback when user clicks Aria nudge suggestion */
  onTriggerAriaNudge?: (prompt: string) => void;
  /** Optional fallback initial files */
  initialFiles?: Array<{ path: string; content: string }>;
  /** Optional new tab trigger */
  onNewTab?: () => void;
  /** Active line nudge hint to highlight in editor */
  activeHint?: EditorHint | null;
  /** Callback to dismiss/clear current hint decoration */
  onClearHint?: () => void;
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
  onFileLoaded,
  onTriggerAriaNudge,
  initialFiles,
  onNewTab,
  activeHint,
  onClearHint,
}: CodeEditorProps) {
  const initialFilesRef = useRef(initialFiles);
  initialFilesRef.current = initialFiles;
  const onFileLoadedRef = useRef(onFileLoaded);
  onFileLoadedRef.current = onFileLoaded;

  const contentCache = useRef<
    Map<string, { content: string; savedContent: string }>
  >(new Map());

  const [currentContent, setCurrentContent] = useState<string>("");
  const [loadingFile, setLoadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const activeHintRef = useRef(activeHint);
  activeHintRef.current = activeHint;
  const activePathRef = useRef(activePath);
  activePathRef.current = activePath;

  const [bubblePos, setBubblePos] = useState<{
    top: number;
    left: number;
    beakOffset: number;
    visible: boolean;
  } | null>(null);

  // ── Calculate Position of Floating Aria Speech Bubble ───────────────
  const updateBubblePosition = useCallback(() => {
    if (!editorRef.current || !activeHintRef.current) {
      setBubblePos(null);
      return;
    }

    const editor = editorRef.current;
    const hint = activeHintRef.current;
    const currentPath = activePathRef.current || "";

    const cleanActive = currentPath.replace(/[`"'\s]/g, "").replace(/^\/+/, "").toLowerCase();
    const cleanHintFile = (hint.targetFile || "").replace(/[`"'\s]/g, "").replace(/^\/+/, "").toLowerCase();
    const activeBase = cleanActive.split("/").pop() || cleanActive;
    const hintBase = cleanHintFile.split("/").pop() || cleanHintFile;

    const isMatch =
      !cleanHintFile ||
      cleanActive === cleanHintFile ||
      cleanActive.endsWith("/" + cleanHintFile) ||
      cleanHintFile.endsWith("/" + cleanActive) ||
      (Boolean(activeBase) && Boolean(hintBase) && activeBase === hintBase);

    if (!isMatch || !hint.startLine) {
      setBubblePos(null);
      return;
    }

    const model = editor.getModel();
    if (!model) {
      setBubblePos(null);
      return;
    }

    const lineCount = model.getLineCount();
    const targetLine = Math.max(1, Math.min(hint.startLine, lineCount));
    const lineContent = model.getLineContent(targetLine) || "";
    // Target column right after the line's code
    const targetCol = Math.max(lineContent.length + 3, 1);

    const pos = editor.getScrolledVisiblePosition({
      lineNumber: targetLine,
      column: targetCol,
    });

    if (!pos) {
      // Scrolled off-screen
      setBubblePos((prev) => (prev ? { ...prev, visible: false } : null));
      return;
    }

    const domNode = editor.getDomNode();
    const editorWidth = domNode ? domNode.clientWidth : 750;
    const editorHeight = domNode ? domNode.clientHeight : 500;

    const bubbleWidth = 330;
    const bubbleHeight = 155;
    const lineHeight = pos.height || 19;
    const lineCenterY = pos.top + lineHeight / 2;

    // Horizontally: position to the right of code, but at least 220px from gutter
    let left = Math.max(pos.left + 28, 220);
    if (left + bubbleWidth > editorWidth - 16) {
      left = Math.max(16, editorWidth - bubbleWidth - 16);
    }

    // Vertically: align beak with line center
    let defaultBeakOffset = 65;
    let top = lineCenterY - defaultBeakOffset;

    if (top < 12) {
      top = 12;
    } else if (top + bubbleHeight > editorHeight - 16) {
      top = Math.max(12, editorHeight - bubbleHeight - 16);
    }

    // Dynamic beak offset so it points directly at lineCenterY
    const beakOffset = Math.max(24, Math.min(bubbleHeight - 24, lineCenterY - top));

    setBubblePos({
      top,
      left,
      beakOffset,
      visible: true,
    });
  }, []);

  // ── Apply Monaco Line Highlight for "Need a Nudge" ─────────────────
  const applyDecorations = useCallback(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    const cleanActive = (activePath || "").replace(/[`"'\s]/g, "").replace(/^\/+/, "").toLowerCase();
    const cleanHintFile = (activeHint?.targetFile || "").replace(/[`"'\s]/g, "").replace(/^\/+/, "").toLowerCase();
    const activeBase = cleanActive.split("/").pop() || cleanActive;
    const hintBase = cleanHintFile.split("/").pop() || cleanHintFile;

    const isMatchingFile =
      Boolean(activeHint) &&
      (!cleanHintFile ||
        cleanActive === cleanHintFile ||
        cleanActive.endsWith("/" + cleanHintFile) ||
        cleanHintFile.endsWith("/" + cleanActive) ||
        (Boolean(activeBase) && Boolean(hintBase) && activeBase === hintBase));

    if (isMatchingFile && activeHint?.startLine) {
      const start = Math.max(1, activeHint.startLine);
      const end = Math.max(start, activeHint.endLine || start);

      const newDecorations = [
        {
          range: new monaco.Range(start, 1, end, 1),
          options: {
            isWholeLine: true,
            className: "monaco-nudge-line-highlight",
            linesDecorationsClassName: "monaco-nudge-gutter-indicator",
            glyphMarginClassName: "monaco-nudge-glyph-margin",
            glyphMarginHoverMessage: { value: `💡 **Aria**: ${activeHint.hint}` },
            hoverMessage: { value: `💡 **Aria**: ${activeHint.hint}` },
          },
        },
      ];

      decorationsRef.current = editor.deltaDecorations(
        decorationsRef.current,
        newDecorations
      );

      // Smooth scroll to the highlighted lines
      editor.revealLineInCenter(start);
      // Position floating speech bubble
      setTimeout(updateBubblePosition, 60);
    } else {
      if (decorationsRef.current.length > 0) {
        decorationsRef.current = editor.deltaDecorations(
          decorationsRef.current,
          []
        );
      }
      setBubblePos(null);
    }
  }, [activeHint, activePath, updateBubblePosition]);

  useEffect(() => {
    applyDecorations();
    updateBubblePosition();
    const timer = setTimeout(() => {
      applyDecorations();
      updateBubblePosition();
    }, 120);
    return () => clearTimeout(timer);
  }, [applyDecorations, updateBubblePosition, currentContent]);

  // ── Load file from WebContainer or cache ──────────────────────────

  // ── Load file from WebContainer or cache ──────────────────────────

  const loadFile = useCallback(async (path: string) => {
    if (!path) return;

    if (contentCache.current.has(path)) {
      const cached = contentCache.current.get(path)!;
      setCurrentContent(cached.content);
      onFileLoadedRef.current?.(cached.content);
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
      onFileLoadedRef.current?.(content);
    } catch (err: any) {
      // Check fallback from initial project files if WebContainer is still starting
      const cleanPath = path.replace(/^\/+/, "");
      const fallback = initialFilesRef.current?.find(
        (f) => f.path === path || f.path.replace(/^\/+/, "") === cleanPath
      );
      if (fallback) {
        contentCache.current.set(path, {
          content: fallback.content,
          savedContent: fallback.content,
        });
        setCurrentContent(fallback.content);
        onFileLoadedRef.current?.(fallback.content);
      } else {
        setFileError(err?.message || "Could not read file.");
        setCurrentContent("");
      }
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
      monacoRef.current = monaco;

      editor.onDidScrollChange(() => {
        updateBubblePosition();
      });

      editor.onDidLayoutChange(() => {
        updateBubblePosition();
      });

      editor.onDidChangeModelContent(() => {
        updateBubblePosition();
      });

      editor.onDidChangeModel(() => {
        decorationsRef.current = [];
        setTimeout(() => {
          applyDecorations();
          updateBubblePosition();
        }, 80);
      });

      editor.addAction({
        id: "nudge-save-file",
        label: "Save File to WebContainer",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
        run: () => {
          saveFile();
        },
      });

      setTimeout(() => {
        applyDecorations();
        updateBubblePosition();
      }, 100);
    },
    [applyDecorations, updateBubblePosition, saveFile]
  );

  function isTabDirty(path: string): boolean {
    const cached = contentCache.current.get(path);
    if (!cached) return false;
    return cached.content !== cached.savedContent;
  }

  function tabName(path: string): string {
    return path.split("/").pop() || path;
  }

  const cleanActive = (activePath || "").replace(/^\/+/, "").toLowerCase();
  const cleanHintFile = (activeHint?.targetFile || "").replace(/^\/+/, "").toLowerCase();
  const activeBase = cleanActive.split("/").pop() || cleanActive;
  const hintBase = cleanHintFile.split("/").pop() || cleanHintFile;

  const isMatchingHintFile =
    Boolean(activeHint) &&
    (cleanActive === cleanHintFile ||
      cleanActive.endsWith("/" + cleanHintFile) ||
      cleanHintFile.endsWith("/" + cleanActive) ||
      (Boolean(activeBase) && Boolean(hintBase) && activeBase === hintBase));

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

          {isMatchingHintFile && activeHint && (!bubblePos || !bubblePos.visible) && (
            <button
              onClick={() => {
                editorRef.current?.revealLineInCenter(activeHint.startLine);
                setTimeout(updateBubblePosition, 50);
              }}
              className="ml-2 px-2 py-0.5 text-[10px] font-medium text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 rounded border border-amber-500/30 transition-colors flex items-center gap-1 shrink-0 animate-in fade-in"
              title="Jump to highlighted line"
            >
              <Lightbulb className="w-3 h-3 text-amber-400" />
              <span>Line {activeHint.startLine} Nudge</span>
            </button>
          )}
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex items-center gap-1 text-slate-400">
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
          <>
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
                glyphMargin: true,
                lineDecorationsWidth: 16,
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

            {/* ── Aria Speech Bubble Floating Beside Highlighted Line ── */}
            {isMatchingHintFile && activeHint && bubblePos && bubblePos.visible && (
              <div
                style={{
                  top: `${bubblePos.top}px`,
                  left: `${bubblePos.left}px`,
                  zIndex: 35,
                }}
                className="absolute w-[335px] rounded-2xl bg-[#131627]/95 backdrop-blur-md border border-indigo-500/40 p-4 shadow-[0_0_25px_-4px_rgba(124,58,237,0.35),0_20px_30px_-10px_rgba(0,0,0,0.8)] transition-transform duration-75 select-none animate-in fade-in zoom-in-95"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {/* Pointer Beak pointing directly left to the code line */}
                <div
                  className="absolute -left-[13px] w-[14px] h-[18px] pointer-events-none"
                  style={{
                    top: `${bubblePos.beakOffset}px`,
                    transform: "translateY(-50%)",
                  }}
                >
                  <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
                    {/* Fill */}
                    <polygon points="14,0 0,9 14,18" fill="#131627" />
                    {/* Left point angled borders matching indigo border */}
                    <polyline
                      points="14,0 0,9 14,18"
                      stroke="rgba(129, 140, 248, 0.55)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Card Header: Avatar, Aria title, Close button */}
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm border border-indigo-400/30">
                      <svg
                        className="w-3.5 h-3.5 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="9" cy="11" r="1.2" fill="currentColor" />
                        <circle cx="15" cy="11" r="1.2" fill="currentColor" />
                        <path d="M9 16c.83.67 2.17.67 3 0" />
                        <rect width="18" height="14" x="3" y="6" rx="4" />
                      </svg>
                    </div>
                    <span className="text-white text-[13px] font-semibold tracking-tight">
                      Aria
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearHint?.();
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Dismiss hint"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card Body: The subtle hint text */}
                <div className="py-2.5 text-[13px] text-slate-200/90 leading-relaxed font-normal select-text">
                  {activeHint.hint}
                </div>

                {/* Card Footer: "💡 Think: <concept>" pill badge/button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const promptText = activeHint.concept
                        ? `Can you guide me on the concept: "${activeHint.concept}"?`
                        : `Can you explain this hint in more detail?`;
                      onTriggerAriaNudge?.(promptText);
                    }}
                    className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1b1e36] border border-indigo-500/30 text-indigo-200 text-xs font-medium hover:bg-indigo-900/40 hover:border-indigo-400/50 hover:text-white transition-all cursor-pointer shadow-sm text-left max-w-full"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-indigo-400 group-hover:text-amber-300 transition-colors shrink-0" />
                    <span className="truncate">
                      Think: {activeHint.concept || "inspect this logic"}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
