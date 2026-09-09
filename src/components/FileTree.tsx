"use client";

import React from "react";
import { FileCode, FileText, FileJson, Lock } from "lucide-react";

export interface FileItem {
  path: string;
  content: string;
  visible?: boolean;
  editable?: boolean;
}

interface FileTreeProps {
  files: FileItem[];
  activePath: string;
  onSelectFile: (path: string) => void;
}

function getFileIcon(path: string) {
  if (path.endsWith(".json")) return <FileJson className="h-4 w-4 text-amber-400" />;
  if (path.endsWith(".js") || path.endsWith(".ts") || path.endsWith(".jsx") || path.endsWith(".tsx")) {
    return <FileCode className="h-4 w-4 text-cyan-400" />;
  }
  return <FileText className="h-4 w-4 text-slate-400" />;
}

export default function FileTree({ files, activePath, onSelectFile }: FileTreeProps) {
  // Only render visible files in the UI
  const visibleFiles = files.filter((f) => f.visible !== false);

  return (
    <div className="flex flex-col space-y-1 py-2">
      <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        Files
      </div>
      {visibleFiles.map((file) => {
        const isActive = activePath === file.path;
        const isReadOnly = file.editable === false;

        return (
          <button
            key={file.path}
            onClick={() => onSelectFile(file.path)}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-mono transition-colors text-left ${
              isActive
                ? "bg-indigo-600/30 text-indigo-300 font-medium border border-indigo-500/40"
                : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              {getFileIcon(file.path)}
              <span className="truncate">{file.path}</span>
            </div>
            {isReadOnly && (
              <Lock className="h-3 w-3 text-slate-500 flex-shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}
