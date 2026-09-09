"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileCode,
  FileText,
  FileJson,
  File,
  FolderOpen,
  FolderClosed,
  FilePlus,
  FolderPlus,
  RefreshCw,
} from "lucide-react";
import { listDirectory, writeProjectFile, createDirectory } from "@/lib/webcontainer";

// ─── Types ───────────────────────────────────────────────────────────

export interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: TreeNode[];
}

interface FileTreeProps {
  activePath: string;
  onSelectFile: (path: string) => void;
  /** Increment this value to force a tree refresh from outside */
  refreshKey?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────

const HIDDEN = new Set(["node_modules", ".git", ".next", ".cache", ".turbo"]);

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "json":
      return <FileJson className="h-4 w-4 text-amber-400 shrink-0" />;
    case "js":
    case "jsx":
    case "mjs":
    case "cjs":
      return <FileCode className="h-4 w-4 text-yellow-300 shrink-0" />;
    case "ts":
    case "tsx":
      return <FileCode className="h-4 w-4 text-cyan-400 shrink-0" />;
    case "css":
    case "scss":
    case "less":
      return <FileCode className="h-4 w-4 text-purple-400 shrink-0" />;
    case "html":
      return <FileCode className="h-4 w-4 text-orange-400 shrink-0" />;
    case "md":
    case "mdx":
      return <FileText className="h-4 w-4 text-slate-300 shrink-0" />;
    case "svg":
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "ico":
      return <File className="h-4 w-4 text-pink-400 shrink-0" />;
    default:
      return <FileText className="h-4 w-4 text-slate-400 shrink-0" />;
  }
}

function sortEntries(nodes: TreeNode[]): TreeNode[] {
  return [...nodes].sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

// ─── Recursive builder ──────────────────────────────────────────────

async function buildTree(dirPath: string): Promise<TreeNode[]> {
  try {
    const entries = await listDirectory(dirPath);
    const nodes: TreeNode[] = [];

    for (const entry of entries) {
      if (HIDDEN.has(entry.name)) continue;

      const fullPath = dirPath === "." ? entry.name : `${dirPath}/${entry.name}`;
      const node: TreeNode = {
        name: entry.name,
        path: fullPath,
        isDirectory: entry.isDirectory,
      };

      if (entry.isDirectory) {
        node.children = await buildTree(fullPath);
      }

      nodes.push(node);
    }

    return sortEntries(nodes);
  } catch {
    return [];
  }
}

// ─── TreeNodeRow component ──────────────────────────────────────────

function TreeNodeRow({
  node,
  depth,
  activePath,
  expanded,
  onToggle,
  onSelectFile,
}: {
  node: TreeNode;
  depth: number;
  activePath: string;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  onSelectFile: (path: string) => void;
}) {
  const isOpen = expanded.has(node.path);
  const isActive = activePath === node.path;

  if (node.isDirectory) {
    return (
      <>
        <button
          onClick={() => onToggle(node.path)}
          className="w-full flex items-center gap-1.5 py-[5px] pr-3 text-xs font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors rounded-sm group"
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
        >
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          )}
          {isOpen ? (
            <FolderOpen className="h-4 w-4 text-indigo-400 shrink-0" />
          ) : (
            <FolderClosed className="h-4 w-4 text-indigo-400/70 shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {isOpen &&
          node.children?.map((child) => (
            <TreeNodeRow
              key={child.path}
              node={child}
              depth={depth + 1}
              activePath={activePath}
              expanded={expanded}
              onToggle={onToggle}
              onSelectFile={onSelectFile}
            />
          ))}
      </>
    );
  }

  return (
    <button
      onClick={() => onSelectFile(node.path)}
      className={`w-full flex items-center gap-1.5 py-[5px] pr-3 text-xs font-mono transition-colors rounded-sm ${
        isActive
          ? "bg-indigo-600/20 text-indigo-300 font-semibold"
          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
      }`}
      style={{ paddingLeft: `${depth * 14 + 24}px` }}
    >
      {getFileIcon(node.name)}
      <span className="truncate">{node.name}</span>
    </button>
  );
}

// ─── FileTree root component ────────────────────────────────────────

export default function FileTree({
  activePath,
  onSelectFile,
  refreshKey = 0,
}: FileTreeProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<"file" | "folder" | null>(null);
  const [newName, setNewName] = useState("");

  const loadTree = useCallback(async () => {
    setLoading(true);
    try {
      const nodes = await buildTree(".");
      setTree(nodes);
      // auto-expand top-level directories on first load
      if (expanded.size === 0) {
        const topDirs = nodes.filter((n) => n.isDirectory).map((n) => n.path);
        setExpanded(new Set(topDirs));
      }
    } catch (err) {
      console.error("Failed to read WebContainer FS:", err);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadTree();
  }, [loadTree, refreshKey]);

  const handleToggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed || !creating) return;

    try {
      if (creating === "file") {
        await writeProjectFile(trimmed, "");
      } else {
        await createDirectory(trimmed);
      }
      setCreating(null);
      setNewName("");
      await loadTree();
      if (creating === "file") {
        onSelectFile(trimmed);
      }
    } catch (err) {
      console.error(`Failed to create ${creating}:`, err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with actions */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCreating(creating === "file" ? null : "file")}
            className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
            title="New File"
          >
            <FilePlus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setCreating(creating === "folder" ? null : "folder")}
            className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
            title="New Folder"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={loadTree}
            className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Create input */}
      {creating && (
        <div className="px-3 py-2 border-b border-slate-800/60">
          <div className="flex items-center gap-1.5">
            {creating === "folder" ? (
              <FolderPlus className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            ) : (
              <FilePlus className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            )}
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  setCreating(null);
                  setNewName("");
                }
              }}
              placeholder={creating === "folder" ? "folder/path" : "path/to/file.ts"}
              className="flex-1 bg-slate-900/80 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono placeholder:text-slate-600"
            />
          </div>
          <p className="text-[10px] text-slate-600 mt-1 pl-5">
            Press Enter to create, Escape to cancel
          </p>
        </div>
      )}

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {loading && tree.length === 0 ? (
          <div className="px-3 py-4 text-xs text-slate-500 flex items-center gap-2">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Reading filesystem…
          </div>
        ) : tree.length === 0 ? (
          <div className="px-3 py-4 text-xs text-slate-500">
            No files found. Mount a project first.
          </div>
        ) : (
          tree.map((node) => (
            <TreeNodeRow
              key={node.path}
              node={node}
              depth={0}
              activePath={activePath}
              expanded={expanded}
              onToggle={handleToggle}
              onSelectFile={onSelectFile}
            />
          ))
        )}
      </div>
    </div>
  );
}
