"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Lightbulb,
  HelpCircle,
  Compass,
  CheckCircle2,
  XCircle,
  FileCode,
  Code2,
  ShieldCheck,
  Zap,
  Terminal,
} from "lucide-react";
import NudgeLogo from "../NudgeLogo";

interface Scenario {
  id: string;
  category: string;
  title: string;
  codeSnippet: string;
  file: string;
  evalFailReason: string;
  level1Spark: string;
  level2Pointer: string;
  level3Diagnostic: string;
  level4Algorithm: string;
  level5CodeHint: string;
  solutionOutcome: string;
}

const scenarios: Scenario[] = [
  {
    id: "auth-hashing",
    category: "Backend Security",
    title: "Salted Password Hashing in User Model",
    file: "src/models/User.js",
    codeSnippet: `// Learner's initial implementation
function hashPassword(password) {
  // Bug: Storing plaintext password directly!
  return password;
}

function comparePassword(password, storedHash) {
  return password === storedHash;
}`,
    evalFailReason: "Criterion Failed: hashPassword must generate a unique cryptographic salt and return formatted salt:hash string",
    level1Spark:
      "Why is plain string storage or unsalted hashing vulnerable to rainbow table attacks? What purpose does generating a random salt serve before hashing?",
    level2Pointer:
      "Inspect `src/models/User.js` inside `hashPassword` and `comparePassword`. You need Node's built-in `crypto` module.",
    level3Diagnostic:
      "Your `hashPassword` function currently returns the plain password string. It must generate a 16-byte random salt using `crypto.randomBytes(16).toString('hex')` and hash with `crypto.pbkdf2Sync`.",
    level4Algorithm:
      "1. Generate salt: crypto.randomBytes(16).toString('hex')\n2. Hash password: crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')\n3. Return `${salt}:${hash}`\n4. In comparePassword, split stored string by ':' and recalculate hash with the extracted salt.",
    level5CodeHint:
      "const salt = crypto.randomBytes(16).toString('hex');\nconst hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');\nreturn `${salt}:${hash}`;",
    solutionOutcome: "Cryptographic PBKDF2 salt-based hashing implemented. All acceptance criteria verified statically.",
  },
  {
    id: "express-jwt-middleware",
    category: "API & Express",
    title: "Bearer Token Authentication Middleware",
    file: "src/middleware/auth.js",
    codeSnippet: `// Learner's implementation
function authMiddleware(req, res, next) {
  // Bug: Not extracting Bearer header or attaching req.user
  next();
}`,
    evalFailReason: "Criterion Failed: Must reject requests missing Bearer authorization header with 401 Unauthorized",
    level1Spark:
      "How do REST APIs authenticate stateless HTTP requests? Where does the client pass their JWT access token in standard HTTP requests?",
    level2Pointer:
      "Open `src/middleware/auth.js`. Inspect how `req.headers['authorization']` is read and validated before calling `next()`.",
    level3Diagnostic:
      "Currently the middleware calls `next()` unconditionally. If the `Authorization` header is missing or does not start with `Bearer `, you must return HTTP 401 Unauthorized immediately.",
    level4Algorithm:
      "1. Extract authHeader from req.headers['authorization']\n2. Check if authHeader starts with 'Bearer '\n3. If missing or invalid format, return res.status(401).json({ error: '...' })\n4. Extract token string and verify with verifyToken(token)\n5. Attach payload to req.user and call next()",
    level5CodeHint:
      "const token = authHeader.split(' ')[1];\nconst decoded = verifyToken(token);\nreq.user = decoded;\nnext();",
    solutionOutcome: "Private API endpoints secured with Bearer JWT verification and 401 status guards.",
  },
  {
    id: "mongo-atomic-upvote",
    category: "Fullstack / DB",
    title: "Atomic Upvote Counter in Feedback Board",
    file: "backend/src/feedback.js",
    codeSnippet: `// Learner's implementation
router.post("/:id/upvote", async (req, res) => {
  // Incomplete handler
  res.status(501).json({ message: "Not implemented" });
});`,
    evalFailReason: "Criterion Failed: POST /api/feedback/:id/upvote must increment votes field and return 200 with updated document",
    level1Spark:
      "When incrementing a counter on a document, what Mongoose query method allows updating the record directly in the database?",
    level2Pointer:
      "Look at `backend/src/feedback.js` at the `/:id/upvote` route handler. Extract `req.params.id`.",
    level3Diagnostic:
      "The endpoint currently responds with status 501. It must locate the feedback item by ID, increment the `votes` counter, handle 404 if not found, and respond with status 200.",
    level4Algorithm:
      "1. Extract id from req.params.id\n2. Use Feedback.findByIdAndUpdate(id, { $inc: { votes: 1 } }, { new: true })\n3. If item is null, return res.status(404).json({ error: 'Item not found' })\n4. Return res.status(200).json(updatedItem)",
    level5CodeHint:
      "const item = await Feedback.findByIdAndUpdate(req.params.id, { $inc: { votes: 1 } });\nif (!item) return res.status(404).json({ error: 'Not found' });\nreturn res.status(200).json(item);",
    solutionOutcome: "Atomic $inc upvote route handler verified statically with 404 error handling.",
  },
];

export default function AiMentorSimulator() {
  const [activeScenarioId, setActiveScenarioId] = useState<string>(scenarios[0].id);
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3 | 4 | 5>(1);

  const scenario = scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];

  const levelNames = {
    1: "Conceptual Spark",
    2: "Location Pointer",
    3: "Diagnostic Clarity",
    4: "Algorithmic Outline",
    5: "Targeted Code Hint",
  };

  const getLevelContent = () => {
    switch (activeLevel) {
      case 1:
        return {
          title: "Level 1: Conceptual Spark",
          text: scenario.level1Spark,
          badge: "Socratic Orientation",
          sub: "Nudge asks thought-provoking questions to help you formulate the correct mental model.",
        };
      case 2:
        return {
          title: "Level 2: Location Pointer",
          text: scenario.level2Pointer,
          badge: "Scope & Target Area",
          sub: "Pinpoints the exact file, model, or route handler without leaking the solution.",
        };
      case 3:
        return {
          title: "Level 3: Diagnostic Clarity",
          text: scenario.level3Diagnostic,
          badge: "Error Diagnosis",
          sub: "Contrasts what your code currently does against the task acceptance criteria.",
        };
      case 4:
        return {
          title: "Level 4: Algorithmic Outline",
          text: scenario.level4Algorithm,
          badge: "Step-by-Step Blueprint",
          sub: "Provides a structured pseudocode sequence for you to implement.",
        };
      case 5:
        return {
          title: "Level 5: Targeted Code Hint",
          text: scenario.level5CodeHint,
          badge: "Syntax Pattern",
          sub: "A focused 1-3 line code example targeting only the specific blocked API call.",
        };
    }
  };

  const currentLevelData = getLevelContent();

  return (
    <div className="w-full max-w-6xl mx-auto rounded-3xl bg-gradient-to-b from-[#0D1214] to-[#080C0D] border border-[#202A2C] p-6 sm:p-10 shadow-2xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#67D6B2]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#202A2C]">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A2428] border border-[#67D6B2]/30 text-[#67D6B2] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>5-Level Socratic Nudge Simulator</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            An AI Mentor That Coaches Your <span className="text-[#67D6B2]">Thinking</span>
          </h2>
          <p className="text-[#A9B5B2] text-sm sm:text-base leading-relaxed">
            Unlike ChatGPT or Copilot that write solutions for you, Nudge provides progressive disclosure hints (Level 1 to Level 5) that preserve your problem-solving flow.
          </p>
        </div>

        {/* Scenario Selector Pills */}
        <div className="flex flex-wrap gap-2">
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setActiveScenarioId(s.id);
                setActiveLevel(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeScenarioId === s.id
                  ? "bg-[#67D6B2] text-[#080C0D] shadow-lg shadow-[#67D6B2]/20"
                  : "bg-[#151D1F] text-[#A9B5B2] hover:text-white border border-[#202A2C]"
              }`}
            >
              {s.category}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Arena */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Code View & Static Evaluation Report */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl bg-[#080C0D] border border-[#202A2C] overflow-hidden shadow-xl">
            {/* Editor File Tab */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#0D1214] border-b border-[#202A2C] text-xs font-mono text-[#A9B5B2]">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#67D6B2]" />
                <span className="text-white font-semibold">{scenario.file}</span>
                <span className="text-[#71807C] hidden sm:inline">• {scenario.title}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#F06A6A]/15 text-[#F06A6A] border border-[#F06A6A]/30 font-sans font-semibold">
                Needs Revision
              </span>
            </div>

            {/* Code Body */}
            <div className="p-4 font-mono text-xs sm:text-[13px] leading-6 text-[#F4F7F6] overflow-x-auto bg-[#080C0D]">
              <pre>
                <code>{scenario.codeSnippet}</code>
              </pre>
            </div>

            {/* Static Evaluation Report Bar */}
            <div className="border-t border-[#202A2C] bg-[#11181A] p-3.5 font-mono text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-[#71807C] text-[11px]">
                <FileCode className="w-3.5 h-3.5 text-[#67D6B2]" />
                <span>Static Evaluation Engine Result:</span>
              </div>
              <p className="text-[#FCA5A5] font-medium flex items-center gap-2">
                <XCircle className="w-4 h-4 text-[#F06A6A] shrink-0" />
                <span>{scenario.evalFailReason}</span>
              </p>
            </div>
          </div>

          {/* Quick Comparison Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-[#180E10] border border-[#F06A6A]/20 text-xs text-[#A9B5B2] space-y-1">
              <div className="flex items-center gap-1.5 text-[#F06A6A] font-semibold">
                <XCircle className="w-3.5 h-3.5" />
                <span>Code-Generator Assistant</span>
              </div>
              <p className="text-[#71807C]">
                Rewrites all the code for you. You copy-paste without understanding and fail future technical interviews.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0D1614] border border-[#67D6B2]/30 text-xs text-[#F4F7F6] space-y-1">
              <div className="flex items-center gap-1.5 text-[#67D6B2] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>The Nudge Progressive Method</span>
              </div>
              <p className="text-[#A9B5B2]">
                Guides your thinking through progressive levels, training your problem-solving instinct so you own the knowledge.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: 5-Level Nudge Ladder Simulator */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0D1214] border border-[#202A2C] space-y-5 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#202A2C] pb-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-[#E9C46A]" />
                <div>
                  <h3 className="text-sm font-bold text-white">Socratic Nudge Ladder</h3>
                  <span className="text-[11px] text-[#67D6B2] font-mono">Progressive Hint Disclosure</span>
                </div>
              </div>
              <span className="text-xs font-mono text-[#A9B5B2] bg-[#151D1F] px-2 py-0.5 rounded border border-[#202A2C]">
                Level {activeLevel} of 5
              </span>
            </div>

            {/* Level Selector Buttons (1 to 5) */}
            <div className="grid grid-cols-5 gap-1.5">
              {([1, 2, 3, 4, 5] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setActiveLevel(lvl)}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    activeLevel === lvl
                      ? "bg-[#E9C46A] text-[#080C0D] shadow-md shadow-[#E9C46A]/20 font-bold"
                      : "bg-[#151D1F] text-[#71807C] hover:text-white border border-[#202A2C]"
                  }`}
                >
                  <span className="text-[11px]">L{lvl}</span>
                </button>
              ))}
            </div>

            {/* Current Hint Card */}
            <div className="p-4 rounded-xl bg-[#11181A] border border-[#E9C46A]/30 space-y-3 min-h-[180px] flex flex-col justify-center animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-[#E9C46A]/15 text-[#E9C46A] border border-[#E9C46A]/30">
                  {currentLevelData.badge}
                </span>
                <span className="text-xs text-[#71807C]">{levelNames[activeLevel]}</span>
              </div>

              <h4 className="text-xs font-bold text-white">
                {currentLevelData.title}
              </h4>

              <div className="text-xs text-[#F4F7F6] leading-relaxed whitespace-pre-line font-sans">
                {currentLevelData.text}
              </div>

              <p className="text-[11px] text-[#71807C] italic pt-1 border-t border-white/5">
                {currentLevelData.sub}
              </p>
            </div>

            {/* Target Outcome */}
            <div className="p-3 rounded-xl bg-[#080C0D] border border-[#202A2C] flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#67D6B2] shrink-0" />
              <div className="text-xs text-[#A9B5B2]">
                <span className="font-semibold text-white block">Learning Mastery:</span>
                <span>{scenario.solutionOutcome}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
