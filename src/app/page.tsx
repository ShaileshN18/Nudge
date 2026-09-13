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
  Cpu,
  Lock,
  KeyRound,
  FileText,
  Activity,
} from "lucide-react";
import { authSeedProject, type SeedProject } from "@/lib/seedProject";

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

export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [dbStatus, setDbStatus] = useState<DbStatusResponse | null>(null);
  const [project, setProject] = useState<SeedProject>(authSeedProject);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDbModal, setShowDbModal] = useState(false);

  const fetchHealthAndProjects = async () => {
    setRefreshing(true);
    try {
      const healthRes = await fetch("/api/health");
      const healthData = await healthRes.json();
      setDbStatus(healthData);

      const projRes = await fetch("/api/projects");
      const projData = await projRes.json();
      if (projData.success && projData.data && projData.data.length > 0) {
        setProject(projData.data[0]);
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

  const isConnected = dbStatus?.status === "ok";
  const workspaceUrl = currentUser
    ? "/project/build-auth"
    : "/login?redirect=/project/build-auth";

  return (
    <div className="min-h-screen flex flex-col bg-[#07090f] text-slate-100 selection:bg-indigo-500/30">
      {/* Background Decorative Mesh Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[550px] h-[550px] bg-indigo-600/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[550px] h-[550px] bg-blue-600/15 rounded-full blur-[120px]" />
        <div className="absolute -bottom-20 left-1/3 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#07090f]/80 backdrop-blur-xl border-b border-slate-800/80 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white">Nudge</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold">
                  v2.0 Platform
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">In-Browser Code Execution & Guided Engineering</p>
            </div>
          </div>

          {/* Database Connection Status Pill & Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDbModal(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0e1322] hover:bg-[#131929] border border-slate-800 text-xs transition-all cursor-pointer shadow-sm group"
              title="Click to view database details"
            >
              <Database className="h-3.5 w-3.5 text-indigo-400 group-hover:text-indigo-300" />
              <span className="text-slate-400 hidden sm:inline">DB Status:</span>

              {loading ? (
                <span className="text-amber-400 font-medium flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Checking...
                </span>
              ) : isConnected ? (
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Connected ({dbStatus?.dbType?.includes("Atlas") ? "Atlas Cloud" : "Local"})
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  Disconnected
                </span>
              )}
            </button>

            <button
              onClick={() => fetchHealthAndProjects()}
              disabled={refreshing}
              className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all border border-slate-800"
              title="Refresh DB status"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
            </button>

            {/* Auth Buttons */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-200">
                  <UserIcon className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="font-medium">{currentUser.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 text-xs transition-colors"
                  title="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}

            <Link
              href={workspaceUrl}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/25"
            >
              {currentUser ? (
                <Play className="h-3.5 w-3.5 fill-white" />
              ) : (
                <Lock className="h-3.5 w-3.5 text-amber-300" />
              )}
              <span>{currentUser ? "Launch Workspace" : "Log In to Launch"}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 space-y-16">
        {/* DB Error Banner if connection fails */}
        {!loading && !isConnected && (
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-rose-300 text-sm">MongoDB Connection Notice</h4>
                <p className="text-xs text-rose-300/80 mt-0.5">
                  {dbStatus?.suggestion || dbStatus?.error || "Unable to reach MongoDB. In-memory seed project is actively serving the workspace."}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDbModal(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 text-xs font-semibold border border-rose-500/40 shrink-0"
            >
              View Connection Details
            </button>
          </div>
        )}

        {/* Hero Section */}
        <section className="text-center space-y-6 max-w-3xl mx-auto pt-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs font-semibold backdrop-blur-md shadow-inner">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Interactive Node.js WebContainer Runtime Online</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-white">
            Build Production Auth.{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Run It in Real Time.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Zero setup required. Write code in an authentic VS Code Monaco editor, execute real Node.js test suites in your browser, and build a full production authentication service step-by-step.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <Link
              href={workspaceUrl}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              {currentUser ? (
                <Play className="h-4 w-4 fill-white" />
              ) : (
                <Lock className="h-4 w-4 text-amber-300" />
              )}
              <span>{currentUser ? "Launch Seed Project" : "Log In to Launch Project"}</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
            <a
              href="#seed-project"
              className="px-5 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-sm border border-slate-700/80 transition-all"
            >
              Inspect Architecture
            </a>
          </div>
        </section>

        {/* Featured Seed Project Section */}
        <section id="seed-project" className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Active Seed Project</h2>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Complete, self-contained project with verified executable files and test suites.
              </p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold self-start sm:self-auto">
              1 Ready-to-Run Project
            </span>
          </div>

          {/* Main Project Card */}
          <div className="bg-gradient-to-b from-[#0e1322] to-[#0a0e19] border border-slate-800/90 hover:border-slate-700 rounded-2xl p-6 lg:p-8 space-y-8 shadow-2xl relative overflow-hidden group">
            {/* Top Row: Meta Tags & Title */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                    Backend Service
                  </span>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 capitalize">
                    {project.difficulty} Difficulty
                  </span>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    Node.js + Express
                  </span>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    JWT + PBKDF2/Bcrypt
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight group-hover:text-indigo-200 transition-colors">
                  {project.title}
                </h3>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  {project.description}
                </p>
              </div>

              {/* Action Button */}
              <div className="shrink-0">
                <Link
                  href={workspaceUrl}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
                >
                  {currentUser ? (
                    <Play className="h-4 w-4 fill-white" />
                  ) : (
                    <Lock className="h-4 w-4 text-amber-300" />
                  )}
                  <span>{currentUser ? "Open Interactive Workspace" : "Log In to Open Workspace"}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Middle: 3 Guided Tasks Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Structured Engineering Milestones ({project.tasks?.length || 3} Tasks)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(project.tasks || []).map((t) => (
                  <div
                    key={t.order}
                    className="p-4 rounded-xl bg-[#131929]/70 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-indigo-400">
                        TASK 0{t.order}
                      </span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    </div>
                    <h5 className="text-sm font-semibold text-white leading-snug">{t.title}</h5>
                    <p className="text-xs text-slate-400 leading-normal line-clamp-2">{t.description}</p>
                    <div className="pt-2 flex items-center gap-1.5 text-[11px] font-mono text-slate-500 truncate">
                      <FileCode className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{t.targetFiles?.[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom: File Structure Preview & Execution Capabilities */}
            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Runnable Project Files Included
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    "package.json",
                    "server.js",
                    "src/models/User.js",
                    "src/controllers/authController.js",
                    "src/routes/auth.js",
                    "src/middleware/auth.js",
                    "src/utils/jwt.js",
                    "test.js",
                    ".env",
                    "README.md",
                  ].map((file) => (
                    <span
                      key={file}
                      className="px-2.5 py-1 rounded-md bg-[#131826] border border-slate-800 font-mono text-xs text-slate-300 flex items-center gap-1.5"
                    >
                      <FileText className="h-3 w-3 text-indigo-400" />
                      {file}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-[#080c16] p-3.5 rounded-xl border border-slate-800/90 space-y-1.5 text-xs font-mono text-slate-300">
                <div className="flex items-center justify-between text-slate-500 border-b border-slate-800/80 pb-1 text-[11px]">
                  <span>Terminal Quick Commands</span>
                  <span className="text-emerald-400">Node v20+</span>
                </div>
                <p className="text-slate-400">
                  <span className="text-emerald-400 font-bold">➜</span> node test.js{" "}
                  <span className="text-slate-600">// Runs 16 automated assertions</span>
                </p>
                <p className="text-slate-400">
                  <span className="text-indigo-400 font-bold">➜</span> node server.js{" "}
                  <span className="text-slate-600">// Starts Auth HTTP server on port 5000</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Architecture & Features */}
        <section className="space-y-6">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Built for Modern Software Engineers
            </h2>
            <p className="text-sm text-slate-400">
              Everything you need to write, test, inspect, and evaluate backend services without context switching.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Cpu,
                color: "text-indigo-400",
                badge: "WebContainer",
                title: "In-Browser Node Runtime",
                desc: "Runs true Node.js microservices directly inside WebAssembly. No spinning up remote containers.",
              },
              {
                icon: Terminal,
                color: "text-emerald-400",
                badge: "Live Terminal",
                title: "Instant Code Execution",
                desc: "Execute test scripts with live streaming stdout/stderr, colorized logs, and exit code reporting.",
              },
              {
                icon: FolderTree,
                color: "text-cyan-400",
                badge: "File System",
                title: "Interactive File Tree",
                desc: "Create, rename, delete files and folders in real time with auto-sync to WebContainer.",
              },
              {
                icon: Sparkles,
                color: "text-purple-400",
                badge: "AI Copilot",
                title: "Context-Aware AI Mentor",
                desc: "Get instant code reviews, security best practice audits, and debugging breakdowns.",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-[#0e1322]/70 border border-slate-800/80 hover:border-slate-700/80 p-5 rounded-xl space-y-3 transition-all backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-slate-800">
                    {feature.badge}
                  </span>
                </div>
                <h3 className="font-bold text-white text-base">{feature.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Database Details & Configuration Modal */}
      {showDbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0e1322] border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
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
              <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Connection Status:</span>
                  {isConnected ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Connected & Initialized
                    </span>
                  ) : (
                    <span className="text-rose-400 font-semibold flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> Disconnected (Fallback active)
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
                <div className="bg-[#080b14] p-3 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 space-y-2">
                  <p className="text-slate-500 text-[11px]"># Active connection string</p>
                  <p className="text-emerald-400 break-all">MONGODB_URI=mongodb+srv://...mongodb.net</p>
                  <p className="text-slate-500 text-[11px] mt-2"># JWT Secret key</p>
                  <p className="text-cyan-400">JWT_SECRET=nudge_super_secret_jwt_key_2026_dev</p>
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
      <footer className="bg-[#07090f]/90 border-t border-slate-800/80 py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 Nudge Platform. Built with Next.js App Router, WebContainer & Mongoose.</p>
      </footer>
    </div>
  );
}
