"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Code2,
  Terminal,
  CheckCircle2,
  Database,
  Layers,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  FolderTree,
  FileCode,
  AlertCircle,
  RefreshCw,
  Server,
  Cloud,
  Check,
  Play,
  X,
  User as UserIcon,
  LogOut,
} from "lucide-react";

interface ProjectItem {
  _id: string;
  slug: string;
  title: string;
  description: string;
  track: "frontend" | "backend" | "fullstack";
  difficulty: "beginner" | "intermediate" | "advanced";
  tasksCount?: number;
  tasks?: any[];
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

interface DbStatusResponse {
  status: string;
  message?: string;
  dbStatus?: string;
  dbType?: string;
  host?: string;
  database?: string;
  collections?: string[];
  projectsCount?: number;
  error?: string;
  suggestion?: string;
}

const fallbackProjects: ProjectItem[] = [
  {
    _id: "devblog",
    slug: "devblog",
    title: "DevBlog",
    description:
      "Full-stack React and Express blog application with dynamic routes, markdown rendering, and MongoDB.",
    track: "fullstack",
    difficulty: "intermediate",
    tasksCount: 18,
  },
  {
    _id: "build-express-mongodb-auth",
    slug: "build-express-mongodb-auth",
    title: "Build JWT Auth with Express & Mongoose",
    description:
      "Implement user authentication, password hashing with bcrypt, and JWT middleware token validation.",
    track: "backend",
    difficulty: "beginner",
    tasksCount: 3,
  },
  {
    _id: "2",
    slug: "nextjs-task-dashboard",
    title: "Realtime Next.js Task Attempt Evaluator",
    description:
      "Build an automated task execution feedback loop with App Router API routes and MongoDB Atlas.",
    track: "fullstack",
    difficulty: "intermediate",
    tasksCount: 1,
  },
  {
    _id: "3",
    slug: "react-code-editor-component",
    title: "Interactive Code Workspace UI",
    description:
      "Build a multi-file tabs component with live output execution and evaluation criteria badges.",
    track: "frontend",
    difficulty: "intermediate",
    tasksCount: 1,
  },
  {
    _id: "react-task-board",
    slug: "react-task-board",
    title: "Interactive React Task Kanban Board",
    description: "Build an interactive Kanban board with drag-and-drop task columns, state management, and real-time status updates.",
    track: "frontend",
    difficulty: "intermediate",
    tasksCount: 1,
  },
];

export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [dbStatus, setDbStatus] = useState<DbStatusResponse | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>(fallbackProjects);
  const [selectedTrack, setSelectedTrack] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDbModal, setShowDbModal] = useState(false);

  const fetchHealthAndProjects = async () => {
    setRefreshing(true);
    try {
      const healthRes = await fetch("/api/health");
      const healthData = await healthRes.json();
      setDbStatus(healthData);

      if (healthData.status === "ok") {
        const projRes = await fetch("/api/projects");
        const projData = await projRes.json();
        if (projData.success && projData.data && projData.data.length > 0) {
          const formatted = projData.data.map((p: any) => ({
            ...p,
            tasksCount: p.tasks ? p.tasks.length : p.tasksCount || 3,
          }));
          setProjects(formatted);
        }
      }
    } catch (err: any) {
      console.error("Health check error:", err);
      setDbStatus({
        status: "error",
        message: "Failed to connect to API",
        error: err?.message || String(err),
        suggestion: "Ensure Next.js server is running and check .env connection string.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  useEffect(() => {
    fetchHealthAndProjects();

    // Check user auth session
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch((err) => console.error("Auth check error:", err));
  }, []);

  const filteredProjects = projects.filter((p) =>
    selectedTrack === "all" ? true : p.track === selectedTrack
  );

  const isConnected = dbStatus?.status === "ok";
  const firstProjectSlug = filteredProjects[0]?.slug || "build-express-mongodb-auth";

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-indigo-500/30">
      {/* Background Decorative Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#090d16]/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-4">
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

          {/* Database Connection Status Pill & Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDbModal(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/60 text-xs transition-all cursor-pointer shadow-sm group"
              title="Click to view database details"
            >
              <Database className="h-3.5 w-3.5 text-indigo-400 group-hover:text-indigo-300" />
              <span className="text-slate-400">Atlas DB Status:</span>

              {loading ? (
                <span className="text-amber-400 font-medium flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Checking...
                </span>
              ) : isConnected ? (
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Connected ({dbStatus?.dbType?.includes("Atlas") ? "Atlas" : "Local"})
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  Atlas Error
                </span>
              )}
            </button>

            <button
              onClick={() => fetchHealthAndProjects()}
              disabled={refreshing}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/50"
              title="Refresh DB status"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
            </button>

            {/* Auth Buttons */}
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/50 text-xs text-slate-200">
                  <UserIcon className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="font-medium">{currentUser.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 text-xs transition-colors"
                  title="Log out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-sm shadow-indigo-600/30"
                >
                  Sign Up
                </Link>
              </div>
            )}

            <Link
              href={`/project/${firstProjectSlug}`}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-md shadow-indigo-600/25"
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              <span>Start Learning</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-14">
        {/* DB Connection Status Banner (if error or information) */}
        {!loading && !isConnected && (
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/50 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-rose-300 text-sm">MongoDB Connection Attention Required</h4>
                <p className="text-xs text-rose-300/80 mt-1">
                  {dbStatus?.suggestion || dbStatus?.error || "Unable to reach MongoDB. Check your credentials in .env"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDbModal(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 text-xs font-semibold border border-rose-500/40 shrink-0"
            >
              View Connection Config
            </button>
          </div>
        )}

        {/* Hero Banner */}
        <section className="text-center space-y-6 max-w-3xl mx-auto pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs font-medium backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            Fullstack Next.js + MongoDB Architecture Online
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white">
            Master Fullstack Development with{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Guided Interactive Tasks
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
            Nudge gives you step-by-step programming tasks, automated evaluation criteria, and structured project code bases to level up your engineering skills.
          </p>

          {/* Hero Call to Action Buttons */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href={`/project/${firstProjectSlug}`}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all group"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>Start Learning Now</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#catalog"
              className="px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white font-semibold text-sm border border-slate-700/60 transition-all"
            >
              Explore Catalog
            </a>
          </div>
        </section>

        {/* Mongoose Models Overview Cards */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-white">Configured Database Models</h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>{dbStatus?.collections?.length || 4} Mongoose Collections Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "User Model",
                schema: "src/models/User.ts",
                desc: "User profiles, emails, and password hashes.",
                icon: ShieldCheck,
                color: "text-blue-400",
                badge: "users",
              },
              {
                title: "Project Model",
                schema: "src/models/Project.ts",
                desc: "Guided tracks, embedded tasks & file templates.",
                icon: FolderTree,
                color: "text-indigo-400",
                badge: "projects",
              },
              {
                title: "UserProject Model",
                schema: "src/models/UserProject.ts",
                desc: "User code state and task completion progress.",
                icon: FileCode,
                color: "text-cyan-400",
                badge: "userprojects",
              },
              {
                title: "TaskAttempt Model",
                schema: "src/models/TaskAttempt.ts",
                desc: "Task pass/fail statuses and feedback logs.",
                icon: Terminal,
                color: "text-emerald-400",
                badge: "taskattempts",
              },
            ].map((model, idx) => (
              <div
                key={idx}
                className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 p-5 rounded-xl space-y-3 transition-all backdrop-blur-sm shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <model.icon className={`h-6 w-6 ${model.color}`} />
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700/70">
                    {model.badge}
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
        <section id="catalog" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Project Catalog</h2>
              <p className="text-sm text-slate-400">Select a learning track to open the interactive IDE.</p>
            </div>

            {/* Track Filter Buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-lg text-xs font-medium">
              {["all", "frontend", "backend", "fullstack"].map((track) => (
                <button
                  key={track}
                  onClick={() => setSelectedTrack(track)}
                  className={`px-3 py-1.5 rounded-md capitalize transition-all ${
                    selectedTrack === track
                      ? "bg-indigo-600 text-white font-semibold shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {track}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project._id}
                className="bg-slate-900/70 border border-slate-800 hover:border-slate-700/90 p-6 rounded-2xl flex flex-col justify-between space-y-6 group transition-all backdrop-blur-sm hover:shadow-lg hover:shadow-indigo-500/5"
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
                    {project.tasks?.length || project.tasksCount || 0} Guided Tasks
                  </span>
                  <Link
                    href={`/projects/${project._id || project.slug}`}
                    className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold group-hover:translate-x-1 transition-all"
                  >
                    <span>Open Project</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Database Details & Configuration Modal */}
      {showDbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Database className="h-5 w-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Database Status & Configuration</h3>
              </div>
              <button
                onClick={() => setShowDbModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Status Indicators */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Status:</span>
                  {isConnected ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Connected & Initialized
                    </span>
                  ) : (
                    <span className="text-rose-400 font-semibold flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> Disconnected
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Database Type:</span>
                  <span className="text-white font-medium flex items-center gap-1">
                    {dbStatus?.dbType?.includes("Atlas") ? (
                      <>
                        <Cloud className="h-3.5 w-3.5 text-cyan-400" /> MongoDB Atlas Cloud
                      </>
                    ) : (
                      <>
                        <Server className="h-3.5 w-3.5 text-indigo-400" /> Local MongoDB (127.0.0.1:27017)
                      </>
                    )}
                  </span>
                </div>

                {dbStatus?.host && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Host:</span>
                    <span className="text-slate-200 font-mono text-[11px]">{dbStatus.host}</span>
                  </div>
                )}

                {dbStatus?.database && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Database:</span>
                    <span className="text-indigo-300 font-mono text-[11px]">{dbStatus.database}</span>
                  </div>
                )}
              </div>

              {/* How to configure .env */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Configuring MongoDB in .env
                </h4>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 space-y-2">
                  <p className="text-slate-500 text-[11px]"># Option 1: Local MongoDB (Default active)</p>
                  <p className="text-emerald-400">MONGODB_URI=mongodb://127.0.0.1:27017/nudge</p>
                  <p className="text-slate-500 text-[11px] mt-2"># Option 2: MongoDB Atlas Cloud</p>
                  <p className="text-cyan-400 text-[11px] break-all">
                    MONGODB_URI=mongodb+srv://&lt;username&gt;:&lt;password&gt;@cluster0.abcde.mongodb.net/nudge?retryWrites=true&amp;w=majority
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  fetchHealthAndProjects();
                  setShowDbModal(false);
                }}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all"
              >
                Close & Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#090d16]/90 border-t border-slate-800/80 py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 Nudge Platform. Built with Next.js App Router & Mongoose.</p>
      </footer>
    </div>
  );
}
