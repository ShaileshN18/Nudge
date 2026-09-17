"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Lightbulb,
  HelpCircle,
  Compass,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Terminal,
  Code2,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { NudgeLogoMark } from "../NudgeLogo";

interface Scenario {
  id: string;
  category: string;
  title: string;
  codeSnippet: string;
  file: string;
  testFailReason: string;
  level1Observation: string;
  level2SocraticQuestion: string;
  level3ActionableHint: string;
  solutionOutcome: string;
}

const scenarios: Scenario[] = [
  {
    id: "auth-hashing",
    category: "Backend Security",
    title: "Preventing Plaintext Password Storage",
    file: "src/models/User.js",
    codeSnippet: `// Learner's initial implementation
async function registerUser(email, password) {
  const existing = await User.findOne({ email });
  if (existing) throw new Error("Email in use");

  // Bug: Saving raw password to database!
  const user = await User.create({
    email,
    passwordHash: password 
  });
  return user;
}`,
    testFailReason: "Assertion Failed: User record in database should not match plaintext password",
    level1Observation:
      "Your registration test fails assertion #4. Inspect line 8: you are persisting the raw password directly into the database without cryptographic hashing.",
    level2SocraticQuestion:
      "Why is saving raw passwords risky even in a secured DB? What one-way cryptographic hashing function with salt rounds should be applied first?",
    level3ActionableHint:
      "Use bcryptjs with 10 salt rounds: await bcrypt.hash(password, 10). Then store the computed hash string in passwordHash.",
    solutionOutcome: "User passwords securely hashed with bcrypt. 100% test pass rate.",
  },
  {
    id: "state-mutation",
    category: "Fullstack / React",
    title: "Safe State Updates in React 19",
    file: "src/components/TodoList.jsx",
    codeSnippet: `// Learner's implementation
function handleToggle(id) {
  // Bug: Mutating state directly causes re-render bugs
  const item = todos.find(t => t.id === id);
  item.completed = !item.completed;
  setTodos(todos);
}`,
    testFailReason: "Assertion Failed: Component did not re-render when item status updated",
    level1Observation:
      "React relies on reference equality to trigger re-renders. Modifying item.completed mutates the existing array in-place.",
    level2SocraticQuestion:
      "If todos keeps the same memory reference, how can React detect that anything changed? How can you create a shallow copy with the updated item?",
    level3ActionableHint:
      "Use todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t) to produce a new array reference for setTodos.",
    solutionOutcome: "State immutability preserved. React renders instantly without stale closures.",
  },
  {
    id: "mongo-race-condition",
    category: "Database & Express",
    title: "Atomic Upvote Counter Without Race Conditions",
    file: "src/routes/feedback.js",
    codeSnippet: `// Learner's implementation
router.post("/:id/upvote", async (req, res) => {
  const item = await Feedback.findById(req.params.id);
  // Bug: Read-modify-write causes lost updates under concurrent load
  item.upvotes = item.upvotes + 1;
  await item.save();
  res.json(item);
});`,
    testFailReason: "Concurrency Test Failed: 50 parallel upvotes resulted in only 32 registered counts",
    level1Observation:
      "Multiple concurrent requests are fetching the same initial upvote count before writing back, causing lost updates.",
    level2SocraticQuestion:
      "How can MongoDB modify the field directly on the server without first pulling the document into memory?",
    level3ActionableHint:
      "Use Mongoose's atomic operator: Feedback.findByIdAndUpdate(req.params.id, { $inc: { upvotes: 1 } }, { new: true }).",
    solutionOutcome: "Atomic $inc handles concurrent bursts with zero lost writes.",
  },
];

export default function AiMentorSimulator() {
  const [activeScenarioId, setActiveScenarioId] = useState<string>(scenarios[0].id);
  const [activeHintLevel, setActiveHintLevel] = useState<1 | 2 | 3>(1);

  const scenario = scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];

  return (
    <div className="w-full max-w-6xl mx-auto rounded-3xl bg-gradient-to-b from-[#0e141c] to-[#090d13] border border-[#1b2533] p-6 sm:p-10 shadow-2xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#5eead4]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#17202c]">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#12222a] border border-[#23424d] text-[#5eead4] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive AI Mentor Simulation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            See How the Nudge AI Mentor Helps You <span className="text-[#5eead4]">Think</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Other tools dump code that robs you of the learning experience. Nudge observes your terminal errors and code structure, then dispenses progressive hints like an experienced senior engineer sitting beside you.
          </p>
        </div>

        {/* Scenario Selector Pills */}
        <div className="flex flex-wrap gap-2">
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setActiveScenarioId(s.id);
                setActiveHintLevel(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                activeScenarioId === s.id
                  ? "bg-[#5eead4] text-[#061414] font-bold shadow-lg shadow-[#5eead4]/20"
                  : "bg-[#121924] text-slate-400 hover:text-white border border-[#1b2533]"
              }`}
            >
              {s.category}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Arena */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Code Editor & Terminal Test Failure (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl bg-[#090d14] border border-[#1b2533] overflow-hidden shadow-xl">
            {/* Editor File Tab */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#0b1017] border-b border-[#17202c] text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#5eead4]" />
                <span className="text-slate-200 font-semibold">{scenario.file}</span>
                <span className="text-slate-500">• {scenario.title}</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-sans font-semibold">
                Test Failing
              </span>
            </div>

            {/* Code Body */}
            <div className="p-4 font-mono text-xs sm:text-[13px] leading-6 text-slate-300 overflow-x-auto bg-[#070a10]">
              <pre>
                <code>{scenario.codeSnippet}</code>
              </pre>
            </div>

            {/* Terminal Runner Output */}
            <div className="border-t border-[#1a232f] bg-[#05080c] p-3.5 font-mono text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                <span>WebContainer Automated Test Assertion:</span>
              </div>
              <p className="text-rose-400 font-medium flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{scenario.testFailReason}</span>
              </p>
            </div>
          </div>

          {/* Quick Comparison Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/30 text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
                <XCircle className="w-3.5 h-3.5" />
                <span>ChatGPT / Copilot Approach</span>
              </div>
              <p className="text-slate-400">
                Rewrites all the code for you. You copy-paste, retain 0% conceptual mastery, and get stuck on the very next feature.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#5eead4]/10 border border-[#5eead4]/30 text-xs text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 text-[#5eead4] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>The Nudge Progressive Approach</span>
              </div>
              <p className="text-slate-400">
                Pinpoints the exact mental hurdle, poses the right question, and trains your engineering instinct so you retain knowledge forever.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Progressive Hint Ladder (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0c131d] border border-[#202e40] space-y-6 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#182332] pb-4">
              <div className="flex items-center gap-2.5">
                <NudgeLogoMark size={22} />
                <div>
                  <h3 className="text-sm font-bold text-white">Nudge AI Mentor</h3>
                  <span className="text-[11px] text-[#5eead4] font-mono">Progressive Socratic Engine</span>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-[#141e2b] px-2 py-0.5 rounded border border-[#1e2c3e]">
                Tier {activeHintLevel} of 3
              </span>
            </div>

            {/* Level Selector Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setActiveHintLevel(1)}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  activeHintLevel === 1
                    ? "bg-[#5eead4] text-[#061414] shadow-md shadow-[#5eead4]/25"
                    : "bg-[#141f2c] text-slate-400 hover:text-slate-200 border border-[#1b293a]"
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Level 1: Observe</span>
              </button>

              <button
                onClick={() => setActiveHintLevel(2)}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  activeHintLevel === 2
                    ? "bg-[#5eead4] text-[#061414] shadow-md shadow-[#5eead4]/25"
                    : "bg-[#141f2c] text-slate-400 hover:text-slate-200 border border-[#1b293a]"
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Level 2: Socratic</span>
              </button>

              <button
                onClick={() => setActiveHintLevel(3)}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  activeHintLevel === 3
                    ? "bg-[#5eead4] text-[#061414] shadow-md shadow-[#5eead4]/25"
                    : "bg-[#141f2c] text-slate-400 hover:text-slate-200 border border-[#1b293a]"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Level 3: Direct</span>
              </button>
            </div>

            {/* Current Hint Card */}
            <div className="p-4 rounded-xl bg-[#101824] border border-[#1c2a3d] space-y-3 min-h-[160px] flex flex-col justify-center animate-in fade-in duration-300">
              {activeHintLevel === 1 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#5eead4] uppercase tracking-wider">
                    <Lightbulb className="w-4 h-4" />
                    <span>Level 1: Contextual Observation</span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed font-sans">
                    {scenario.level1Observation}
                  </p>
                  <p className="text-xs text-slate-400 pt-1 italic">
                    Nudge highlights what went wrong without touching your code or giving the answer away.
                  </p>
                </div>
              )}

              {activeHintLevel === 2 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#38bdf8] uppercase tracking-wider">
                    <HelpCircle className="w-4 h-4" />
                    <span>Level 2: Socratic Inquiry</span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed font-sans">
                    "{scenario.level2SocraticQuestion}"
                  </p>
                  <p className="text-xs text-slate-400 pt-1 italic">
                    Prompts you to reflect on core engineering principles so the solution clicks in your head.
                  </p>
                </div>
              )}

              {activeHintLevel === 3 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
                    <Compass className="w-4 h-4" />
                    <span>Level 3: Actionable Direction</span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed font-sans">
                    {scenario.level3ActionableHint}
                  </p>
                  <p className="text-xs text-slate-400 pt-1 italic">
                    Points to the specific library method or architecture pattern while you still write the actual implementation.
                  </p>
                </div>
              )}
            </div>

            {/* Target Outcome */}
            <div className="p-3.5 rounded-xl bg-[#091018] border border-[#192534] flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#5eead4] shrink-0" />
              <div className="text-xs text-slate-300">
                <span className="font-semibold text-white block">Learning Retained:</span>
                <span className="text-slate-400">{scenario.solutionOutcome}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
