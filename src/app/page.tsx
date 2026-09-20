"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Code2,
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
  BookOpen,
  Terminal,
} from "lucide-react";
import NudgeLogo from "@/components/NudgeLogo";
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
  const [showDbModal, setShowDbModal] = useState(false);

  const fetchHealthAndProjects = async () => {
    try {
      const healthRes = await fetch("/api/health").catch(() => null);
      if (healthRes) {
        const healthData = await healthRes.json();
        setDbStatus(healthData);
      }

      const projRes = await fetch("/api/projects").catch(() => null);
      if (projRes) {
        const projData = await projRes.json();
        if (projData.success && Array.isArray(projData.data) && projData.data.length > 0) {
          setProjects(projData.data);
        }
      }
    } catch (err: any) {
      console.error("Health check error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      setUserProjects([]);
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  useEffect(() => {
    fetchHealthAndProjects();

    // Check user session
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
      q: "How does Nudge differ from ChatGPT or GitHub Copilot?",
      a: "ChatGPT and Copilot complete code for you, creating an illusion of competence where you copy-paste without true understanding. Nudge NEVER writes the solution for you. Instead, it performs static code analysis against explicit acceptance criteria and provides progressive 5-level Socratic hints (Level 1: Conceptual question -> Level 2: Location pointer -> Level 3: Diagnostic explanation -> Level 4: Pseudocode -> Level 5: Targeted syntax hint) that train your own engineering instincts.",
    },
    {
      q: "How does task progression work?",
      a: "Nudge uses a strict sequential curriculum. You see ONLY your current task (e.g. Task 1 of 3). Future tasks are locked on the backend. When you run static evaluation and all criteria pass, the system automatically marks the milestone complete and unlocks the next task.",
    },
    {
      q: "What is Static Source Code Evaluation?",
      a: "Rather than executing code or pretending test commands ran, Nudge evaluates your source files statically against concrete acceptance criteria, checking function structures, signatures, error handling, status codes, and algorithmic logic.",
    },
    {
      q: "Do I need to install Node.js, Docker, or tools locally?",
      a: "Zero setup required! You write real code inside a professional Monaco editor in your browser tab. Your files, workspace state, and curriculum milestones are automatically synced with MongoDB.",
    },
    {
      q: "Are the projects based on real production architectures?",
      a: "Yes. You build production JWT authentication microservices with cryptographic PBKDF2 salting, full-stack feedback REST APIs with MongoDB & Mongoose atomic operators, and robust route controllers.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#080C0D] text-[#F4F7F6] selection:bg-[#67D6B2]/30 selection:text-white relative overflow-hidden bg-developer-grid">
      {/* Ambient Radial Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[#67D6B2]/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-20 right-10 w-[600px] h-[600px] bg-[#76A8FF]/10 rounded-full blur-[160px]" />
      </div>

      {/* Top Banner */}
      <div className="w-full bg-[#0D1214] border-b border-[#202A2C] py-2 px-4 text-center text-xs text-[#A9B5B2]">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#67D6B2]/10 text-[#67D6B2] border border-[#67D6B2]/20 font-medium text-[11px]">
            <Sparkles className="w-3 h-3" />
            <span>Socratic AI Engineering</span>
          </span>
          <span className="hidden sm:inline text-[#F4F7F6]">
            Progressive 5-level hints and static code verification are live.
          </span>
          <a
            href="#simulator"
            className="text-[#67D6B2] hover:underline font-medium inline-flex items-center gap-1"
          >
            <span>Try AI Mentor Demo</span>
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#080C0D]/85 backdrop-blur-xl border-b border-[#202A2C] px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <NudgeLogo size="md" />
          </Link>

          {/* Center Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-[#A9B5B2]">
            <a href="#how-it-works" className="hover:text-white transition-colors">
              Method
            </a>
            <a href="#projects" className="hover:text-white transition-colors">
              Projects
            </a>
            <a href="#simulator" className="hover:text-white transition-colors">
              AI Mentor
            </a>
            <a href="#comparison" className="hover:text-white transition-colors">
              Comparison
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
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0D1214] hover:bg-[#151D1F] border border-[#202A2C] text-xs transition-all cursor-pointer shadow-sm group"
              title="Click to view database connection status"
            >
              <Database className="h-3.5 w-3.5 text-[#67D6B2] group-hover:text-white" />
              {loading ? (
                <span className="text-[#E9C46A] font-medium flex items-center gap-1 text-[11px]">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Checking...
                </span>
              ) : isConnected ? (
                <span className="flex items-center gap-1.5 text-[#67D6B2] font-medium text-[11px]">
                  <span className="h-2 w-2 rounded-full bg-[#67D6B2] animate-pulse" />
                  DB Online
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[#F06A6A] font-medium text-[11px]">
                  <span className="h-2 w-2 rounded-full bg-[#F06A6A]" />
                  Seed Active
                </span>
              )}
            </button>

            {/* Auth State */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0D1214] border border-[#202A2C] text-xs text-[#F4F7F6]">
                  <UserIcon className="h-3.5 w-3.5 text-[#67D6B2]" />
                  <span className="font-medium">{currentUser.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full hover:bg-[#151D1F] text-[#71807C] hover:text-[#F06A6A] text-xs transition-colors cursor-pointer"
                  title="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-[#A9B5B2] hover:text-white text-xs font-semibold transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-[#67D6B2] to-[#10B981] text-[#080C0D] text-xs font-bold transition-all shadow-md shadow-[#67D6B2]/20 hover:scale-[1.02]"
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
        {/* User Enrolled Projects Bar (if logged in) */}
        {currentUser && userProjects.length > 0 && (
          <div className="max-w-7xl mx-auto px-6 pt-6">
            <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0D1214] to-[#080C0D] border border-[#202A2C] shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#67D6B2] animate-pulse" />
                  <h3 className="font-bold text-white text-base">Your Active Workspaces</h3>
                </div>
                <span className="text-xs text-[#71807C]">
                  {userProjects.length} in-progress project{userProjects.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userProjects.map((up) => (
                  <div
                    key={up._id}
                    className="p-4 rounded-xl bg-[#11181A] border border-[#202A2C] hover:border-[#67D6B2]/40 transition-all flex items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#67D6B2]/10 text-[#67D6B2] border border-[#67D6B2]/20">
                          {up.track}
                        </span>
                        <h4 className="text-sm font-semibold text-white truncate group-hover:text-[#67D6B2] transition-colors">
                          {up.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#71807C]">
                        <span>
                          Task {(up.currentTaskIndex || 0) + 1} of {up.totalTasks}
                        </span>
                        <span>•</span>
                        <span className="text-[#67D6B2] font-medium">{up.progressPercent}% Completed</span>
                      </div>
                    </div>

                    <Link
                      href={`/project/${up.projectSlug}`}
                      className="px-4 py-2 rounded-xl bg-[#67D6B2] hover:bg-[#10B981] text-[#080C0D] font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#67D6B2]/20 shrink-0 transition-all hover:scale-105"
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

        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-6 pt-8 sm:pt-14 space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Hero Column */}
            <div className="lg:col-span-5 space-y-8 text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black tracking-tight leading-[1.08] text-white">
                Learn by building.
                <br />
                Get <span className="text-[#67D6B2]">nudged</span> when
                <br />
                you&apos;re stuck.
              </h1>

              <p className="text-base sm:text-lg text-[#A9B5B2] leading-relaxed max-w-lg font-normal">
                Write real code, solve production milestones, and receive progressive 5-level Socratic hints from an AI mentor that helps you think — not writes it for you.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
                <Link
                  href={
                    currentUser
                      ? `/project/${projects[0]?.slug || "build-auth"}`
                      : `/signup?redirect=/project/${projects[0]?.slug || "build-auth"}`
                  }
                  className="px-7 py-3.5 rounded-full bg-gradient-to-r from-[#67D6B2] to-[#10B981] text-[#080C0D] font-bold text-sm flex items-center gap-2 shadow-xl shadow-[#67D6B2]/20 transition-all hover:scale-[1.03] group"
                >
                  <span>Start learning free</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <a
                  href="#projects"
                  className="px-6 py-3.5 rounded-full bg-[#0D1214] hover:bg-[#151D1F] text-[#F4F7F6] text-sm font-semibold border border-[#202A2C] transition-all"
                >
                  Explore curriculum
                </a>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-6 pt-4 text-xs sm:text-sm text-[#A9B5B2] font-medium">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#67D6B2]" />
                  <span>No setup required</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#67D6B2]" />
                  <span>Lockstep progression</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#67D6B2]" />
                  <span>Static verification</span>
                </div>
              </div>
            </div>

            {/* Right Hero Column: IDE Mockup */}
            <div className="lg:col-span-7">
              <HeroIdeMockup />
            </div>
          </div>
        </section>

        {/* SCALE & METHODOLOGY TICKER */}
        <section className="border-y border-[#202A2C] bg-[#0D1214] py-10 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="space-y-1 max-w-sm">
              <span className="text-xs font-mono uppercase tracking-widest text-[#67D6B2] font-bold">
                Pedagogical AI Engine
              </span>
              <h3 className="text-lg font-bold text-white">Built for True Problem Solving</h3>
              <p className="text-xs text-[#A9B5B2]">
                Replace 40 hours of passive video tutorials with active source code construction.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10">
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">5 Tiers</div>
                <div className="text-xs text-[#71807C]">Progressive Nudges</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#67D6B2] font-mono">0 Spoilers</div>
                <div className="text-xs text-[#71807C]">Never Dumps Code</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">100% Static</div>
                <div className="text-xs text-[#71807C]">Acceptance Analysis</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#76A8FF] font-mono">Sequential</div>
                <div className="text-xs text-[#71807C]">Lockstep Tasks</div>
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE AI MENTOR SIMULATOR */}
        <section id="simulator" className="max-w-7xl mx-auto px-6 scroll-mt-24">
          <AiMentorSimulator />
        </section>

        {/* HOW NUDGE WORKS: THE 3-STEP LEARNING LOOP */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-6 scroll-mt-24 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A2428] border border-[#67D6B2]/30 text-[#67D6B2] text-xs font-semibold">
              <span>The Active Learning Loop</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              How You Master Engineering with Nudge
            </h2>
            <p className="text-[#A9B5B2] text-sm sm:text-base leading-relaxed">
              No watching someone else type. You write every line, solve realistic specs, and overcome hurdles with Socratic guidance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="p-7 rounded-2xl bg-[#0D1214] border border-[#202A2C] space-y-4 hover:border-[#67D6B2]/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#67D6B2]/10 border border-[#67D6B2]/20 flex items-center justify-center text-[#67D6B2] font-mono font-bold text-lg group-hover:scale-110 transition-transform">
                01
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-[#67D6B2] transition-colors">
                Strict Sequential Milestones
              </h3>
              <p className="text-sm text-[#A9B5B2] leading-relaxed">
                Take on real-world engineering specs. You see ONLY your current active task. Future tasks remain locked on the backend until your static evaluation passes.
              </p>
              <div className="pt-2 text-xs font-mono text-[#71807C] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#67D6B2]" />
                <span>Zero curriculum overwhelm</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="p-7 rounded-2xl bg-[#0D1214] border border-[#202A2C] space-y-4 hover:border-[#67D6B2]/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#76A8FF]/10 border border-[#76A8FF]/20 flex items-center justify-center text-[#76A8FF] font-mono font-bold text-lg group-hover:scale-110 transition-transform">
                02
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-[#76A8FF] transition-colors">
                Zero-Secret Monaco IDE
              </h3>
              <p className="text-sm text-[#A9B5B2] leading-relaxed">
                Write code in the identical Monaco engine powering VS Code. Zero API key configuration required. Puter.js orchestrates Gemini AI interactions securely in-browser.
              </p>
              <div className="pt-2 text-xs font-mono text-[#71807C] flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#76A8FF]" />
                <span>Multi-tab editing &amp; auto-save</span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="p-7 rounded-2xl bg-[#0D1214] border border-[#202A2C] space-y-4 hover:border-[#67D6B2]/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#E9C46A]/10 border border-[#E9C46A]/20 flex items-center justify-center text-[#E9C46A] font-mono font-bold text-lg group-hover:scale-110 transition-transform">
                03
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-[#E9C46A] transition-colors">
                5-Level Socratic AI Ladder
              </h3>
              <p className="text-sm text-[#A9B5B2] leading-relaxed">
                Stuck on logic? Request progressive Socratic hints from Level 1 (orientation question) to Level 5 (targeted syntax hint) without ever having the answer spoiled.
              </p>
              <div className="pt-2 text-xs font-mono text-[#71807C] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#E9C46A]" />
                <span>Deep conceptual retention</span>
              </div>
            </div>
          </div>
        </section>

        {/* CURRICULUM PROJECT CATALOG */}
        <section id="projects" className="max-w-7xl mx-auto px-6 scroll-mt-24 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#202A2C] pb-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A2428] border border-[#67D6B2]/30 text-[#67D6B2] text-xs font-semibold">
                <FolderTree className="w-3.5 h-3.5" />
                <span>Production Project Library</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Curriculum Designed for Engineering Mastery
              </h2>
              <p className="text-[#A9B5B2] text-sm">
                Each project contains step-by-step milestone tasks with explicit static acceptance criteria.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {(["all", "fullstack", "backend", "frontend"] as const).map((track) => (
                <button
                  key={track}
                  onClick={() => setSelectedTrack(track)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap cursor-pointer ${
                    selectedTrack === track
                      ? "bg-[#67D6B2] text-[#080C0D] shadow-lg shadow-[#67D6B2]/20"
                      : "bg-[#0D1214] text-[#A9B5B2] hover:text-white border border-[#202A2C]"
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
                  className="rounded-2xl bg-gradient-to-br from-[#0D1214] to-[#080C0D] border border-[#202A2C] hover:border-[#67D6B2]/50 transition-all p-6 sm:p-8 space-y-6 shadow-xl flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="space-y-4">
                    {/* Tags */}
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-[#67D6B2]/15 text-[#67D6B2] border border-[#67D6B2]/30 capitalize">
                        {p.track}
                      </span>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-[#E9C46A]/10 text-[#E9C46A] border border-[#E9C46A]/20 capitalize">
                        {p.difficulty}
                      </span>
                      <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-[#76A8FF]/10 text-[#76A8FF] border border-[#76A8FF]/20">
                        {p.tasks.length} Sequential Tasks
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-[#67D6B2] transition-colors leading-snug">
                      {p.title}
                    </h3>
                    <p className="text-sm text-[#A9B5B2] leading-relaxed">{p.description}</p>

                    {/* Task Milestones List */}
                    <div className="space-y-2 pt-2 border-t border-[#202A2C]">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#71807C] font-semibold block">
                        Sequential Task Pipeline:
                      </span>
                      <div className="space-y-1.5">
                        {p.tasks.map((t) => (
                          <div
                            key={t.order}
                            className="flex items-center gap-2.5 text-xs text-[#F4F7F6] bg-[#080C0D] px-3 py-2 rounded-lg border border-[#202A2C]"
                          >
                            <span className="text-[10px] font-mono font-bold text-[#67D6B2]">
                              0{t.order}
                            </span>
                            <span className="font-medium truncate">{t.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="pt-4 border-t border-[#202A2C] flex items-center justify-between gap-4">
                    {enrolled ? (
                      <div className="space-y-1 flex-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-[#71807C]">Progress</span>
                          <span className="text-[#67D6B2]">{enrolled.progressPercent}%</span>
                        </div>
                        <div className="w-full bg-[#11181A] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#67D6B2] h-full transition-all"
                            style={{ width: `${enrolled.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-[#71807C] flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-[#67D6B2]" />
                        <span>Ready to build</span>
                      </div>
                    )}

                    <Link
                      href={
                        currentUser
                          ? `/project/${p.slug}`
                          : `/login?redirect=/project/${encodeURIComponent(p.slug)}`
                      }
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#67D6B2] to-[#10B981] text-[#080C0D] text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-[#67D6B2]/20 hover:scale-105 shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{enrolled ? "Resume Workspace" : "Launch Project"}</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* COMPARISON MATRIX */}
        <section id="comparison" className="max-w-7xl mx-auto px-6 scroll-mt-24 space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A2428] border border-[#67D6B2]/30 text-[#67D6B2] text-xs font-semibold">
              <span>The Pedagogical Difference</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Why Traditional Coding Education Fails
            </h2>
            <p className="text-[#A9B5B2] text-sm sm:text-base leading-relaxed">
              Video tutorials create passive spectators. AI coding assistants create copy-paste dependence. Nudge creates capable, self-sufficient engineers.
            </p>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[700px] rounded-2xl bg-[#0D1214] border border-[#202A2C] overflow-hidden shadow-2xl">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#202A2C] bg-[#11181A] text-[#71807C] text-xs font-mono uppercase tracking-wider">
                    <th className="py-4 px-6">Learning Format</th>
                    <th className="py-4 px-6">Active Coding</th>
                    <th className="py-4 px-6">Feedback Loop</th>
                    <th className="py-4 px-6">Retention Rate</th>
                    <th className="py-4 px-6">Production Readiness</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202A2C] text-[#A9B5B2]">
                  <tr className="hover:bg-[#11181A]/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white flex items-center gap-2">
                      <span className="text-[#F06A6A]">✕</span> Video Tutorials
                    </td>
                    <td className="py-4 px-6 text-[#71807C]">Passive watching</td>
                    <td className="py-4 px-6 text-[#71807C]">None (outdated bugs)</td>
                    <td className="py-4 px-6 text-[#F06A6A] font-medium">~10% (Forgotten quickly)</td>
                    <td className="py-4 px-6 text-[#4B5754]">Low</td>
                  </tr>
                  <tr className="hover:bg-[#11181A]/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white flex items-center gap-2">
                      <span className="text-[#F06A6A]">✕</span> LeetCode Grinding
                    </td>
                    <td className="py-4 px-6 text-[#71807C]">Isolated trick puzzles</td>
                    <td className="py-4 px-6 text-[#71807C]">Binary pass/fail</td>
                    <td className="py-4 px-6 text-[#E9C46A] font-medium">~30% (Pattern memorization)</td>
                    <td className="py-4 px-6 text-[#4B5754]">Zero architecture skills</td>
                  </tr>
                  <tr className="hover:bg-[#11181A]/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white flex items-center gap-2">
                      <span className="text-[#F06A6A]">✕</span> ChatGPT / Copilot
                    </td>
                    <td className="py-4 px-6 text-[#71807C]">Copy-pasting solutions</td>
                    <td className="py-4 px-6 text-[#71807C]">Writes the answer for you</td>
                    <td className="py-4 px-6 text-[#F06A6A] font-medium">~15% (Atrophies intuition)</td>
                    <td className="py-4 px-6 text-[#4B5754]">Fragile dependence</td>
                  </tr>
                  <tr className="bg-[#67D6B2]/5 hover:bg-[#67D6B2]/10 transition-colors">
                    <td className="py-4 px-6 font-extrabold text-[#67D6B2] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#67D6B2]" /> Nudge Platform
                    </td>
                    <td className="py-4 px-6 font-semibold text-white">100% Real Source Code</td>
                    <td className="py-4 px-6 font-semibold text-[#67D6B2]">
                      Progressive Socratic Nudges
                    </td>
                    <td className="py-4 px-6 font-extrabold text-[#67D6B2]">
                      90%+ Permanent Retention
                    </td>
                    <td className="py-4 px-6 font-semibold text-white">Production Portfolio</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION */}
        <section id="faq" className="max-w-4xl mx-auto px-6 scroll-mt-24 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-[#A9B5B2] text-sm">
              Everything you need to know about the Nudge learning environment.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-[#0D1214] border border-[#202A2C] overflow-hidden transition-all"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between text-sm sm:text-base font-semibold text-white hover:text-[#67D6B2] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#71807C] transition-transform ${
                      activeFaq === idx ? "rotate-180 text-[#67D6B2]" : ""
                    }`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-6 pb-4 pt-1 text-xs sm:text-sm text-[#A9B5B2] leading-relaxed border-t border-[#202A2C] bg-[#080C0D]/50 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* BOTTOM CALL TO ACTION */}
        <section className="max-w-7xl mx-auto px-6">
          <div className="relative rounded-3xl bg-gradient-to-b from-[#11181A] to-[#080C0D] border border-[#202A2C] p-10 sm:p-16 text-center space-y-6 overflow-hidden shadow-2xl">
            <div className="relative space-y-4 max-w-2xl mx-auto">
              <NudgeLogo size="lg" className="mx-auto" withLink={false} />
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Break out of tutorial hell.
                <br />
                <span className="text-[#67D6B2]">Build real software today.</span>
              </h2>
              <p className="text-[#A9B5B2] text-sm sm:text-base leading-relaxed">
                Zero local setup. Monaco editor. Progressive Socratic AI guidance that builds lifelong engineering confidence.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href={
                    currentUser
                      ? `/project/${projects[0]?.slug || "build-auth"}`
                      : `/signup?redirect=/project/${projects[0]?.slug || "build-auth"}`
                  }
                  className="px-8 py-4 rounded-full bg-gradient-to-r from-[#67D6B2] to-[#10B981] text-[#080C0D] font-bold text-sm flex items-center gap-2 shadow-xl shadow-[#67D6B2]/25 transition-all hover:scale-105"
                >
                  <span>Start learning for free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#simulator"
                  className="px-6 py-4 rounded-full bg-[#151D1F] hover:bg-[#202A2C] text-[#F4F7F6] text-sm font-semibold border border-[#202A2C] transition-all"
                >
                  Test Socratic Mentor
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Database Modal */}
      {showDbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0D1214] border border-[#202A2C] rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#202A2C] pb-4">
              <div className="flex items-center gap-2.5">
                <Database className="h-5 w-5 text-[#67D6B2]" />
                <h3 className="text-lg font-bold text-white">Database Status</h3>
              </div>
              <button
                onClick={() => setShowDbModal(false)}
                className="p-1 rounded-lg text-[#71807C] hover:text-white hover:bg-[#151D1F] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#080C0D] border border-[#202A2C] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#71807C]">Connection Status:</span>
                  {isConnected ? (
                    <span className="text-[#67D6B2] font-semibold flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Connected &amp; Initialized
                    </span>
                  ) : (
                    <span className="text-[#F06A6A] font-semibold flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> Fallback Seed Active
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#71807C]">Database Type:</span>
                  <span className="text-white font-medium flex items-center gap-1">
                    {dbStatus?.dbType?.includes("Atlas") ? (
                      <>
                        <Cloud className="h-3.5 w-3.5 text-[#76A8FF]" /> MongoDB Atlas
                      </>
                    ) : (
                      <>
                        <Server className="h-3.5 w-3.5 text-[#67D6B2]" /> MongoDB (Local/Atlas)
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  fetchHealthAndProjects();
                  setShowDbModal(false);
                }}
                className="px-4 py-2 rounded-lg bg-[#67D6B2] text-[#080C0D] text-xs font-bold transition-all hover:opacity-90 cursor-pointer"
              >
                Close &amp; Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#080C0D] border-t border-[#202A2C] py-12 px-6 text-xs text-[#71807C]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <NudgeLogo size="sm" withLink={false} />
            <span className="text-[#202A2C]">|</span>
            <span>AI-Guided Developer Learning Platform</span>
          </div>

          <div className="flex items-center gap-6 text-[#A9B5B2] font-medium">
            <a href="#how-it-works" className="hover:text-[#67D6B2] transition-colors">
              Method
            </a>
            <a href="#projects" className="hover:text-[#67D6B2] transition-colors">
              Projects
            </a>
            <a href="#simulator" className="hover:text-[#67D6B2] transition-colors">
              AI Mentor
            </a>
            <a href="#faq" className="hover:text-[#67D6B2] transition-colors">
              FAQ
            </a>
          </div>

          <div>
            © 2026 Nudge. Built with Next.js App Router, Monaco &amp; Gemini AI.
          </div>
        </div>
      </footer>
    </div>
  );
}
