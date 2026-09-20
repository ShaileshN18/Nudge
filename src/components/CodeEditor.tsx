"use client";

import React, { useRef } from "react";
import dynamic from "next/dynamic";
import {
  X,
  FileCode,
  FileJson,
  FileText,
  File,
  Sparkles,
} from "lucide-react";
import { WorkspaceFile } from "./FileTree";

// Dynamically import Monaco Editor to prevent SSR issues
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface CodeEditorProps {
  files: WorkspaceFile[];
  activeFilePath: string;
  openTabs: string[];
  targetFiles?: string[];
  onSelectTab: (path: string) => void;
  onCloseTab: (path: string) => void;
  onChangeContent: (content: string) => void;
  onSave?: () => void;
  onEvaluate?: () => void;
}

export default function CodeEditor({
  files,
  activeFilePath,
  openTabs,
  targetFiles = [],
  onSelectTab,
  onCloseTab,
  onChangeContent,
  onSave,
  onEvaluate,
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);

  const activeFile = files.find((f) => f.path === activeFilePath);
  const activeContent = activeFile?.content || "";

  const getLanguage = (path: string) => {
    if (path.endsWith(".js") || path.endsWith(".jsx")) return "javascript";
    if (path.endsWith(".ts") || path.endsWith(".tsx")) return "typescript";
    if (path.endsWith(".json")) return "json";
    if (path.endsWith(".md")) return "markdown";
    if (path.endsWith(".html")) return "html";
    if (path.endsWith(".css")) return "css";
    return "javascript";
  };

  const getFileIcon = (filename: string) => {
    if (
      filename.endsWith(".js") ||
      filename.endsWith(".jsx") ||
      filename.endsWith(".ts") ||
      filename.endsWith(".tsx")
    ) {
      return <FileCode className="w-3.5 h-3.5 text-[#67D6B2]" />;
    }
    if (filename.endsWith(".json")) {
      return <FileJson className="w-3.5 h-3.5 text-[#E9C46A]" />;
    }
    if (filename.endsWith(".md")) {
      return <FileText className="w-3.5 h-3.5 text-[#76A8FF]" />;
    }
    return <File className="w-3.5 h-3.5 text-[#A9B5B2]" />;
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Define custom dark theme
    monaco.editor.defineTheme("nudgeDark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "71807C", fontStyle: "italic" },
        { token: "keyword", foreground: "67D6B2", fontStyle: "bold" },
        { token: "string", foreground: "E9C46A" },
        { token: "number", foreground: "76A8FF" },
        { token: "identifier", foreground: "F4F7F6" },
      ],
      colors: {
        "editor.background": "#080C0D",
        "editor.foreground": "#F4F7F6",
        "editor.lineHighlightBackground": "#11181A",
        "editorLineNumber.foreground": "#4B5754",
        "editorLineNumber.activeForeground": "#67D6B2",
        "editorIndentGuide.background": "#151D1F",
        "editorIndentGuide.activeBackground": "#2A3739",
        "editorCursor.foreground": "#67D6B2",
      },
    });

    monaco.editor.setTheme("nudgeDark");

    // Shortcut: Ctrl+S or Cmd+S to save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave?.();
    });

    // Shortcut: Ctrl+Enter or Cmd+Enter to run evaluation
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onEvaluate?.();
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#080C0D] overflow-hidden">
      {/* Tabs Header */}
      <div className="bg-[#0D1214] border-b border-[#202A2C] flex items-center overflow-x-auto select-none no-scrollbar">
        {openTabs.map((tabPath) => {
          const isActive = tabPath === activeFilePath;
          const isTarget = targetFiles.includes(tabPath);
          const tabName = tabPath.split("/").pop() || tabPath;

          return (
            <div
              key={tabPath}
              onClick={() => onSelectTab(tabPath)}
              className={`group flex items-center gap-2 px-3.5 py-2 text-xs border-r border-[#202A2C] transition-colors cursor-pointer shrink-0 ${
                isActive
                  ? "bg-[#080C0D] text-white border-t-2 border-t-[#67D6B2] font-medium"
                  : "bg-[#0D1214] text-[#71807C] hover:text-[#A9B5B2] hover:bg-[#11181A]"
              }`}
            >
              {getFileIcon(tabName)}
              <span className="truncate max-w-[140px]">{tabName}</span>

              {isTarget && (
                <span
                  title="Target file for current task"
                  className="w-1.5 h-1.5 rounded-full bg-[#67D6B2]"
                />
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tabPath);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#202A2C] hover:text-white rounded transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 relative">
        {activeFile ? (
          <Editor
            height="100%"
            language={getLanguage(activeFile.path)}
            value={activeContent}
            onChange={(val) => onChangeContent(val || "")}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              fontSize: 13,
              fontFamily:
                "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
              fontLigatures: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: "on",
              lineNumbers: "on",
              renderLineHighlight: "all",
              smoothScrolling: true,
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              padding: { top: 12, bottom: 12 },
            }}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#71807C]">
            <Sparkles className="w-8 h-8 text-[#202A2C] mb-2" />
            <p className="text-xs">No file selected.</p>
            <p className="text-[11px] text-[#4B5754] mt-1">
              Select a file from the workspace file explorer on the left to start editing.
            </p>
          </div>
        )}
      </div>

      {/* Editor Footer Status Bar */}
      <div className="bg-[#0D1214] border-t border-[#202A2C] px-3 py-1 flex items-center justify-between text-[11px] text-[#71807C] select-none">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[#A9B5B2]">
            {activeFile?.path || "No file"}
          </span>
          {targetFiles.includes(activeFile?.path || "") && (
            <span className="text-[10px] text-[#67D6B2] font-semibold flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              Active Task Target
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[10px]">
          <span>UTF-8</span>
          <span>{activeFile ? getLanguage(activeFile.path) : "plain"}</span>
          <span className="hidden sm:inline">Ctrl+S to save</span>
          <span className="hidden sm:inline">Ctrl+Enter to evaluate</span>
        </div>
      </div>
    </div>
  );
}
