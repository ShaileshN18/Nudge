"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Play, Terminal as TerminalIcon } from "lucide-react";
import FileTree, { FileItem } from "@/components/FileTree";
import CodeEditor from "@/components/CodeEditor";
import { mountProject, writeProjectFile, readProjectFile } from "@/lib/webcontainer";

interface TaskItem {
  _id?: string;
  order: number;
  title: string;
  description: string;
  goal: string;
  targetFiles?: string[];
  evaluationCriteria?: string[];
}

interface ProjectData {
  _id: string;
  slug: string;
  title: string;
  description: string;
  track: string;
  difficulty: string;
  tasks: TaskItem[];
  files: FileItem[];
}

export default function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string>("");
  const [activeContent, setActiveContent] = useState<string>("");
  const [isMounting, setIsMounting] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch project details and mount into WebContainer
  useEffect(() => {
    let isSubscribed = true;

    async function loadProject() {
      try {
        setIsMounting(true);
        setError(null);

        const res = await fetch(`/api/projects/${projectId}`);
        const json = await res.json();

        if (!json.success || !json.data) {
          throw new Error(json.error || "Failed to load project details");
        }

        const projectData: ProjectData = json.data;
        if (!isSubscribed) return;

        setProject(projectData);
        setFiles(projectData.files || []);

        // Mount ALL files (including hidden/non-editable) into WebContainer filesystem
        if (projectData.files && projectData.files.length > 0) {
          await mountProject(projectData.files);

          // Select first visible file as default active file
          const firstVisible = projectData.files.find((f) => f.visible !== false) || projectData.files[0];
          setActiveFilePath(firstVisible.path);
          setActiveContent(firstVisible.content || "");
        }
      } catch (err: any) {
        console.error("Error initializing project workspace:", err);
        if (isSubscribed) {
          setError(err.message || "Failed to initialize workspace");
        }
      } finally {
        if (isSubscribed) {
          setIsMounting(false);
        }
      }
    }

    loadProject();

    return () => {
      isSubscribed = false;
    };
  }, [projectId]);

  // Handle file selection from FileTree
  const handleSelectFile = async (path: string) => {
    setActiveFilePath(path);
    try {
      // Read current content from WebContainer filesystem
      const content = await readProjectFile(path);
      setActiveContent(content);
    } catch {
      // Fallback to initial file state if read fails
      const fallbackFile = files.find((f) => f.path === path);
      setActiveContent(fallbackFile?.content || "");
    }
  };

  // Handle file content changes from CodeEditor
  const handleCodeChange = async (newContent: string) => {
    setActiveContent(newContent);

    // Keep WebContainer filesystem in sync
    if (activeFilePath) {
      try {
        await writeProjectFile(activeFilePath, newContent);
      } catch (err) {
        console.error("Error writing to WebContainer:", err);
      }
    }
  };

  const activeFile = files.find((f) => f.path === activeFilePath);
  const isEditable = activeFile?.editable !== false;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090d16] text-slate-100 p-6">
        <div className="max-w-md w-full glass-card p-6 rounded-xl space-y-4 text-center">
          <h2 className="text-lg font-bold text-rose-400">Workspace Error</h2>
          <p className="text-sm text-slate-400">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#090d16] text-slate-100 overflow-hidden">
      {/* Top Header */}
      <header className="h-14 border-b border-slate-800 bg-[#0f172a]/90 backdrop-blur px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-white truncate">
              {project?.title || "Loading Project..."}
            </h1>
            <span className="text-[11px] text-slate-400 capitalize">
              Track: {project?.track || "..."} • Difficulty: {project?.difficulty || "..."}
            </span>
          </div>
        </div>

        {/* Mounting / Ready Indicator */}
        <div className="flex items-center gap-3">
          {isMounting ? (
            <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Mounting Filesystem...
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              WebContainer Ready
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Task Guidance & File Tree */}
        <div className="w-72 border-r border-slate-800 bg-[#0c1222] flex flex-col flex-shrink-0 overflow-y-auto">
          {/* Active Tasks List */}
          {project?.tasks && project.tasks.length > 0 && (
            <div className="p-3 border-b border-slate-800/80 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Current Task
              </div>
              <div className="glass-card p-3 rounded-lg space-y-1.5">
                <h3 className="text-xs font-bold text-indigo-300">
                  Task {project.tasks[0].order}: {project.tasks[0].title}
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {project.tasks[0].description}
                </p>
                {project.tasks[0].goal && (
                  <div className="text-[10px] text-slate-300 bg-slate-800/80 p-1.5 rounded font-mono mt-1">
                    🎯 {project.tasks[0].goal}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Visible Files Tree */}
          <div className="flex-1 p-2">
            <FileTree
              files={files}
              activePath={activeFilePath}
              onSelectFile={handleSelectFile}
            />
          </div>
        </div>

        {/* Center: Monaco Code Editor */}
        <div className="flex-1 flex flex-col bg-[#1e1e1e] overflow-hidden">
          <CodeEditor
            path={activeFilePath}
            value={activeContent}
            editable={isEditable}
            onChange={handleCodeChange}
          />
        </div>
      </div>
    </div>
  );
}
