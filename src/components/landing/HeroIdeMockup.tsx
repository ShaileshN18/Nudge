"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  FileCode,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Search,
  Settings,
  GitBranch,
  File,
  X,
  Plus,
  RefreshCw,
  Lightbulb,
  Maximize2,
  Columns,
  MoreHorizontal,
  CheckCircle2,
  Sparkles,
  Play,
  Layers,
} from "lucide-react";
import NudgeLogo from "../NudgeLogo";

export default function HeroIdeMockup() {
  const [activeTab, setActiveTab] = useState<"src/models/User.js" | "src/middleware/auth.js">("src/models/User.js");
  const [isHintExpanded, setIsHintExpanded] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);

  return (
    <div className="relative w-full max-w-5xl mx-auto select-none">
      {/* Hand-drawn Doodle Arrow Annotation */}
      <div className="hidden lg:block absolute -top-16 -right-6 xl:-right-16 z-30 pointer-events-none transition-transform hover:scale-105">
        <div className="relative w-48 h-48 flex flex-col items-center">
          <Image
            src="/small-hints-arrow-transparent.png"
            alt="Small hints. Big progress."
            width={180}
            height={180}
            className="w-40 h-auto drop-shadow-[0_0_15px_rgba(103,214,178,0.3)] select-none pointer-events-none"
            priority
          />
        </div>
      </div>

      {/* Main IDE Container */}
      <div className="relative rounded-2xl bg-[#080C0D] border border-[#202A2C] shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden transition-all duration-300 hover:border-[#2A3739]">
        {/* IDE Titlebar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#0D1214] border-b border-[#202A2C]">
          {/* Traffic Lights */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block border border-[#e0443e]" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block border border-[#dea123]" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block border border-[#1aab29]" />
            <span className="ml-3 text-xs text-[#71807C] font-mono flex items-center gap-1.5">
              <span className="text-white font-semibold">nudge</span>
              <span className="text-[#4B5754]">/</span>
              <span className="text-[#A9B5B2]">build-jwt-auth</span>
            </span>
          </div>

          {/* Action pills */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#1A2428] text-[#67D6B2] border border-[#67D6B2]/30">
              Task 1 of 3: Password Hashing
            </span>
            <div className="flex items-center gap-1 text-[#71807C] text-xs ml-2">
              <Columns className="w-3.5 h-3.5" />
              <Maximize2 className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* IDE Body */}
        <div className="flex flex-col md:flex-row min-h-[460px]">
          {/* 1. Activity Bar */}
          <div className="hidden sm:flex flex-col justify-between items-center w-12 py-3 bg-[#0D1214] border-r border-[#202A2C] shrink-0">
            <div className="flex flex-col items-center gap-4">
              <button
                className="relative p-2 text-[#67D6B2] hover:text-white transition-colors"
                title="Explorer"
              >
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#67D6B2] rounded-r" />
                <FileCode className="w-5 h-5" />
              </button>
              <button className="p-2 text-[#71807C] hover:text-[#A9B5B2] transition-colors" title="Search">
                <Search className="w-4 h-4" />
              </button>
              <button className="p-2 text-[#71807C] hover:text-[#A9B5B2] transition-colors" title="Source Control">
                <GitBranch className="w-4 h-4" />
              </button>
              <button className="p-2 text-[#71807C] hover:text-[#A9B5B2] transition-colors" title="Run Evaluation">
                <Play className="w-4 h-4" />
              </button>
            </div>
            <button className="p-2 text-[#71807C] hover:text-[#A9B5B2] transition-colors" title="Settings">
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* 2. File Explorer Sidebar */}
          <div className="hidden md:flex flex-col w-52 bg-[#0D1214] border-r border-[#202A2C] text-xs shrink-0">
            <div className="flex items-center justify-between px-3 py-2 text-[#71807C] font-semibold uppercase text-[10px] tracking-wider border-b border-[#202A2C]">
              <span>Workspace Files</span>
              <div className="flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-[#71807C] hover:text-white cursor-pointer" />
                <RefreshCw className="w-3 h-3 text-[#71807C] hover:text-white cursor-pointer" />
              </div>
            </div>

            <div className="p-2 space-y-1 text-[#A9B5B2] font-mono text-[11px] overflow-y-auto">
              <div>
                <div className="flex items-center gap-1.5 px-1.5 py-1 text-white font-medium cursor-pointer">
                  <ChevronDown className="w-3.5 h-3.5 text-[#71807C]" />
                  <FolderOpen className="w-3.5 h-3.5 text-[#E9C46A]" />
                  <span>src</span>
                </div>

                <div className="pl-4 space-y-0.5 mt-0.5">
                  <div className="flex items-center gap-1.5 px-1.5 py-0.5 text-[#71807C]">
                    <ChevronDown className="w-3 h-3" />
                    <Folder className="w-3.5 h-3.5 text-[#E9C46A]" />
                    <span>models</span>
                  </div>

                  <div className="pl-4">
                    <div
                      onClick={() => setActiveTab("src/models/User.js")}
                      className={`flex items-center justify-between px-1.5 py-1 rounded cursor-pointer transition-colors ${
                        activeTab === "src/models/User.js"
                          ? "bg-[#151D1F] text-[#67D6B2] font-medium border-l-2 border-[#67D6B2]"
                          : "text-[#A9B5B2] hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-[#67D6B2]" />
                        <span>User.js</span>
                      </div>
                      <span className="text-[9px] font-bold px-1 rounded bg-[#67D6B2]/20 text-[#67D6B2]">
                        TASK
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-1.5 py-0.5 text-[#71807C]">
                    <ChevronDown className="w-3 h-3" />
                    <Folder className="w-3.5 h-3.5 text-[#E9C46A]" />
                    <span>middleware</span>
                  </div>

                  <div className="pl-4">
                    <div
                      onClick={() => setActiveTab("src/middleware/auth.js")}
                      className={`flex items-center gap-1.5 px-1.5 py-1 rounded cursor-pointer transition-colors ${
                        activeTab === "src/middleware/auth.js"
                          ? "bg-[#151D1F] text-[#67D6B2] font-medium border-l-2 border-[#67D6B2]"
                          : "text-[#A9B5B2] hover:text-white"
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5 text-[#67D6B2]" />
                      <span>auth.js</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* root files */}
              <div className="pt-2 border-t border-[#202A2C] space-y-0.5">
                <div className="flex items-center gap-1.5 px-1.5 py-0.5 text-[#71807C]">
                  <File className="w-3.5 h-3.5" />
                  <span>package.json</span>
                </div>
                <div className="flex items-center gap-1.5 px-1.5 py-0.5 text-[#71807C]">
                  <File className="w-3.5 h-3.5" />
                  <span>server.js</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Editor & Floating Nudge AI Mentor Popover */}
          <div className="flex-1 flex flex-col bg-[#080C0D] relative overflow-hidden">
            {/* Editor Tabs */}
            <div className="flex items-center bg-[#0D1214] border-b border-[#202A2C] overflow-x-auto">
              <div
                onClick={() => setActiveTab("src/models/User.js")}
                className={`flex items-center gap-2 px-4 py-2 border-r border-[#202A2C] cursor-pointer text-xs font-mono transition-colors ${
                  activeTab === "src/models/User.js"
                    ? "bg-[#080C0D] text-[#67D6B2] border-t-2 border-t-[#67D6B2]"
                    : "text-[#71807C] hover:bg-[#11181A]"
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-[#67D6B2]" />
                <span>User.js</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#67D6B2]" />
                <X className="w-3 h-3 text-[#71807C] hover:text-white ml-1" />
              </div>

              <div
                onClick={() => setActiveTab("src/middleware/auth.js")}
                className={`flex items-center gap-2 px-4 py-2 border-r border-[#202A2C] cursor-pointer text-xs font-mono transition-colors ${
                  activeTab === "src/middleware/auth.js"
                    ? "bg-[#080C0D] text-[#67D6B2] border-t-2 border-t-[#67D6B2]"
                    : "text-[#71807C] hover:bg-[#11181A]"
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-[#67D6B2]" />
                <span>auth.js</span>
                <X className="w-3 h-3 text-[#71807C] hover:text-white ml-1" />
              </div>
            </div>

            {/* Code Lines with Socratic Nudge Popover */}
            <div className="p-4 font-mono text-[13px] leading-6 overflow-x-auto relative">
              <div className="space-y-0.5">
                <div className="flex">
                  <span className="w-8 text-right pr-4 text-[#4B5754] select-none">1</span>
                  <span>
                    <span className="text-[#67D6B2]">const</span> crypto ={" "}
                    <span className="text-[#76A8FF]">require</span>(
                    <span className="text-[#E9C46A]">'crypto'</span>);
                  </span>
                </div>
                <div className="flex">
                  <span className="w-8 text-right pr-4 text-[#4B5754] select-none">2</span>
                  <span></span>
                </div>
                <div className="flex">
                  <span className="w-8 text-right pr-4 text-[#4B5754] select-none">3</span>
                  <span>
                    <span className="text-[#71807C] italic">// In-memory user store</span>
                  </span>
                </div>
                <div className="flex">
                  <span className="w-8 text-right pr-4 text-[#4B5754] select-none">4</span>
                  <span>
                    <span className="text-[#67D6B2]">const</span> users = [];
                  </span>
                </div>
                <div className="flex">
                  <span className="w-8 text-right pr-4 text-[#4B5754] select-none">5</span>
                  <span></span>
                </div>
                <div className="flex">
                  <span className="w-8 text-right pr-4 text-[#4B5754] select-none">6</span>
                  <span>
                    <span className="text-[#67D6B2]">function</span>{" "}
                    <span className="text-[#F4F7F6] font-bold">hashPassword</span>(password) {"{"}
                  </span>
                </div>

                {/* Line 7: Highlighted line for task target */}
                <div className="flex bg-[#11181A] -mx-4 px-4 border-l-2 border-[#E9C46A] py-0.5 items-center">
                  <span className="w-8 text-right pr-4 text-[#E9C46A] font-semibold select-none">7</span>
                  <span className="pl-4 text-white">
                    <span className="text-[#71807C] italic">// TODO: Task 1 - Implement secure salt & PBKDF2 hashing!</span>
                  </span>
                </div>

                <div className="flex">
                  <span className="w-8 text-right pr-4 text-[#4B5754] select-none">8</span>
                  <span className="pl-4">
                    <span className="text-[#67D6B2]">const</span> salt = crypto.
                    <span className="text-[#76A8FF]">randomBytes</span>(16).
                    <span className="text-[#76A8FF]">toString</span>(
                    <span className="text-[#E9C46A]">'hex'</span>);
                  </span>
                </div>
                <div className="flex">
                  <span className="w-8 text-right pr-4 text-[#4B5754] select-none">9</span>
                  <span className="pl-4">
                    <span className="text-[#67D6B2]">const</span> hash = crypto.
                    <span className="text-[#76A8FF]">pbkdf2Sync</span>(password, salt, 1000, 64,{" "}
                    <span className="text-[#E9C46A]">'sha512'</span>).
                    <span className="text-[#76A8FF]">toString</span>(
                    <span className="text-[#E9C46A]">'hex'</span>);
                  </span>
                </div>
                <div className="flex">
                  <span className="w-8 text-right pr-4 text-[#4B5754] select-none">10</span>
                  <span className="pl-4">
                    <span className="text-[#67D6B2]">return</span>{" "}
                    <span className="text-[#E9C46A]">{`\`\${salt}:\${hash}\``}</span>;
                  </span>
                </div>
                <div className="flex">
                  <span className="w-8 text-right pr-4 text-[#4B5754] select-none">11</span>
                  <span>{"}"}</span>
                </div>
              </div>

              {/* Floating Socratic Nudge Card */}
              {!hintDismissed && (
                <div className="absolute top-14 right-4 sm:right-6 md:right-8 z-20 w-[90%] sm:w-[320px] rounded-xl bg-[#0D1214] border border-[#E9C46A]/40 p-4 shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#202A2C]">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-[#E9C46A]" />
                      <span className="text-xs font-bold text-white tracking-wide">
                        Nudge • Level 2
                      </span>
                    </div>
                    <button
                      onClick={() => setHintDismissed(true)}
                      className="text-[#71807C] hover:text-white transition-colors"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="py-3 space-y-3">
                    <p className="text-xs text-[#F4F7F6] leading-relaxed font-sans">
                      Remember to format your return value as a combined string with a colon separator.
                    </p>

                    <div
                      onClick={() => setIsHintExpanded(!isHintExpanded)}
                      className="rounded-lg bg-[#11181A] border border-[#202A2C] p-2.5 cursor-pointer hover:border-[#67D6B2]/40 transition-all group"
                    >
                      <div className="flex items-center justify-between text-xs font-medium text-[#67D6B2]">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#67D6B2]" />
                          <span>Why a colon separator?</span>
                        </span>
                        <ChevronRight
                          className={`w-3.5 h-3.5 text-[#71807C] transition-transform ${
                            isHintExpanded ? "rotate-90 text-[#67D6B2]" : "group-hover:translate-x-0.5"
                          }`}
                        />
                      </div>

                      {isHintExpanded && (
                        <div className="mt-2 pt-2 border-t border-[#202A2C] text-[11px] text-[#A9B5B2] space-y-1 font-sans animate-in fade-in duration-200">
                          <p>
                            In <code className="text-[#67D6B2] font-mono">comparePassword</code>, you can simply do <code className="text-[#E9C46A] font-mono">storedHash.split(':')</code> to cleanly retrieve the salt for re-hashing candidate passwords.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {hintDismissed && (
                <button
                  onClick={() => setHintDismissed(false)}
                  className="absolute top-14 right-6 z-20 px-3 py-1.5 rounded-lg bg-[#11181A] border border-[#E9C46A]/40 text-xs text-[#E9C46A] flex items-center gap-1.5 shadow-lg hover:bg-[#151D1F] transition-all cursor-pointer"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Show Socratic Nudge</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
