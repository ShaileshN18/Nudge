"use client";

import React, { useState } from "react";
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Sparkles,
  File,
} from "lucide-react";

export interface WorkspaceFile {
  path: string;
  content: string;
}

interface FileTreeProps {
  files: WorkspaceFile[];
  activeFile: string;
  targetFiles?: string[];
  onSelectFile: (path: string) => void;
  onCreateFile?: (path: string) => void;
  onDeleteFile?: (path: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: Record<string, TreeNode>;
}

export default function FileTree({
  files,
  activeFile,
  targetFiles = [],
  onSelectFile,
  onCreateFile,
  onDeleteFile,
}: FileTreeProps) {
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFilePath, setNewFilePath] = useState("");

  const toggleFolder = (folderPath: string) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilePath.trim()) return;
    onCreateFile?.(newFilePath.trim());
    setNewFilePath("");
    setIsCreatingFile(false);
  };

  // Build tree from flat paths
  const rootNode: TreeNode = {
    name: "root",
    path: "",
    isDirectory: true,
    children: {},
  };

  files.forEach((file) => {
    const parts = file.path.split("/").filter(Boolean);
    let currentNode = rootNode;

    parts.forEach((part, idx) => {
      const isLast = idx === parts.length - 1;
      const currentPath = parts.slice(0, idx + 1).join("/");

      if (!currentNode.children) {
        currentNode.children = {};
      }

      if (!currentNode.children[part]) {
        currentNode.children[part] = {
          name: part,
          path: currentPath,
          isDirectory: !isLast,
          children: isLast ? undefined : {},
        };
      }
      currentNode = currentNode.children[part];
    });
  });

  const getFileIcon = (filename: string) => {
    if (filename.endsWith(".js") || filename.endsWith(".jsx") || filename.endsWith(".ts") || filename.endsWith(".tsx")) {
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

  const renderTree = (node: TreeNode, depth = 0) => {
    if (!node.children) return null;

    const entries = Object.values(node.children).sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return entries.map((child) => {
      if (child.isDirectory) {
        const isCollapsed = collapsedFolders[child.path];
        return (
          <div key={child.path} className="select-none">
            <button
              onClick={() => toggleFolder(child.path)}
              style={{ paddingLeft: `${depth * 12 + 10}px` }}
              className="w-full flex items-center gap-1.5 py-1 text-xs text-[#A9B5B2] hover:text-white hover:bg-[#151D1F] transition-colors rounded-sm group cursor-pointer"
            >
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5 text-[#71807C] group-hover:text-white shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-[#71807C] group-hover:text-white shrink-0" />
              )}
              {isCollapsed ? (
                <Folder className="w-3.5 h-3.5 text-[#E9C46A] shrink-0" />
              ) : (
                <FolderOpen className="w-3.5 h-3.5 text-[#E9C46A] shrink-0" />
              )}
              <span className="truncate font-medium">{child.name}</span>
            </button>

            {!isCollapsed && renderTree(child, depth + 1)}
          </div>
        );
      }

      const isActive = activeFile === child.path;
      const isTarget = targetFiles.includes(child.path);

      return (
        <div
          key={child.path}
          style={{ paddingLeft: `${depth * 12 + 14}px` }}
          className={`group flex items-center justify-between py-1 pr-2 text-xs transition-colors rounded-sm cursor-pointer select-none ${
            isActive
              ? "bg-[#67D6B2]/15 text-[#67D6B2] font-semibold border-l-2 border-[#67D6B2]"
              : isTarget
              ? "text-white bg-[#151D1F]/50 hover:bg-[#151D1F] border-l-2 border-[#67D6B2]/40"
              : "text-[#A9B5B2] hover:text-white hover:bg-[#151D1F]"
          }`}
          onClick={() => onSelectFile(child.path)}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {getFileIcon(child.name)}
            <span className="truncate">{child.name}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isTarget && (
              <span
                title="Target file for current task"
                className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#67D6B2]/20 text-[#67D6B2] border border-[#67D6B2]/30"
              >
                <Sparkles className="w-2.5 h-2.5" />
                TASK
              </span>
            )}

            {onDeleteFile && !isTarget && !child.path.includes("package.json") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFile(child.path);
                }}
                title="Delete file"
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-[#F06A6A] text-[#71807C] transition-opacity cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#0D1214] border-r border-[#202A2C] overflow-hidden text-xs">
      {/* File Tree Header */}
      <div className="px-3 py-2.5 border-b border-[#202A2C] flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#71807C]">
          Workspace Files
        </span>
        {onCreateFile && (
          <button
            onClick={() => setIsCreatingFile(!isCreatingFile)}
            title="New File"
            className="p-1 rounded text-[#71807C] hover:text-[#67D6B2] hover:bg-[#151D1F] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* New File Inline Form */}
      {isCreatingFile && (
        <form
          onSubmit={handleCreateSubmit}
          className="p-2 bg-[#151D1F] border-b border-[#202A2C]"
        >
          <input
            type="text"
            placeholder="e.g. src/utils/helper.js"
            value={newFilePath}
            onChange={(e) => setNewFilePath(e.target.value)}
            autoFocus
            className="w-full px-2 py-1 text-xs bg-[#080C0D] border border-[#202A2C] focus:border-[#67D6B2] rounded text-white outline-none"
          />
          <div className="flex items-center justify-end gap-1.5 mt-1.5">
            <button
              type="button"
              onClick={() => setIsCreatingFile(false)}
              className="text-[10px] text-[#71807C] hover:text-white px-1.5 py-0.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-[10px] bg-[#67D6B2] text-[#080C0D] font-semibold px-2 py-0.5 rounded hover:opacity-90 cursor-pointer"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* Files List */}
      <div className="flex-1 overflow-y-auto py-1 space-y-0.5">
        {renderTree(rootNode)}
      </div>
    </div>
  );
}
