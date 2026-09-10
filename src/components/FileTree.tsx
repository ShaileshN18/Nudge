"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  MouseEvent as ReactMouseEvent,
} from "react";
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
  Trash2,
  Pencil,
  AlertTriangle,
  FoldVertical,
} from "lucide-react";
import {
  listDirectory,
  writeProjectFile,
  createDirectory,
  deleteEntry,
  renameEntry,
} from "@/lib/webcontainer";

// ─── Types ───────────────────────────────────────────────────────────

export interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: TreeNode[];
}

// Alias for backwards compatibility
export type treenode = TreeNode;

export interface FileTreeProps {
  activePath: string;
  onSelectFile: (path: string) => void;
  onDeleteFile?: (path: string, isDirectory: boolean) => void;
  onRenameFile?: (oldPath: string, newPath: string) => void;
  /** Increment this value to force a tree refresh from outside */
  refreshKey?: number;
  files?: any[];
}

interface ContextMenuState {
  x: number;
  y: number;
  node: TreeNode | null;
}

interface CreatePromptState {
  parentPath: string; // "." for root, or "src", "src/models", etc.
  type: "file" | "folder";
}

interface RenameState {
  path: string;
  currentName: string;
  isDirectory: boolean;
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

// ─── Inline Creation Input Component ────────────────────────────────

function InlineCreationInput({
  depth,
  type,
  onSubmit,
  onCancel,
}: {
  depth: number;
  type: "file" | "folder";
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      className="flex items-center gap-1.5 py-1 pr-2 bg-indigo-950/40 border-l-2 border-indigo-500 rounded-r text-xs"
      style={{ paddingLeft: `${depth * 14 + 10}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      {type === "folder" ? (
        <FolderPlus className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
      ) : (
        <FilePlus className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
      )}
      <input
        ref={inputRef}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const trimmed = val.trim();
            if (trimmed) onSubmit(trimmed);
            else onCancel();
          } else if (e.key === "Escape") {
            onCancel();
          }
        }}
        onBlur={() => {
          const trimmed = val.trim();
          if (trimmed) onSubmit(trimmed);
          else onCancel();
        }}
        placeholder={type === "folder" ? "folder-name" : "filename.js"}
        className="flex-1 min-w-0 bg-slate-900 border border-indigo-500/70 rounded px-1.5 py-0.5 text-xs text-white outline-none font-mono placeholder:text-slate-500"
      />
    </div>
  );
}

// ─── Inline Rename Input Component ──────────────────────────────────

function InlineRenameInput({
  depth,
  currentName,
  isDirectory,
  onSubmit,
  onCancel,
}: {
  depth: number;
  currentName: string;
  isDirectory: boolean;
  onSubmit: (newName: string) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      const lastDot = currentName.lastIndexOf(".");
      if (!isDirectory && lastDot > 0) {
        inputRef.current.setSelectionRange(0, lastDot);
      } else {
        inputRef.current.select();
      }
    }
  }, [currentName, isDirectory]);

  return (
    <div
      className="flex items-center gap-1.5 py-1 pr-2 bg-amber-950/30 border-l-2 border-amber-500 rounded-r text-xs"
      style={{ paddingLeft: `${depth * 14 + 10}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      {isDirectory ? (
        <FolderOpen className="h-4 w-4 text-indigo-400 shrink-0" />
      ) : (
        getFileIcon(currentName)
      )}
      <input
        ref={inputRef}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const trimmed = val.trim();
            if (trimmed && trimmed !== currentName) onSubmit(trimmed);
            else onCancel();
          } else if (e.key === "Escape") {
            onCancel();
          }
        }}
        onBlur={() => {
          const trimmed = val.trim();
          if (trimmed && trimmed !== currentName) onSubmit(trimmed);
          else onCancel();
        }}
        className="flex-1 min-w-0 bg-slate-900 border border-amber-500/80 rounded px-1.5 py-0.5 text-xs text-white outline-none font-mono"
      />
    </div>
  );
}

// ─── TreeNodeRow component ──────────────────────────────────────────

interface TreeNodeRowProps {
  node: TreeNode;
  depth: number;
  activePath: string;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  onSelectFile: (path: string) => void;
  onContextMenu: (e: ReactMouseEvent, node: TreeNode) => void;
  onStartCreate: (parentPath: string, type: "file" | "folder") => void;
  onStartRename: (node: TreeNode) => void;
  onStartDelete: (node: TreeNode) => void;
  createPrompt: CreatePromptState | null;
  renamePrompt: RenameState | null;
  onFinishCreate: (name: string) => void;
  onCancelCreate: () => void;
  onFinishRename: (newName: string) => void;
  onCancelRename: () => void;
}

function TreeNodeRow({
  node,
  depth,
  activePath,
  expanded,
  onToggle,
  onSelectFile,
  onContextMenu,
  onStartCreate,
  onStartRename,
  onStartDelete,
  createPrompt,
  renamePrompt,
  onFinishCreate,
  onCancelCreate,
  onFinishRename,
  onCancelRename,
}: TreeNodeRowProps) {
  const isOpen = expanded.has(node.path);
  const isActive = activePath === node.path;
  const isRenaming = renamePrompt?.path === node.path;

  if (isRenaming) {
    return (
      <InlineRenameInput
        depth={depth}
        currentName={node.name}
        isDirectory={node.isDirectory}
        onSubmit={onFinishRename}
        onCancel={onCancelRename}
      />
    );
  }

  if (node.isDirectory) {
    const isCreatingInside = createPrompt?.parentPath === node.path;

    return (
      <div className="select-none">
        <div
          onContextMenu={(e) => onContextMenu(e, node)}
          onClick={() => onToggle(node.path)}
          className="w-full flex items-center justify-between py-[4px] pr-2 text-xs font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors rounded-sm cursor-pointer group"
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
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
            <span className="truncate text-slate-300 group-hover:text-white">
              {node.name}
            </span>
          </div>

          {/* Action buttons on hover */}
          <div
            className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onStartCreate(node.path, "file")}
              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-indigo-300 transition-colors"
              title={`New File inside ${node.name}`}
            >
              <FilePlus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onStartCreate(node.path, "folder")}
              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-indigo-300 transition-colors"
              title={`New Folder inside ${node.name}`}
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onStartRename(node)}
              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-amber-300 transition-colors"
              title="Rename folder"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              onClick={() => onStartDelete(node)}
              className="p-1 rounded hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 transition-colors"
              title="Delete folder"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Children & Inline creation input inside this folder */}
        {isOpen && (
          <div>
            {isCreatingInside && (
              <InlineCreationInput
                depth={depth + 1}
                type={createPrompt.type}
                onSubmit={onFinishCreate}
                onCancel={onCancelCreate}
              />
            )}
            {node.children?.map((child) => (
              <TreeNodeRow
                key={child.path}
                node={child}
                depth={depth + 1}
                activePath={activePath}
                expanded={expanded}
                onToggle={onToggle}
                onSelectFile={onSelectFile}
                onContextMenu={onContextMenu}
                onStartCreate={onStartCreate}
                onStartRename={onStartRename}
                onStartDelete={onStartDelete}
                createPrompt={createPrompt}
                renamePrompt={renamePrompt}
                onFinishCreate={onFinishCreate}
                onCancelCreate={onCancelCreate}
                onFinishRename={onFinishRename}
                onCancelRename={onCancelRename}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // File row
  return (
    <div
      onContextMenu={(e) => onContextMenu(e, node)}
      onClick={() => onSelectFile(node.path)}
      className={`w-full flex items-center justify-between py-[4px] pr-2 text-xs font-mono transition-colors rounded-sm cursor-pointer group ${
        isActive
          ? "bg-indigo-600/20 text-indigo-200 font-medium"
          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
      }`}
      style={{ paddingLeft: `${depth * 14 + 22}px` }}
    >
      <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
        {getFileIcon(node.name)}
        <span className="truncate">{node.name}</span>
      </div>

      {/* Action buttons on hover */}
      <div
        className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onStartRename(node)}
          className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-amber-300 transition-colors"
          title="Rename file"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onClick={() => onStartDelete(node)}
          className="p-1 rounded hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 transition-colors"
          title="Delete file"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ─── FileTree root component ────────────────────────────────────────

export default function FileTree({
  activePath,
  onSelectFile,
  onDeleteFile,
  onRenameFile,
  refreshKey = 0,
}: FileTreeProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Creation & renaming state
  const [createPrompt, setCreatePrompt] = useState<CreatePromptState | null>(null);
  const [renamePrompt, setRenamePrompt] = useState<RenameState | null>(null);

  // Deletion confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<TreeNode | null>(null);

  // Context menu
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const loadTree = useCallback(async () => {
    setLoading(true);
    try {
      const nodes = await buildTree(".");
      setTree(nodes);
      // Auto-expand top-level directories on first load
      setExpanded((prev) => {
        if (prev.size === 0) {
          const topDirs = nodes.filter((n) => n.isDirectory).map((n) => n.path);
          return new Set(topDirs);
        }
        return prev;
      });
    } catch (err) {
      console.error("Failed to read WebContainer FS:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTree();
  }, [loadTree, refreshKey]);

  // Close context menu on outside click or escape
  useEffect(() => {
    const handleOutsideClick = () => {
      if (contextMenu) {
        setContextMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContextMenu(null);
        setCreatePrompt(null);
        setRenamePrompt(null);
        setDeleteTarget(null);
      }
    };
    window.addEventListener("click", handleOutsideClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("click", handleOutsideClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [contextMenu]);

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

  const handleCollapseAll = () => {
    setExpanded(new Set());
  };

  // ── Create File/Folder ──────────────────────────────────────────────

  const handleStartCreate = (parentPath: string, type: "file" | "folder") => {
    setContextMenu(null);
    setCreatePrompt({ parentPath, type });
    if (parentPath !== ".") {
      setExpanded((prev) => new Set(prev).add(parentPath));
    }
  };

  const handleFinishCreate = async (name: string) => {
    if (!createPrompt) return;
    const { parentPath, type } = createPrompt;
    const fullPath = parentPath === "." ? name : `${parentPath}/${name}`;

    try {
      if (type === "file") {
        await writeProjectFile(fullPath, "");
        setCreatePrompt(null);
        await loadTree();
        onSelectFile(fullPath);
      } else {
        await createDirectory(fullPath);
        setCreatePrompt(null);
        await loadTree();
        setExpanded((prev) => new Set(prev).add(fullPath));
      }
    } catch (err) {
      console.error(`Failed to create ${type} at ${fullPath}:`, err);
      setCreatePrompt(null);
    }
  };

  // ── Rename File/Folder ──────────────────────────────────────────────

  const handleStartRename = (node: TreeNode) => {
    setContextMenu(null);
    setRenamePrompt({
      path: node.path,
      currentName: node.name,
      isDirectory: node.isDirectory,
    });
  };

  const handleFinishRename = async (newName: string) => {
    if (!renamePrompt) return;
    const oldPath = renamePrompt.path;
    const lastSlash = oldPath.lastIndexOf("/");
    const newPath =
      lastSlash !== -1
        ? `${oldPath.slice(0, lastSlash)}/${newName}`
        : newName;

    try {
      await renameEntry(oldPath, newPath);
      setRenamePrompt(null);
      await loadTree();
      if (onRenameFile) {
        onRenameFile(oldPath, newPath);
      } else {
        // Automatically switch active selection to the renamed file
        onSelectFile(newPath);
      }
    } catch (err) {
      console.error(`Failed to rename ${oldPath} to ${newPath}:`, err);
      setRenamePrompt(null);
    }
  };

  // ── Delete File/Folder ──────────────────────────────────────────────

  const handleStartDelete = (node: TreeNode) => {
    setContextMenu(null);
    setDeleteTarget(node);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);

    try {
      await deleteEntry(target.path);
      await loadTree();
      if (onDeleteFile) {
        onDeleteFile(target.path, target.isDirectory);
      } else if (activePath === target.path) {
        onSelectFile("");
      }
    } catch (err) {
      console.error(`Failed to delete ${target.path}:`, err);
    }
  };

  // ── Context Menu ────────────────────────────────────────────────────

  const handleContextMenu = (e: ReactMouseEvent, node: TreeNode | null) => {
    e.preventDefault();
    e.stopPropagation();

    const x = Math.min(e.clientX, window.innerWidth - 180);
    const y = Math.min(e.clientY, window.innerHeight - 200);

    setContextMenu({ x, y, node });
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full select-none bg-[#111625] relative text-slate-300"
      onContextMenu={(e) => handleContextMenu(e, null)}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 bg-[#0d121f]">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Explorer
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => handleStartCreate(".", "file")}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-indigo-300 transition-colors"
            title="New File at Root"
          >
            <FilePlus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleStartCreate(".", "folder")}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-indigo-300 transition-colors"
            title="New Folder at Root"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleCollapseAll}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Collapse All"
          >
            <FoldVertical className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={loadTree}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Root level inline creation input */}
      {createPrompt && createPrompt.parentPath === "." && (
        <div className="px-2 py-1.5 border-b border-slate-800 bg-[#0d121f]">
          <InlineCreationInput
            depth={0}
            type={createPrompt.type}
            onSubmit={handleFinishCreate}
            onCancel={() => setCreatePrompt(null)}
          />
        </div>
      )}

      {/* File Tree View */}
      <div className="flex-1 overflow-y-auto py-1.5 font-sans">
        {loading && tree.length === 0 ? (
          <div className="px-4 py-6 text-xs text-slate-400 flex items-center gap-2">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
            <span>Reading filesystem…</span>
          </div>
        ) : tree.length === 0 ? (
          <div className="px-4 py-6 text-xs text-slate-500 text-center space-y-2">
            <p>Workspace is empty.</p>
            <button
              onClick={() => handleStartCreate(".", "file")}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
            >
              + Create your first file
            </button>
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
              onContextMenu={handleContextMenu}
              onStartCreate={handleStartCreate}
              onStartRename={handleStartRename}
              onStartDelete={handleStartDelete}
              createPrompt={createPrompt}
              renamePrompt={renamePrompt}
              onFinishCreate={handleFinishCreate}
              onCancelCreate={() => setCreatePrompt(null)}
              onFinishRename={handleFinishRename}
              onCancelRename={() => setRenamePrompt(null)}
            />
          ))
        )}
      </div>

      {/* Right-click Floating Context Menu */}
      {contextMenu && (
        <div
          style={{
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
            position: "fixed",
          }}
          className="z-50 w-44 rounded-lg bg-[#141a29] border border-slate-700/80 shadow-2xl py-1 text-xs text-slate-200 backdrop-blur-md"
          onClick={(e) => e.stopPropagation()}
        >
          {(!contextMenu.node || contextMenu.node.isDirectory) && (
            <>
              <button
                onClick={() =>
                  handleStartCreate(
                    contextMenu.node ? contextMenu.node.path : ".",
                    "file"
                  )
                }
                className="w-full text-left px-3 py-1.5 hover:bg-indigo-600/20 hover:text-indigo-200 flex items-center gap-2 transition-colors"
              >
                <FilePlus className="h-3.5 w-3.5 text-indigo-400" />
                <span>New File</span>
              </button>
              <button
                onClick={() =>
                  handleStartCreate(
                    contextMenu.node ? contextMenu.node.path : ".",
                    "folder"
                  )
                }
                className="w-full text-left px-3 py-1.5 hover:bg-indigo-600/20 hover:text-indigo-200 flex items-center gap-2 transition-colors"
              >
                <FolderPlus className="h-3.5 w-3.5 text-indigo-400" />
                <span>New Folder</span>
              </button>
              {contextMenu.node && (
                <div className="my-1 border-t border-slate-800" />
              )}
            </>
          )}

          {contextMenu.node && (
            <>
              <button
                onClick={() => handleStartRename(contextMenu.node!)}
                className="w-full text-left px-3 py-1.5 hover:bg-amber-600/20 hover:text-amber-200 flex items-center gap-2 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5 text-amber-400" />
                <span>Rename</span>
              </button>
              <div className="my-1 border-t border-slate-800" />
              <button
                onClick={() => handleStartDelete(contextMenu.node!)}
                className="w-full text-left px-3 py-1.5 hover:bg-rose-950/60 text-rose-400 hover:text-rose-200 flex items-center gap-2 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="w-full max-w-sm bg-[#141a29] border border-slate-700/80 rounded-xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">
                  Delete {deleteTarget.isDirectory ? "Folder" : "File"}?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Are you sure you want to delete{" "}
                  <span className="font-mono text-indigo-300 font-medium">
                    {deleteTarget.path}
                  </span>
                  {deleteTarget.isDirectory &&
                    " and all contents inside it"}
                  ? This cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm shadow-rose-600/30 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
