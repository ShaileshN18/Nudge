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
  Sparkles,
  Copy,
  ChevronRight,
  XCircle,
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
  isError?: boolean;
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

  const [whyWorksOpen, setWhyWorksOpen] = useState(false);

  // ── Calculate Position of Floating Popover & Connector Line ──────────
  const [popoverPos, setPopoverPos] = useState<{
    top: number;
    left: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    visible: boolean;
  } | null>(null);

  const updateBubblePosition = useCallback(() => {
    if (!editorRef.current || !activeHintRef.current) {
      setPopoverPos(null);
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
      setPopoverPos(null);
      return;
    }

    const model = editor.getModel();
    if (!model) {
      setPopoverPos(null);
      return;
    }

    const lineCount = model.getLineCount();
    const targetLine = Math.max(1, Math.min(hint.startLine, lineCount));
    const lineContent = model.getLineContent(targetLine) || "";
    const targetCol = Math.max(lineContent.length + 3, 1);

    const pos = editor.getScrolledVisiblePosition({
      lineNumber: targetLine,
      column: targetCol,
    });

    if (!pos) {
      setPopoverPos((prev) => (prev ? { ...prev, visible: false } : null));
      return;
    }

    const domNode = editor.getDomNode();
    const editorWidth = domNode ? domNode.clientWidth : 750;
    const editorHeight = domNode ? domNode.clientHeight : 500;

    const cardWidth = hint.isError ? 290 : 340;
    const cardHeight = hint.isError ? 75 : 180;
    const lineHeight = pos.height || 19;
    const lineCenterY = pos.top + lineHeight / 2;
    const lineRightX = Math.max(pos.left + 24, 210);

    // Position popover to the right
    let left = Math.max(lineRightX + 40, 260);
    if (left + cardWidth > editorWidth - 16) {
      left = Math.max(16, editorWidth - cardWidth - 16);
    }

    let top = lineCenterY - 45;
    if (top < 12) top = 12;
    if (top + cardHeight > editorHeight - 16) {
      top = Math.max(12, editorHeight - cardHeight - 16);
    }

    setPopoverPos({
      top,
      left,
      startX: lineRightX,
      startY: lineCenterY,
      endX: left,
      endY: top + 40,
      visible: true,
    });
  }, []);

  // ── Apply Monaco Line Highlight for Error or Nudge ─────────────────
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
      const isError = Boolean(activeHint.isError);

      const newDecorations = [
        {
          range: new monaco.Range(start, 1, end, 1),
          options: {
            isWholeLine: true,
            className: isError ? "monaco-error-line-highlight" : "monaco-nudge-line-highlight",
            linesDecorationsClassName: isError ? "monaco-error-gutter-indicator" : "monaco-nudge-gutter-indicator",
            glyphMarginClassName: isError ? "monaco-error-glyph-margin" : "monaco-nudge-glyph-margin",
            glyphMarginHoverMessage: { value: isError ? `❌ **Error**: ${activeHint.hint}` : `💡 **Hint**: ${activeHint.hint}` },
            hoverMessage: { value: isError ? `❌ **Error**: ${activeHint.hint}` : `💡 **Hint**: ${activeHint.hint}` },
          },
        },
      ];

      decorationsRef.current = editor.deltaDecorations(
        decorationsRef.current,
        newDecorations
      );

      editor.revealLineInCenter(start);
      setTimeout(updateBubblePosition, 60);
    } else {
      if (decorationsRef.current.length > 0) {
        decorationsRef.current = editor.deltaDecorations(
          decorationsRef.current,
          []
        );
      }
      setPopoverPos(null);
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

      // Define custom Nudge Dark theme matching DESIGN.md
      monaco.editor.defineTheme("nudge-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "comment", foreground: "71807C", fontStyle: "italic" },
          { token: "keyword", foreground: "6BCDB4" },
          { token: "string", foreground: "E9C46A" },
          { token: "number", foreground: "76A8FF" },
          { token: "identifier", foreground: "F4F7F6" },
          { token: "type", foreground: "82CDBD" },
        ],
        colors: {
          "editor.background": "#080C0D",
          "editor.foreground": "#F4F7F6",
          "editor.lineHighlightBackground": "#0D1214",
          "editorCursor.foreground": "#82CDBD",
          "editorLineNumber.foreground": "#4B5754",
          "editorLineNumber.activeForeground": "#A9B5B2",
          "editorGutter.background": "#080C0D",
          "editorIndentGuide.background": "#151D1F",
          "editorIndentGuide.activeBackground": "#202A2C",
        },
      });
      monaco.editor.setTheme("nudge-dark");

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

  const cleanActive = (activePath || "").replace(/[`"'\s]/g, "").replace(/^\/+/, "").toLowerCase();
  const cleanHintFile = (activeHint?.targetFile || "").replace(/[`"'\s]/g, "").replace(/^\/+/, "").toLowerCase();
  const activeBase = cleanActive.split("/").pop() || cleanActive;
  const hintBase = cleanHintFile.split("/").pop() || cleanHintFile;

  const isMatchingHintFile =
    Boolean(activeHint) &&
    (!cleanHintFile ||
      cleanActive === cleanHintFile ||
      cleanActive.endsWith("/" + cleanHintFile) ||
      cleanHintFile.endsWith("/" + cleanActive) ||
      (Boolean(activeBase) && Boolean(hintBase) && activeBase === hintBase));

  return (
    <div className="flex flex-col h-full w-full bg-[#080C0D] text-[#F4F7F6] overflow-hidden">
      {/* ── Tabs Bar ── */}
      <div className="flex items-center justify-between bg-[#0D1214] border-b border-[#202A2C] px-2 min-h-[36px] overflow-x-auto shrink-0 select-none">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
          {tabs.map((tab) => {
            const isActive = tab.path === activePath;
            const dirty = isTabDirty(tab.path);
            return (
              <div
                key={tab.path}
                onClick={() => onSelectTab(tab.path)}
                className={`group flex items-center gap-2 px-3 py-1 text-xs font-mono rounded cursor-pointer select-none transition-all ${
                  isActive
                    ? "bg-[#11181A] text-[#F4F7F6] border border-[#202A2C] border-b-transparent font-medium"
                    : "text-[#71807C] hover:text-[#A9B5B2] hover:bg-[#11181A]/50 border border-transparent"
                }`}
              >
                {getTabBadge(tab.path)}
                <span className="truncate max-w-[130px]">{tabName(tab.path)}</span>

                {dirty && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E9C46A] shrink-0" />
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.path);
                    contentCache.current.delete(tab.path);
                  }}
                  className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-[#151D1F] text-[#71807C] hover:text-[#F4F7F6] transition-all"
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
              className="p-1.5 rounded hover:bg-[#151D1F] text-[#71807C] hover:text-[#F4F7F6] transition-colors"
              title="Add Tab"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}

          {savedFlash && (
            <div className="ml-2 px-2 py-0.5 text-[10px] text-[#67D6B2] font-semibold animate-pulse">
              ✓ Saved
            </div>
          )}

          {isMatchingHintFile && activeHint && (!popoverPos || !popoverPos.visible) && (
            <button
              onClick={() => {
                editorRef.current?.revealLineInCenter(activeHint.startLine);
                setTimeout(updateBubblePosition, 50);
              }}
              className="ml-2 px-2 py-0.5 text-[10px] font-medium text-[#6BCDB4] hover:text-white bg-[#6BCDB4]/20 hover:bg-[#6BCDB4]/30 rounded border border-[#6BCDB4]/30 transition-colors flex items-center gap-1 shrink-0 animate-in fade-in"
              title="Jump to highlighted line"
            >
              <Lightbulb className="w-3 h-3 text-[#6BCDB4]" />
              <span>Line {activeHint.startLine} Nudge</span>
            </button>
          )}
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex items-center gap-1 text-[#71807C]">
          <button
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="p-1.5 rounded hover:bg-[#151D1F] hover:text-[#F4F7F6] transition-colors cursor-pointer"
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

      {/* ── Editor Area ── */}
      <div className="flex-1 w-full relative overflow-hidden bg-[#080C0D]">
        {loadingFile ? (
          <div className="flex items-center justify-center h-full text-xs text-[#71807C]">
            Loading file…
          </div>
        ) : fileError ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-[#71807C]">
            <AlertTriangle className="h-8 w-8 text-[#E9C46A]/60" />
            <p className="text-xs">{fileError}</p>
          </div>
        ) : !activePath ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-[#71807C]">
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
              theme="nudge-dark"
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                glyphMargin: true,
                lineDecorationsWidth: 16,
                scrollBeyondLastLine: false,
                wordWrap: "on",
                automaticLayout: true,
                tabSize: 2,
                padding: { top: 12 },
                smoothScrolling: true,
                cursorSmoothCaretAnimation: "on",
                cursorBlinking: "smooth",
              }}
              onChange={handleEditorChange}
              onMount={handleEditorMount}
            />

            {/* ── SVG Curved Connector Line between Code Line & Popover ── */}
            {isMatchingHintFile && activeHint && !activeHint.isError && popoverPos && popoverPos.visible && (
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ width: "100%", height: "100%", zIndex: 30 }}
              >
                <path
                  d={`M ${popoverPos.startX} ${popoverPos.startY} C ${popoverPos.startX + 30} ${popoverPos.startY}, ${popoverPos.endX - 30} ${popoverPos.endY}, ${popoverPos.endX} ${popoverPos.endY}`}
                  fill="none"
                  stroke="#6BCDB4"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                  opacity={0.85}
                />
              </svg>
            )}

            {/* ── Mode 1: Floating Evaluation Failed Error Tooltip ── */}
            {isMatchingHintFile && activeHint && activeHint.isError && popoverPos && popoverPos.visible && (
              <div
                style={{
                  top: `${popoverPos.top}px`,
                  left: `${popoverPos.left}px`,
                  zIndex: 35,
                }}
                className="absolute w-[290px] rounded-xl bg-[#11181A]/95 backdrop-blur-md border border-[#F06A6A]/60 p-3 shadow-2xl transition-all select-none animate-in fade-in"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="flex items-start gap-2.5">
                  <XCircle className="w-4 h-4 text-[#F06A6A] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[#F06A6A]">Evaluation failed</div>
                    <p className="text-[11px] text-[#A9B5B2] mt-0.5 leading-snug">
                      {activeHint.hint || "This line is causing an error. See details below."}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearHint?.();
                    }}
                    className="p-1 rounded text-[#71807C] hover:text-[#F4F7F6] transition-colors"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ── Mode 2: Floating AI Hint Popover with Socratic Guidance ── */}
            {isMatchingHintFile && activeHint && !activeHint.isError && popoverPos && popoverPos.visible && (
              <div
                style={{
                  top: `${popoverPos.top}px`,
                  left: `${popoverPos.left}px`,
                  zIndex: 35,
                }}
                className="absolute w-[340px] rounded-2xl bg-[#0D1214]/95 backdrop-blur-md border border-[#6BCDB4]/50 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.5)] transition-all select-none animate-in fade-in"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {/* Header: Sparkle + AI Hint + Close */}
                <div className="flex items-center justify-between pb-2.5 border-b border-[#202A2C]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#6BCDB4]" />
                    <span className="text-xs font-bold text-[#F4F7F6] tracking-tight">
                      AI Hint
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearHint?.();
                    }}
                    className="p-1 rounded-md text-[#71807C] hover:text-[#F4F7F6] hover:bg-[#151D1F] transition-colors cursor-pointer"
                    title="Dismiss hint"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Body: Conceptual Guidance */}
                <div className="py-2.5 space-y-2 select-text">
                  <p className="text-xs text-[#F4F7F6] leading-relaxed">
                    {activeHint.hint}
                  </p>
                  {activeHint.concept && (
                    <div className="text-[11px] text-[#A9B5B2] leading-relaxed">
                      Focus on: <span className="font-semibold text-[#82CDBD]">{activeHint.concept}</span>
                    </div>
                  )}
                </div>

                {/* Socratic Accordion: Why this works? */}
                <div className="pt-2 border-t border-[#202A2C]">
                  <button
                    type="button"
                    onClick={() => setWhyWorksOpen((prev) => !prev)}
                    className="flex items-center justify-between w-full text-left text-xs font-medium text-[#A9B5B2] hover:text-[#F4F7F6] transition-colors py-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <ChevronRight
                        className={`w-3.5 h-3.5 text-[#6BCDB4] transition-transform duration-200 ${
                          whyWorksOpen ? "rotate-90" : ""
                        }`}
                      />
                      <span>Why this works?</span>
                    </div>
                  </button>

                  {whyWorksOpen && (
                    <div className="mt-2 p-2.5 rounded-lg bg-[#11181A] border border-[#202A2C] text-[11px] text-[#A9B5B2] leading-relaxed select-text animate-in fade-in">
                      Mongoose models provide <code className="text-[#82CDBD] font-mono">Feedback.find()</code> to query all documents. Chaining <code className="text-[#82CDBD] font-mono">.sort(&#123; createdAt: -1 &#125;)</code> orders records from newest to oldest before returning them in <code className="text-[#82CDBD] font-mono">res.status(200).json(feedback)</code>.
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
