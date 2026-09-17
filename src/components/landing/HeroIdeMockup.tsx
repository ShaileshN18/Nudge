"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  FileCode2,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Terminal as TerminalIcon,
  Play,
  Settings,
  Search,
  GitBranch,
  File,
  X,
  Plus,
  RefreshCw,
  Lightbulb,
  Maximize2,
  Columns,
  MoreHorizontal,
  Bell,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { NudgeLogoMark } from "../NudgeLogo";

export default function HeroIdeMockup() {
  const [activeTab, setActiveTab] = useState<"index.jsx" | "TodoForm.jsx">("index.jsx");
  const [isHintExpanded, setIsHintExpanded] = useState(false);
  const [activeTerminalTab, setActiveTerminalTab] = useState<"terminal" | "problems" | "output">("terminal");
  const [hintDismissed, setHintDismissed] = useState(false);

  return (
    <div className="relative w-full max-w-5xl mx-auto select-none">
      {/* Hand-drawn Doodle Arrow Annotation from Image 2 */}
      <div className="hidden lg:block absolute -top-16 -right-6 xl:-right-16 z-30 pointer-events-none transition-transform hover:scale-105">
        <div className="relative w-48 h-48 flex flex-col items-center">
          <Image
            src="/small-hints-arrow-transparent.png"
            alt="Small hints. Big progress."
            width={180}
            height={180}
            className="w-40 h-auto drop-shadow-[0_0_15px_rgba(94,234,212,0.3)] select-none pointer-events-none"
            priority
          />
        </div>
      </div>

      {/* Main IDE Container matching Image 1 & Image 3 */}
      <div className="relative rounded-2xl bg-[#090d12] border border-[#1b2533] shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden transition-all duration-300 hover:border-[#2b3a4e]">
        {/* IDE Titlebar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#0a0f16] border-b border-[#17202c]">
          {/* macOS Traffic Lights */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block border border-[#e0443e]" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block border border-[#dea123]" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block border border-[#1aab29]" />
            <span className="ml-3 text-xs text-slate-400 font-mono flex items-center gap-1.5">
              <span className="text-white font-semibold">nudge</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-400">project</span>
            </span>
          </div>

          {/* Titlebar Window Controls */}
          <div className="flex items-center gap-3 text-slate-400 text-xs">
            <button className="hover:text-slate-200 transition-colors">
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button className="hover:text-slate-200 transition-colors">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button className="hover:text-slate-200 transition-colors">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* IDE Body */}
        <div className="flex flex-col md:flex-row min-h-[500px]">
          {/* 1. Activity Bar */}
          <div className="hidden sm:flex flex-col justify-between items-center w-12 py-3 bg-[#080c10] border-r border-[#151c26] shrink-0">
            <div className="flex flex-col items-center gap-4">
              <button
                className="relative p-2 text-[#5eead4] hover:text-white transition-colors"
                title="Explorer"
              >
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#5eead4] rounded-r" />
                <FileCode2 className="w-5 h-5" />
              </button>
              <button className="p-2 text-slate-500 hover:text-slate-300 transition-colors" title="Search">
                <Search className="w-4 h-4" />
              </button>
              <button className="p-2 text-slate-500 hover:text-slate-300 transition-colors" title="Source Control">
                <GitBranch className="w-4 h-4" />
              </button>
              <button className="p-2 text-slate-500 hover:text-slate-300 transition-colors" title="Run & Debug">
                <Play className="w-4 h-4" />
              </button>
            </div>
            <button className="p-2 text-slate-500 hover:text-slate-300 transition-colors" title="Settings">
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* 2. File Explorer Sidebar */}
          <div className="hidden md:flex flex-col w-56 bg-[#080c11] border-r border-[#151c26] text-xs shrink-0">
            <div className="flex items-center justify-between px-3 py-2 text-slate-400 font-semibold uppercase text-[11px] tracking-wider border-b border-[#141b24]">
              <span>Files</span>
              <div className="flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-pointer" />
                <RefreshCw className="w-3 h-3 text-slate-500 hover:text-slate-300 cursor-pointer" />
              </div>
            </div>

            <div className="p-2 space-y-1 text-slate-400 font-mono text-[12px] overflow-y-auto">
              {/* task-manager folder */}
              <div>
                <div className="flex items-center gap-1.5 px-1.5 py-1 text-slate-300 font-medium cursor-pointer">
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>task-manager</span>
                </div>

                <div className="pl-4 space-y-0.5 mt-0.5">
                  {/* src */}
                  <div className="flex items-center gap-1.5 px-1.5 py-1 text-slate-300 cursor-pointer">
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>src</span>
                  </div>

                  <div className="pl-4 space-y-0.5">
                    {/* components */}
                    <div className="flex items-center gap-1.5 px-1.5 py-1 text-slate-400">
                      <ChevronDown className="w-3 h-3 text-slate-500" />
                      <Folder className="w-3.5 h-3.5 text-slate-500" />
                      <span>components</span>
                    </div>
                    <div className="pl-4 space-y-0.5">
                      <div
                        onClick={() => setActiveTab("TodoForm.jsx")}
                        className={`flex items-center gap-1.5 px-1.5 py-1 rounded cursor-pointer transition-colors ${
                          activeTab === "TodoForm.jsx" ? "bg-[#141d28] text-white" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <span className="text-[#38bdf8]">⚛</span>
                        <span>TodoForm.jsx</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-1.5 py-1 text-slate-400 hover:text-slate-200 cursor-pointer">
                        <span className="text-[#38bdf8]">⚛</span>
                        <span>TodoItem.jsx</span>
                      </div>
                    </div>

                    {/* pages */}
                    <div className="flex items-center gap-1.5 px-1.5 py-1 text-slate-400">
                      <ChevronDown className="w-3 h-3 text-slate-500" />
                      <Folder className="w-3.5 h-3.5 text-slate-500" />
                      <span>pages</span>
                    </div>
                    <div className="pl-4">
                      <div
                        onClick={() => setActiveTab("index.jsx")}
                        className={`flex items-center gap-1.5 px-1.5 py-1 rounded cursor-pointer transition-colors ${
                          activeTab === "index.jsx"
                            ? "bg-[#14232c] text-[#5eead4] font-medium border-l-2 border-[#5eead4]"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <span className="text-[#5eead4]">⚛</span>
                        <span>index.jsx</span>
                      </div>
                    </div>

                    {/* utils */}
                    <div className="flex items-center gap-1.5 px-1.5 py-1 text-slate-400">
                      <ChevronRight className="w-3 h-3 text-slate-500" />
                      <Folder className="w-3.5 h-3.5 text-slate-500" />
                      <span>utils</span>
                    </div>
                  </div>

                  {/* other files */}
                  <div className="flex items-center gap-1.5 px-1.5 py-0.5 text-slate-500 hover:text-slate-300">
                    <span className="text-amber-400 text-xs">JS</span>
                    <span>App.jsx</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-1.5 py-0.5 text-slate-500 hover:text-slate-300">
                    <span className="text-amber-400 text-xs">JS</span>
                    <span>main.jsx</span>
                  </div>
                </div>
              </div>

              {/* root files */}
              <div className="pt-2 border-t border-[#131a22] space-y-0.5">
                <div className="flex items-center gap-1.5 px-1.5 py-0.5 text-slate-500">
                  <Folder className="w-3.5 h-3.5 text-slate-600" />
                  <span>public</span>
                </div>
                <div className="flex items-center gap-1.5 px-1.5 py-0.5 text-slate-500">
                  <span className="text-emerald-500 font-bold text-[10px]">JSON</span>
                  <span>package.json</span>
                </div>
                <div className="flex items-center gap-1.5 px-1.5 py-0.5 text-slate-500">
                  <File className="w-3.5 h-3.5 text-slate-600" />
                  <span>README.md</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Editor & Floating Nudge AI Mentor Card */}
          <div className="flex-1 flex flex-col bg-[#090d13] relative overflow-hidden">
            {/* Editor Tabs */}
            <div className="flex items-center bg-[#070b10] border-b border-[#161f2a] overflow-x-auto">
              <div
                onClick={() => setActiveTab("index.jsx")}
                className={`flex items-center gap-2 px-4 py-2 border-r border-[#161f2a] cursor-pointer text-xs font-mono transition-colors ${
                  activeTab === "index.jsx"
                    ? "bg-[#090d13] text-[#5eead4] border-t-2 border-t-[#5eead4]"
                    : "text-slate-400 hover:bg-[#0d1219]"
                }`}
              >
                <span className="text-[#5eead4]">⚛</span>
                <span>index.jsx</span>
                <X className="w-3 h-3 text-slate-500 hover:text-slate-300 ml-1" />
              </div>

              <div
                onClick={() => setActiveTab("TodoForm.jsx")}
                className={`flex items-center gap-2 px-4 py-2 border-r border-[#161f2a] cursor-pointer text-xs font-mono transition-colors ${
                  activeTab === "TodoForm.jsx"
                    ? "bg-[#090d13] text-[#5eead4] border-t-2 border-t-[#5eead4]"
                    : "text-slate-400 hover:bg-[#0d1219]"
                }`}
              >
                <span className="text-[#38bdf8]">⚛</span>
                <span>TodoForm.jsx</span>
                <X className="w-3 h-3 text-slate-500 hover:text-slate-300 ml-1" />
              </div>

              <button className="px-2.5 py-2 text-slate-500 hover:text-slate-300 transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Code Lines with Line 8 Highlight */}
            <div className="p-4 font-mono text-[13px] leading-6 overflow-x-auto relative">
              <div className="space-y-0.5">
                <div className="flex">
                  <span className="w-8 text-right pr-4 text-slate-600 select-none">1</span>
                  <span>
                    <span className="text-[#ec4899]">import</span>{" "}
                    <span className="text-slate-200">{"{ useState }"}</span>{" "}
                    <span className="text-[#ec4899]">from</span>{" "}
                    <span className="text-[#38bdf8]">'react'</span>
                  </span>
                </div>
                <div className="flex">
                  <span className="w-8 text-right pr-4 text-slate-600 select-none">2</span>
                  <span></span>
                </div>
                <div className="flex">
                  <span className="w-8 text-right pr-4 text-slate-600 select-none">3</span>
                  <span>
                    <span className="text-[#ec4899]">export default function</span>{" "}
                    <span className="text-[#60a5fa]">Home</span>() {"{"}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-8 text-right pr-4 text-slate-600 select-none">4</span>
                  <span className="pl-4">
                    <span className="text-[#ec4899]">const</span> [todos, setTodos] ={" "}
                    <span className="text-[#60a5fa]">useState</span>([])
                  </span>
                </div>
                <div className="flex">
                  <span className="w-8 text-right pr-4 text-slate-600 select-none">5</span>
                  <span className="pl-4">
                    <span className="text-[#ec4899]">const</span> [input, setInput] ={" "}
                    <span className="text-[#60a5fa]">useState</span>(
                    <span className="text-[#38bdf8]">''</span>)
                  </span>
                </div>
                <div className="flex">
                  <span className="w-8 text-right pr-4 text-slate-600 select-none">6</span>
                  <span></span>
                </div>
                <div className="flex">
                  <span className="w-8 text-right pr-4 text-slate-600 select-none">7</span>
                  <span className="pl-4">
                    <span className="text-[#ec4899]">const</span>{" "}
                    <span className="text-[#60a5fa]">addTodo</span> = () =&gt; {"{"}
                  </span>
                </div>

                {/* Line 8: Highlighted line where AI mentor detected missing validation */}
                <div className="flex bg-[#122338]/90 -mx-4 px-4 border-l-2 border-[#38bdf8] py-0.5 items-center">
                  <span className="w-8 text-right pr-4 text-slate-400 font-semibold select-none">8</span>
                  <span className="pl-4 text-slate-100 font-semibold">
                    <span className="text-[#ec4899]">if</span> (!input.
                    <span className="text-[#60a5fa]">trim</span>()) return
                  </span>
                </div>

                <div className="flex">
                  <span className="w-8 text-right pr-4 text-slate-600 select-none">9</span>
                  <span className="pl-6">
                    setTodos([...todos, {"{"} id: Date.now(), text: input {"}"}])
                  </span>
                </div>
                <div className="flex">
                  <span className="w-8 text-right pr-4 text-slate-600 select-none">10</span>
                  <span className="pl-6">
                    setInput(<span className="text-[#38bdf8]">''</span>)
                  </span>
                </div>
                <div className="flex">
                  <span className="w-8 text-right pr-4 text-slate-600 select-none">11</span>
                  <span className="pl-4">{"}"}</span>
                </div>
                <div className="flex">
                  <span className="w-8 text-right pr-4 text-slate-600 select-none">12</span>
                  <span></span>
                </div>
                <div className="flex">
                  <span className="w-8 text-right pr-4 text-slate-600 select-none">13</span>
                  <span className="pl-4">
                    <span className="text-[#ec4899]">return</span> (
                  </span>
                </div>
                <div className="flex">
                  <span className="w-8 text-right pr-4 text-slate-600 select-none">14</span>
                  <span className="pl-6">
                    &lt;<span className="text-[#ec4899]">div</span>{" "}
                    <span className="text-[#60a5fa]">className</span>=
                    <span className="text-[#38bdf8]">"max-w-xl mx-auto p-6"</span>&gt;
                  </span>
                </div>
                <div className="flex">
                  <span className="w-8 text-right pr-4 text-slate-600 select-none">15</span>
                  <span className="pl-8">
                    &lt;<span className="text-[#ec4899]">h1</span>{" "}
                    <span className="text-[#60a5fa]">className</span>=
                    <span className="text-[#38bdf8]">"text-2xl font-semibold mb-4"</span>&gt;My Tasks&lt;/
                    <span className="text-[#ec4899]">h1</span>&gt;
                  </span>
                </div>
                <div className="flex">
                  <span className="w-8 text-right pr-4 text-slate-600 select-none">16</span>
                  <span className="pl-8">
                    &lt;<span className="text-[#2dd4bf]">TodoForm</span> input=
                    {"{input}"} setInput={"{setInput}"} onAdd=
                    {"{addTodo}"} /&gt;
                  </span>
                </div>
                <div className="flex">
                  <span className="w-8 text-right pr-4 text-slate-600 select-none">17</span>
                  <span className="pl-6">
                    &lt;/<span className="text-[#ec4899]">div</span>&gt;
                  </span>
                </div>
                <div className="flex">
                  <span className="w-8 text-right pr-4 text-slate-600 select-none">18</span>
                  <span className="pl-4">)</span>
                </div>
                <div className="flex">
                  <span className="w-8 text-right pr-4 text-slate-600 select-none">19</span>
                  <span>{"}"}</span>
                </div>
              </div>

              {/* Floating Nudge AI Mentor Popover docked near Line 8 (Matching Image 1 & Image 3) */}
              {!hintDismissed && (
                <div className="absolute top-16 right-4 sm:right-6 md:right-8 z-20 w-[90%] sm:w-[320px] rounded-xl bg-[#0e1620] border border-[#223348] p-4 shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#1b2838]">
                    <div className="flex items-center gap-2">
                      <NudgeLogoMark size={16} />
                      <span className="text-xs font-bold text-white tracking-wide">Nudge</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#172332] text-slate-400 border border-[#24354b]">
                        ESC
                      </span>
                      <button
                        onClick={() => setHintDismissed(true)}
                        className="text-slate-400 hover:text-white transition-colors"
                        title="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Body - Guided Observation */}
                  <div className="py-3 space-y-3">
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      It looks like you're not handling empty input. Try checking if the input is empty before adding a todo.
                    </p>

                    {/* Interactive "Think about it" card */}
                    <div
                      onClick={() => setIsHintExpanded(!isHintExpanded)}
                      className="rounded-lg bg-[#14202d] border border-[#203248] p-2.5 cursor-pointer hover:border-[#38bdf8]/60 transition-all group"
                    >
                      <div className="flex items-center justify-between text-xs font-medium text-[#5eead4]">
                        <span className="flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-[#5eead4] animate-pulse" />
                          <span>Think about it</span>
                        </span>
                        <ChevronRight
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                            isHintExpanded ? "rotate-90 text-[#5eead4]" : "group-hover:translate-x-0.5"
                          }`}
                        />
                      </div>

                      <p className="text-[11px] text-slate-400 font-sans mt-1.5 leading-snug">
                        What condition would prevent adding a todo when the input has no content?
                      </p>

                      {isHintExpanded && (
                        <div className="mt-2.5 pt-2.5 border-t border-[#1e2f42] text-[11px] text-slate-300 space-y-1.5 font-sans animate-in fade-in duration-200">
                          <div className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#5eead4] shrink-0 mt-0.5" />
                            <span>
                              <strong>Progressive Clue:</strong> Look at JavaScript's{" "}
                              <code className="px-1 py-0.2 rounded bg-[#090d13] text-[#38bdf8] font-mono">
                                .trim()
                              </code>{" "}
                              method to eliminate whitespace before checking length.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {hintDismissed && (
                <button
                  onClick={() => setHintDismissed(false)}
                  className="absolute top-16 right-6 z-20 px-3 py-1.5 rounded-lg bg-[#0e1620] border border-[#223348] text-xs text-[#5eead4] flex items-center gap-1.5 shadow-lg hover:border-[#5eead4] transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Show Nudge Hint</span>
                </button>
              )}
            </div>

            {/* 4. Integrated Bottom Panel / Terminal */}
            <div className="mt-auto border-t border-[#17212e] bg-[#070b10]">
              {/* Terminal Tabs */}
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#141b24] text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTerminalTab("terminal")}
                    className={`pb-0.5 transition-colors ${
                      activeTerminalTab === "terminal"
                        ? "text-[#5eead4] font-semibold border-b-2 border-[#5eead4]"
                        : "hover:text-slate-200"
                    }`}
                  >
                    Terminal
                  </button>
                  <button
                    onClick={() => setActiveTerminalTab("problems")}
                    className={`pb-0.5 transition-colors ${
                      activeTerminalTab === "problems"
                        ? "text-[#5eead4] font-semibold border-b-2 border-[#5eead4]"
                        : "hover:text-slate-200"
                    }`}
                  >
                    Problems
                  </button>
                  <button
                    onClick={() => setActiveTerminalTab("output")}
                    className={`pb-0.5 transition-colors ${
                      activeTerminalTab === "output"
                        ? "text-[#5eead4] font-semibold border-b-2 border-[#5eead4]"
                        : "hover:text-slate-200"
                    }`}
                  >
                    Output
                  </button>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Plus className="w-3 h-3 hover:text-slate-300 cursor-pointer" />
                  <X className="w-3 h-3 hover:text-slate-300 cursor-pointer" />
                </div>
              </div>

              {/* Terminal Body */}
              <div className="p-3 font-mono text-[12px] text-slate-300 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[#34d399] font-bold">&gt;</span>
                  <span className="text-slate-200">npm run dev</span>
                </div>
                <div className="text-slate-400">
                  <span className="text-[#38bdf8] font-bold">Vite v5.0.0</span>{" "}
                  <span className="text-slate-500">ready in</span>{" "}
                  <span className="text-[#34d399]">300ms</span>
                </div>
                <div className="text-slate-400 flex items-center gap-2">
                  <span className="text-[#34d399]">➜</span>
                  <span>Local:</span>
                  <span className="text-[#5eead4] underline cursor-pointer">http://localhost:5173</span>
                </div>
                <div className="text-slate-500">
                  <span className="text-slate-600">➜</span> press h + enter to show help
                </div>
              </div>

              {/* Bottom Status Bar */}
              <div className="flex items-center justify-between px-3 py-1 bg-[#06090d] border-t border-[#131922] text-[10px] font-mono text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-slate-400">
                    <GitBranch className="w-2.5 h-2.5" />
                    <span>main</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>0</span>
                  </span>
                  <span>0 errors, 0 warnings</span>
                </div>

                <div className="flex items-center gap-3 text-slate-400">
                  <span>Ln 8, Col 5</span>
                  <span>Spaces: 2</span>
                  <span>UTF-8</span>
                  <span>JSX</span>
                  <Bell className="w-2.5 h-2.5 hover:text-slate-200 cursor-pointer" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
