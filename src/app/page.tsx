"use client";

import { useEffect, useState } from "react";
import { 
  Code2, 
  Terminal, 
  CheckCircle2, 
  Database, 
  Layers, 
  ArrowRight, 
  Sparkles, 
  Play, 
  Cpu, 
  FolderTree,
  FileCode,
  ShieldCheck
} from "lucide-react";

interface Project {
  _id: string;
  slug: string;
  title: string;
  description: string;
  track: "frontend" | "backend" | "fullstack";
  difficulty: "beginner" | "intermediate" | "advanced";
  tasksCount: number;
}

const mockProjects: Project[] = [
  {
    _id: "1",
    slug: "build-express-mongodb-auth",
    title: "Build JWT Auth with Express & Mongoose",
    description: "Implement user authentication, password hashing with bcrypt, and JWT middleware token validation.",
    track: "backend",
    difficulty: "beginner",
    tasksCount: 4,
  },
  {
    _id: "2",
    slug: "nextjs-task-dashboard",
    title: "Realtime Next.js Task Attempt Evaluator",
    description: "Build an automated task execution feedback loop with App Router API routes and MongoDB Atlas.",
    track: "fullstack",
    difficulty: "intermediate",
    tasksCount: 6,
  },
  {
    _id: "3",
    slug: "react-code-editor-component",
    title: "Interactive Code Workspace UI",
    description: "Build a multi-file tabs component with live output execution and evaluation criteria badges.",
    track: "frontend",
    difficulty: "intermediate",
    tasksCount: 3,
  },
];

export default function Home() {
  const [dbStatus, setDbStatus] = useState<{
    status: string;
    message: string;
    collections?: string[];
  } | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        setDbStatus(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Health check error:", err);
        setDbStatus({ status: "error", message: "Failed to connect to API" });
        setLoading(false);
      });
  }, []);

  const filteredProjects = mockProjects.filter((p) =>
    selectedTrack === "all" ? true : p.track === selectedTrack
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      {/* Background Decorative Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
      </div>

      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">Nudge</span>
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Next.js Platform
              </span>
            </div>
          </div>

          {/* Database Connection Pill */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full glass-card text-xs">
              <Database className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-slate-400">Atlas DB Status:</span>
              {loading ? (
                <span className="text-amber-400 font-medium">Checking...</span>
              ) : dbStatus?.status === "ok" ? (
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Connected ({dbStatus.collections?.length || 4} Collections)
                </span>
              ) : (
                <span className="text-rose-400 font-medium">Atlas Error</span>
              )}
            </div>

            <button className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-md shadow-indigo-600/25">
              Start Learning
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 space-y-16">
        {/* Hero Banner */}
        <section className="text-center space-y-6 max-w-3xl mx-auto pt-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border border-indigo-500/30 text-indigo-300 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            Fullstack Next.js Architecture Online
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white">
            Master Fullstack Development with{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Guided Interactive Tasks
            </span>
          </h1>

          <p className="text-lg text-slate-400 leading-relaxed">
            Nudge gives you step-by-step programming tasks, automated evaluation criteria, and structured project code bases to level up your engineering skills.
          </p>
        </section>

        {/* Mongoose Models Overview Cards */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-white">Configured Database Models</h2>
            </div>
            <span className="text-xs text-slate-400">Next.js + Mongoose ORM</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "User Model",
                schema: "src/lib/models/User.ts",
                desc: "User profiles, emails, and password hashes.",
                icon: ShieldCheck,
                color: "text-blue-400",
              },
              {
                title: "Project Model",
                schema: "src/lib/models/Project.ts",
                desc: "Guided tracks, embedded tasks & file templates.",
                icon: FolderTree,
                color: "text-indigo-400",
              },
              {
                title: "UserProject Model",
                schema: "src/lib/models/UserProject.ts",
                desc: "User code state and task completion progress.",
                icon: FileCode,
                color: "text-cyan-400",
              },
              {
                title: "TaskAttempt Model",
                schema: "src/lib/models/TaskAttempt.ts",
                desc: "Task pass/fail statuses and feedback logs.",
                icon: Terminal,
                color: "text-emerald-400",
              },
            ].map((model, idx) => (
              <div key={idx} className="glass-card p-5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <model.icon className={`h-6 w-6 ${model.color}`} />
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    Schema
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base">{model.title}</h3>
                  <p className="text-xs font-mono text-slate-400 mt-1 truncate">{model.schema}</p>
                </div>
                <p className="text-xs text-slate-400 leading-normal">{model.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Project Catalog & Tracks */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Project Catalog</h2>
              <p className="text-sm text-slate-400">Select a learning track to begin building.</p>
            </div>

            {/* Track Filter Buttons */}
            <div className="flex items-center gap-2 p-1 glass-panel rounded-lg text-xs font-medium">
              {["all", "frontend", "backend", "fullstack"].map((track) => (
                <button
                  key={track}
                  onClick={() => setSelectedTrack(track)}
                  className={`px-3 py-1.5 rounded-md capitalize transition-all ${
                    selectedTrack === track
                      ? "bg-indigo-600 text-white font-semibold shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {track}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project._id}
                className="glass-card p-6 rounded-2xl flex flex-col justify-between space-y-6 group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-semibold tracking-wider px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {project.track}
                    </span>
                    <span className="text-xs text-slate-400 capitalize">
                      {project.difficulty}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                      {project.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    {project.tasksCount} Guided Tasks
                  </span>
                  <button className="flex items-center gap-1 text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform">
                    Start Project <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="glass-panel border-t border-slate-800/80 py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 Nudge Platform. Migrated to Next.js App Router & Mongoose.</p>
      </footer>
    </div>
  );
}
