"use client";

import React from "react";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  path: string;
  value: string;
  editable?: boolean;
  onChange: (value: string) => void;
}

function getLanguage(path: string): string {
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".ts") || path.endsWith(".tsx")) return "typescript";
  if (path.endsWith(".js") || path.endsWith(".jsx")) return "javascript";
  if (path.endsWith(".html")) return "html";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".md")) return "markdown";
  return "plaintext";
}

export default function CodeEditor({
  path,
  value,
  editable = true,
  onChange,
}: CodeEditorProps) {
  const language = getLanguage(path);

  return (
    <div className="h-full w-full flex flex-col bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-slate-700/60 text-xs font-mono text-slate-300">
        <span className="truncate">{path || "No file selected"}</span>
        {!editable && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-400 uppercase tracking-wide">
            Read Only
          </span>
        )}
      </div>
      <div className="flex-1 w-full">
        <Editor
          height="100%"
          path={path}
          language={language}
          value={value}
          theme="vs-dark"
          options={{
            readOnly: !editable,
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            automaticLayout: true,
            tabSize: 2,
          }}
          onChange={(val) => {
            onChange(val ?? "");
          }}
        />
      </div>
    </div>
  );
}
