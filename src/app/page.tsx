"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  Zap,
  HelpCircle,
  ChevronDown,
  ExternalLink,
  Laptop,
  CheckCheck,
  AlertTriangle,
  Github,
  BookOpen,
} from "lucide-react";
import NudgeLogo, { NudgeLogoMark } from "@/components/NudgeLogo";
import HeroIdeMockup from "@/components/landing/HeroIdeMockup";
import AiMentorSimulator from "@/components/landing/AiMentorSimulator";
import {
  authSeedProject,
  feedbackBoardSeedProject,
  allSeedProjects,
  type SeedProject,
} from "@/lib/seedProject";

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

interface EnrolledProject {
  _id: string;
  projectSlug: string;
  title: string;
  description: string;
  track: string;
  difficulty: string;
  totalTasks: number;
  completedTasksCount: number;
  progressPercent: number;
  currentTaskIndex: number;
  lastActiveAt: string;
  filesCount: number;
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
  const [userProjects, setUserProjects] = useState<EnrolledProject[]>([]);
  const [dbStatus, setDbStatus] = useState<DbStatusResponse | null>(null);
  const [projects, setProjects] = useState<SeedProject[]>(allSeedProjects);
  const [selectedTrack, setSelectedTrack] = useState<"all" | "backend" | "fullstack" | "frontend">("all");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
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
        setProjects(projData.data);
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

    // Check user auth session & enrolled projects
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setCurrentUser(data.user);
          fetch("/api/user-projects")
            .then((res) => res.json())
            .then((up) => {
              if (up.success && Array.isArray(up.data)) {
                setUserProjects(up.data);
              }
            })
            .catch(() => null);
        }
      })
      .catch((err) => console.error("Auth check error:", err));
  }, []);

  const isConnected = dbStatus?.status === "ok";

  const filteredProjects =
    selectedTrack === "all"
      ? projects
      : projects.filter((p) => p.track === selectedTrack);

  const faqs = [
    {
      q: "How is Nudge different from ChatGPT or GitHub Copilot?",
      a: "ChatGPT and Copilot complete or generate code for you, creating an illusion of competence where you copy-paste without understanding. Nudge NEVER writes the solution for you. Instead, it observes your failing tests and terminal output, then provides progressive Socratic hints (Observation → Guiding Question → Implementation Direction) that train your own engineering instincts.",
    },
    {
      q: "Do I need to install Node.js, Docker, or VS Code locally?",
      a: "Zero setup required! Nudge uses WebAssembly-based WebContainers to execute full Node.js runtimes, package managers (npm), and servers directly inside your browser tab with zero remote latency.",
    },
    {
      q: "Are the projects based on real production code?",
      a: "Yes. You don't build toy calculator apps or solve abstract leetcode riddles. You build production JWT authentication services with password salting, REST APIs with MongoDB & Mongoose, rate limiters, and interactive apps backed by automated test suites.",
    },
    {
      q: "How does the AI mentor know when I'm stuck?",
      a: "The Nudge engine continuously inspects your in-browser file changes and test suite results. When assertions fail or syntax errors occur, it analyzes the exact AST and runtime stack trace to formulate progressive hints tailored to your current milestone.",
    },
    {
      q: "Can I run real commands in the terminal?",
      a: "Absolutely. You have an authentic in-browser terminal where you can run `npm test`, `node server.js`, install dependencies, and inspect live stdout/stderr streams.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#070a0e] text-slate-100 selection:bg-[#5eead4]/30 selection:text-white relative overflow-hidden bg-developer-grid">
      {/* Background Decorative Ambient Radial Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[#5eead4]/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-20 right-10 w-[600px] h-[600px] bg-[#38bdf8]/10 rounded-full blur-[160px]" />
      </div>

      {/* Top Notification / Announcement Banner */}
      <div className="w-full bg-[#090e14] border-b border-[#141d28] py-2 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#5eead4]/10 text-[#5eead4] border border-[#5eead4]/20 font-medium text-[11px]">
            <Sparkles className="w-3 h-3" />
            <span>Nudge v2.0 Platform Live</span>
          </span>
          <span className="hidden sm:inline text-slate-300">
            In-Browser WebContainer runtime with progressive AI mentoring is now active.
          </span>
          <a
            href="#simulator"
            className="text-[#5eead4] hover:underline font-medium inline-flex items-center gap-1"
          >
            <span>Try AI Mentor Demo</span>
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Navigation Bar matching Image 1 */}
      <header className="sticky top-0 z-40 bg-[#070a0e]/85 backdrop-blur-xl border-b border-[#141c26] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <NudgeLogo size="md" lightText={true} />
          </Link>

          {/* Center Nav Links matching Image 1 */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#how-it-works" className="hover:text-white transition-colors">
              Learn
            </a>
            <a href="#projects" className="hover:text-white transition-colors">
              Projects
            </a>
            <a href="#simulator" className="hover:text-white transition-colors">
              AI Mentor
            </a>
            <a href="#comparison" className="hover:text-white transition-colors">
              The Method
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {/* DB Status Pill */}
            <button
              onClick={() => setShowDbModal(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0c1219] hover:bg-[#111a24] border border-[#1a2533] text-xs transition-all cursor-pointer shadow-sm group"
              title="Click to view database connection status"
            >
              <Database className="h-3.5 w-3.5 text-[#5eead4] group-hover:text-white" />
              {loading ? (
                <span className="text-amber-400 font-medium flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Checking...
                </span>
              ) : isConnected ? (
                <span className="flex items-center gap-1.5 text-[#34d399] font-medium">
                  <span className="h-2 w-2 rounded-full bg-[#34d399] animate-pulse" />
                  DB Online
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  Offline (Seed Active)
                </span>
              )}
            </button>

            {/* Auth State */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0c1219] border border-[#1a2533] text-xs text-slate-200">
                  <UserIcon className="h-3.5 w-3.5 text-[#5eead4]" />
                  <span className="font-medium">{currentUser.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full hover:bg-[#15202d] text-slate-400 hover:text-rose-400 text-xs transition-colors"
                  title="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-slate-300 hover:text-white text-sm font-medium transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-full bg-[#5eead4] hover:bg-[#4ee4a5] text-[#081817] text-xs font-bold transition-all shadow-md shadow-[#5eead4]/20 hover:scale-[1.02]"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full space-y-24 pb-24">
        {/* DB Notice if disconnected */}
        {!loading && !isConnected && (
          <div className="max-w-7xl mx-auto px-6 pt-6">
            <div className="p-3.5 rounded-2xl bg-[#160d11] border border-rose-900/40 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>
                  MongoDB connection notice: In-memory project seed is active. Workspaces and tests will run locally with full WebContainer support.
                </span>
              </div>
              <button
                onClick={() => setShowDbModal(true)}
                className="px-3 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-200 font-semibold border border-rose-500/30 shrink-0"
              >
                Inspect Connection
              </button>
            </div>
          </div>
        )}

        {/* User Enrolled Projects Quick Bar (if logged in) */}
        {currentUser && userProjects.length > 0 && (
          <div className="max-w-7xl mx-auto px-6 pt-6">
            <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0c141d] to-[#090e16] border border-[#1b2737] shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#5eead4] animate-pulse" />
                  <h3 className="font-bold text-white text-base">Your Active Workspaces</h3>
                </div>
                <span className="text-xs text-slate-400">
                  {userProjects.length} in-progress project{userProjects.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userProjects.map((up) => (
                  <div
                    key={up._id}
                    className="p-4 rounded-xl bg-[#080d14] border border-[#16212e] hover:border-[#5eead4]/40 transition-all flex items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#5eead4]/10 text-[#5eead4] border border-[#5eead4]/20">
                          {up.track}
                        </span>
                        <h4 className="text-sm font-semibold text-white truncate group-hover:text-[#5eead4] transition-colors">
                          {up.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>
                          Task {(up.currentTaskIndex || 0) + 1} of {up.totalTasks}
                        </span>
                        <span>•</span>
                        <span className="text-[#34d399] font-medium">{up.progressPercent}% Completed</span>
                      </div>
                    </div>

                    <Link
                      href={`/project/${up.projectSlug}`}
                      className="px-4 py-2 rounded-xl bg-[#5eead4] hover:bg-[#4ee4a5] text-[#081817] font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#5eead4]/20 shrink-0 transition-all hover:scale-105"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Resume</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* HERO SECTION — EXACTLY MATCHING USER'S IMAGE 1, IMAGE 2, AND IMAGE 3      */}
        {/* ========================================================================= */}
        <section className="max-w-7xl mx-auto px-6 pt-8 sm:pt-14 space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Hero Column: Headline, Copy, CTA & Badges */}
            <div className="lg:col-span-5 space-y-8 text-left">
              {/* Giant Bold Headline from Image 1 */}
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold tracking-tight leading-[1.08] text-white">
                Learn by building.
                <br />
                Get <span className="text-[#5eead4]">nudged</span> when
                <br />
                you're stuck.
              </h1>

              {/* Subtitle from Image 1 */}
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-lg font-normal">
                Write real code, solve real problems, and get contextual hints from an AI mentor that helps you think — not do it for you.
              </p>

              {/* CTA Group from Image 1 */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
                <Link
                  href={
                    currentUser
                      ? `/project/${projects[0]?.slug || "feedback-board"}`
                      : `/signup?redirect=/project/${projects[0]?.slug || "feedback-board"}`
                  }
                  className="px-7 py-3.5 rounded-full bg-[#5eead4] hover:bg-[#4ee4a5] text-[#081817] font-bold text-sm flex items-center gap-2 shadow-xl shadow-[#5eead4]/20 transition-all hover:scale-[1.03] group"
                >
                  <span>Start learning</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <a
                  href="#projects"
                  className="px-6 py-3.5 rounded-full bg-[#0d141d] hover:bg-[#131d2a] text-slate-300 hover:text-white text-sm font-semibold border border-[#1b2533] transition-all"
                >
                  Explore curriculum
                </a>
              </div>

              {/* Trust / Feature Badges from Image 1 */}
              <div className="flex flex-wrap items-center gap-6 pt-4 text-xs sm:text-sm text-slate-400 font-medium">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#5eead4]" />
                  <span>No setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#5eead4]" />
                  <span>Learn by doing</span>
                </div>
                <div className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-[#5eead4]" />
                  <span>Real projects</span>
                </div>
              </div>
            </div>

            {/* Right Hero Column: IDE Mockup + Hand-Drawn Arrow Annotation */}
            <div className="lg:col-span-7">
              <HeroIdeMockup />
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SOCIAL PROOF & SCALE TICKER BAR                                           */}
        {/* ========================================================================= */}
        <section className="border-y border-[#141d28] bg-[#070b10]/90 py-10 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="space-y-1 max-w-sm">
              <span className="text-xs font-mono uppercase tracking-widest text-[#5eead4] font-bold">
                Proven Engineering Methodology
              </span>
              <h3 className="text-lg font-bold text-white">Built for modern fullstack developers</h3>
              <p className="text-xs text-slate-400">
                Replace 40 hours of passive video courses with active project engineering.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10">
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">100%</div>
                <div className="text-xs text-slate-400">In-Browser Node.js</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#5eead4] font-mono">0</div>
                <div className="text-xs text-slate-400">Tutorial Videos</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">16+</div>
                <div className="text-xs text-slate-400">Assertions Per Task</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#38bdf8] font-mono">3x</div>
                <div className="text-xs text-slate-400">Higher Retention</div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* INTERACTIVE AI MENTOR SIMULATOR                                           */}
        {/* ========================================================================= */}
        <section id="simulator" className="max-w-7xl mx-auto px-6 scroll-mt-24">
          <AiMentorSimulator />
        </section>

        {/* ========================================================================= */}
        {/* HOW NUDGE WORKS: THE 3-STEP LEARNING LOOP                                  */}
        {/* ========================================================================= */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-6 scroll-mt-24 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#12222a] border border-[#23424d] text-[#5eead4] text-xs font-semibold">
              <span>The Active Learning Loop</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              How You Master Engineering with Nudge
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              No watching someone else type. You write every line, run real tests, and overcome obstacles with intelligent Socratic nudges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="p-7 rounded-2xl bg-[#0b1017] border border-[#192433] space-y-4 hover:border-[#5eead4]/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#5eead4]/10 border border-[#5eead4]/20 flex items-center justify-center text-[#5eead4] font-mono font-bold text-lg group-hover:scale-110 transition-transform">
                01
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-[#5eead4] transition-colors">
                Structured Engineering Milestones
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Take on real-world engineering specs. Instead of toy examples, you implement production auth, database queries, and REST APIs divided into logical, verifiable milestones.
              </p>
              <div className="pt-2 text-xs font-mono text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#5eead4]" />
                <span>Specs, schemas &amp; requirements</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-7 rounded-2xl bg-[#0b1017] border border-[#192433] space-y-4 hover:border-[#5eead4]/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#38bdf8]/10 border border-[#38bdf8]/20 flex items-center justify-center text-[#38bdf8] font-mono font-bold text-lg group-hover:scale-110 transition-transform">
                02
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-[#38bdf8] transition-colors">
                Instant In-Browser Node &amp; Monaco
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Write code in an authentic VS Code editor. Run test suites directly inside your browser via WebAssembly WebContainers. No Docker setup, no node_modules headaches.
              </p>
              <div className="pt-2 text-xs font-mono text-slate-500 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>Full bash terminal &amp; npm runner</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-7 rounded-2xl bg-[#0b1017] border border-[#192433] space-y-4 hover:border-[#5eead4]/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-mono font-bold text-lg group-hover:scale-110 transition-transform">
                03
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                Contextual AI Nudge When Stuck
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                When a test fails, Nudge diagnoses your syntax and logic. It delivers progressive hints that stimulate your problem-solving rather than writing the solution for you.
              </p>
              <div className="pt-2 text-xs font-mono text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Zero spoilers • 100% learning</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CURRICULUM & PROJECT CATALOG SHOWCASE                                      */}
        {/* ========================================================================= */}
        <section id="projects" className="max-w-7xl mx-auto px-6 scroll-mt-24 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#17202c] pb-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#12222a] border border-[#23424d] text-[#5eead4] text-xs font-semibold">
                <FolderTree className="w-3.5 h-3.5" />
                <span>Production Project Library</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Curriculum Designed for Real Portfolio Mastery
              </h2>
              <p className="text-slate-400 text-sm">
                Each project is self-contained with executable tests, pre-built frontends, and automated evaluation.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {(["all", "fullstack", "backend", "frontend"] as const).map((track) => (
                <button
                  key={track}
                  onClick={() => setSelectedTrack(track)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                    selectedTrack === track
                      ? "bg-[#5eead4] text-[#081817] shadow-lg shadow-[#5eead4]/20"
                      : "bg-[#0d141d] text-slate-400 hover:text-white border border-[#1b2533]"
                  }`}
                >
                  {track === "all" ? "All Tracks" : track}
                </button>
              ))}
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredProjects.map((p) => {
              const enrolled = userProjects.find((u) => u.projectSlug === p.slug);
              return (
                <div
                  key={p.slug}
                  className="rounded-2xl bg-gradient-to-br from-[#0c121a] to-[#080c11] border border-[#1b2737] hover:border-[#5eead4]/50 transition-all p-6 sm:p-8 space-y-6 shadow-xl flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="space-y-4">
                    {/* Tags */}
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-[#5eead4]/15 text-[#5eead4] border border-[#5eead4]/30 capitalize">
                        {p.track}
                      </span>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 capitalize">
                        {p.difficulty}
                      </span>
                      <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20">
                        {p.tasks.length} Guided Tasks
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-[#5eead4] transition-colors leading-snug">
                      {p.title}
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">{p.description}</p>

                    {/* Task Milestones List */}
                    <div className="space-y-2 pt-2 border-t border-[#16212e]">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                        Included Milestones:
                      </span>
                      <div className="space-y-1.5">
                        {p.tasks.map((t) => (
                          <div
                            key={t.order}
                            className="flex items-center gap-2.5 text-xs text-slate-300 bg-[#070b10] px-3 py-2 rounded-lg border border-[#141c26]"
                          >
                            <span className="text-[10px] font-mono font-bold text-[#5eead4]">
                              0{t.order}
                            </span>
                            <span className="font-medium truncate">{t.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="pt-4 border-t border-[#16212e] flex items-center justify-between gap-4">
                    {enrolled ? (
                      <div className="space-y-1 flex-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400">Progress</span>
                          <span className="text-[#5eead4]">{enrolled.progressPercent}%</span>
                        </div>
                        <div className="w-full bg-[#131c26] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#5eead4] h-full transition-all"
                            style={{ width: `${enrolled.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-[#5eead4]" />
                        <span>Ready in 1 click</span>
                      </div>
                    )}

                    <Link
                      href={
                        currentUser
                          ? `/project/${p.slug}`
                          : `/login?redirect=/project/${encodeURIComponent(p.slug)}`
                      }
                      className="px-5 py-2.5 rounded-xl bg-[#5eead4] hover:bg-[#4ee4a5] text-[#081817] text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-[#5eead4]/20 hover:scale-105 shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{enrolled ? "Continue Building" : "Launch Project"}</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* THE ANTI-TUTORIAL COMPARISON MATRIX                                        */}
        {/* ========================================================================= */}
        <section id="comparison" className="max-w-7xl mx-auto px-6 scroll-mt-24 space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#12222a] border border-[#23424d] text-[#5eead4] text-xs font-semibold">
              <span>Why Nudge Works</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Why Traditional Developer Learning Fails
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Tutorial Hell creates passive spectators. AI coding assistants create copy-paste dependence. Nudge creates capable, self-sufficient engineers.
            </p>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[700px] rounded-2xl bg-[#090e15] border border-[#1a2533] overflow-hidden shadow-2xl">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#192330] bg-[#0b121b] text-slate-400 text-xs font-mono uppercase tracking-wider">
                    <th className="py-4 px-6">Learning Format</th>
                    <th className="py-4 px-6">Active Coding</th>
                    <th className="py-4 px-6">Feedback Loop</th>
                    <th className="py-4 px-6">Retention Rate</th>
                    <th className="py-4 px-6">Production Readiness</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#151f2b] text-slate-300">
                  <tr className="hover:bg-[#0c141e]/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white flex items-center gap-2">
                      <span className="text-rose-400">✕</span> Video Tutorials
                    </td>
                    <td className="py-4 px-6 text-slate-400">Passive watching</td>
                    <td className="py-4 px-6 text-slate-400">None (outdated bugs)</td>
                    <td className="py-4 px-6 text-rose-400 font-medium">~10% (Forgotten in days)</td>
                    <td className="py-4 px-6 text-slate-500">Low</td>
                  </tr>
                  <tr className="hover:bg-[#0c141e]/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white flex items-center gap-2">
                      <span className="text-rose-400">✕</span> LeetCode Grinding
                    </td>
                    <td className="py-4 px-6 text-slate-400">Isolated trick puzzles</td>
                    <td className="py-4 px-6 text-slate-400">Binary pass/fail</td>
                    <td className="py-4 px-6 text-amber-400 font-medium">~30% (Pattern memorization)</td>
                    <td className="py-4 px-6 text-slate-500">Zero architecture skills</td>
                  </tr>
                  <tr className="hover:bg-[#0c141e]/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white flex items-center gap-2">
                      <span className="text-rose-400">✕</span> ChatGPT / Copilot
                    </td>
                    <td className="py-4 px-6 text-slate-400">Copy-pasting solutions</td>
                    <td className="py-4 px-6 text-slate-400">Writes the answer for you</td>
                    <td className="py-4 px-6 text-rose-400 font-medium">~15% (Atrophies intuition)</td>
                    <td className="py-4 px-6 text-slate-500">Fragile dependencies</td>
                  </tr>
                  <tr className="bg-[#5eead4]/5 hover:bg-[#5eead4]/10 transition-colors">
                    <td className="py-4 px-6 font-extrabold text-[#5eead4] flex items-center gap-2">
                      <NudgeLogoMark size={16} /> Nudge Platform
                    </td>
                    <td className="py-4 px-6 font-semibold text-white">100% Real Fullstack Code</td>
                    <td className="py-4 px-6 font-semibold text-[#5eead4]">
                      Progressive Socratic Hints
                    </td>
                    <td className="py-4 px-6 font-extrabold text-[#34d399]">
                      90%+ Permanent Retention
                    </td>
                    <td className="py-4 px-6 font-semibold text-white">Production Portfolio</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* BENTO GRID: PLATFORM ARCHITECTURE                                          */}
        {/* ========================================================================= */}
        <section className="max-w-7xl mx-auto px-6 space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              A True Professional Engineering Workspace
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Every detail engineered to give you the exact feel of a modern software company’s internal developer toolset.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#0a0e16] border border-[#192433] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#38bdf8]">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">WebAssembly WebContainer</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Boot Node.js processes in under 300 milliseconds. Runs entirely inside your browser memory with full filesystem manipulation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0a0e16] border border-[#192433] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#5eead4]/10 border border-[#5eead4]/20 flex items-center justify-center text-[#5eead4]">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Monaco VS Code Editor</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The identical code engine powering VS Code. Full multi-file support, syntax highlighting, keyboard shortcuts, and gutter indicators.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0a0e16] border border-[#192433] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Automated Test Suites</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every task includes a rigorous test runner. You know your code is correct because real assertion suites pass, not because you assumed it works.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* INTERACTIVE FAQ ACCORDION                                                  */}
        {/* ========================================================================= */}
        <section id="faq" className="max-w-4xl mx-auto px-6 scroll-mt-24 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-400 text-sm">
              Everything you need to know about the Nudge learning methodology.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-[#0a0e16] border border-[#192433] overflow-hidden transition-all"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between text-sm sm:text-base font-semibold text-white hover:text-[#5eead4] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      activeFaq === idx ? "rotate-180 text-[#5eead4]" : ""
                    }`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-6 pb-4 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-[#141d28] bg-[#070b10]/50 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* HIGH-IMPACT BOTTOM CTA BANNER                                             */}
        {/* ========================================================================= */}
        <section className="max-w-7xl mx-auto px-6">
          <div className="relative rounded-3xl bg-gradient-to-b from-[#0e1722] to-[#070b10] border border-[#203043] p-10 sm:p-16 text-center space-y-6 overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-radial-gradient pointer-events-none" />

            <div className="relative space-y-4 max-w-2xl mx-auto">
              <NudgeLogoMark size={36} className="mx-auto" />
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Break out of tutorial hell.
                <br />
                <span className="text-[#5eead4]">Build real software today.</span>
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Zero local setup. Real Node.js runtime. Progressive AI guidance that builds lifelong engineering confidence.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href={
                    currentUser
                      ? `/project/${projects[0]?.slug || "feedback-board"}`
                      : `/signup?redirect=/project/${projects[0]?.slug || "feedback-board"}`
                  }
                  className="px-8 py-4 rounded-full bg-[#5eead4] hover:bg-[#4ee4a5] text-[#081817] font-bold text-sm flex items-center gap-2 shadow-xl shadow-[#5eead4]/25 transition-all hover:scale-105"
                >
                  <span>Start learning for free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#simulator"
                  className="px-6 py-4 rounded-full bg-[#131d2a] hover:bg-[#182535] text-slate-200 text-sm font-semibold border border-[#233346] transition-all"
                >
                  Test AI Mentor
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Database Details & Configuration Modal */}
      {showDbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b1017] border border-[#1d2938] rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#192433] pb-4">
              <div className="flex items-center gap-2.5">
                <Database className="h-5 w-5 text-[#5eead4]" />
                <h3 className="text-lg font-bold text-white">Database Status &amp; Configuration</h3>
              </div>
              <button
                onClick={() => setShowDbModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#16212e] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#070b10] border border-[#16212e] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Connection Status:</span>
                  {isConnected ? (
                    <span className="text-[#34d399] font-semibold flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Connected &amp; Initialized
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
                        <Cloud className="h-3.5 w-3.5 text-[#38bdf8]" /> MongoDB Atlas Cloud
                      </>
                    ) : (
                      <>
                        <Server className="h-3.5 w-3.5 text-[#5eead4]" /> Local MongoDB (127.0.0.1:27017)
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
                    <span className="text-[#5eead4] font-mono text-[11px]">{dbStatus.database}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Configuring MongoDB in .env
                </h4>
                <div className="bg-[#05080c] p-3 rounded-lg border border-[#141d28] text-xs font-mono text-slate-300 space-y-2">
                  <p className="text-slate-500 text-[11px]"># Connection string</p>
                  <p className="text-[#34d399] break-all">MONGODB_URI=mongodb+srv://...mongodb.net</p>
                  <p className="text-slate-500 text-[11px] mt-2"># JWT Secret key</p>
                  <p className="text-[#38bdf8]">JWT_SECRET=nudge_super_secret_jwt_key_2026_dev</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  fetchHealthAndProjects();
                  setShowDbModal(false);
                }}
                className="px-4 py-2 rounded-lg bg-[#5eead4] text-[#081817] text-xs font-bold transition-all hover:bg-[#4ee4a5]"
              >
                Close &amp; Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#05070a] border-t border-[#121822] py-12 px-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <NudgeLogo size="sm" lightText={true} />
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">AI-Guided Developer Learning Platform</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400 font-medium">
            <a href="#how-it-works" className="hover:text-[#5eead4] transition-colors">
              Method
            </a>
            <a href="#projects" className="hover:text-[#5eead4] transition-colors">
              Projects
            </a>
            <a href="#simulator" className="hover:text-[#5eead4] transition-colors">
              AI Mentor
            </a>
            <a href="#faq" className="hover:text-[#5eead4] transition-colors">
              FAQ
            </a>
          </div>

          <div className="text-slate-400">
            © 2026 Nudge. Built with Next.js App Router, WebContainers &amp; Monaco.
          </div>
        </div>
      </footer>
    </div>
  );
}
