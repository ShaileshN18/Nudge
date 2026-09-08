import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Project from "@/lib/models/Project";

const fallbackProjectsMap: Record<string, any> = {
  "build-express-mongodb-auth": {
    slug: "build-express-mongodb-auth",
    title: "Build JWT Auth with Express & Mongoose",
    description:
      "Implement user authentication, password hashing with bcrypt, and JWT middleware token validation.",
    track: "backend",
    difficulty: "beginner",
    tasks: [
      {
        order: 1,
        title: "Define User Schema & Password Hashing",
        description:
          "Implement the User schema with mongoose. Define name, email, and passwordHash fields. Add pre-save hook to hash password with bcrypt.",
        goal: "Store secure bcrypt password hashes on user registration.",
        targetFiles: ["src/models/User.js"],
        evaluationCriteria: [
          "User schema contains email with unique: true",
          "Password hashing hook hashes password before save",
          "Returns hashed string, never plain-text",
        ],
      },
      {
        order: 2,
        title: "Implement Registration & Login Routes",
        description:
          "Write POST /register to create a new user and POST /login to verify password and return signed JWT.",
        goal: "Generate and return JWT on valid login credentials.",
        targetFiles: ["src/routes/auth.js"],
        evaluationCriteria: [
          "POST /register creates user and returns JWT",
          "POST /login verifies password with bcrypt.compare",
          "Invalid passwords return 401 Unauthorized",
        ],
      },
      {
        order: 3,
        title: "JWT Authentication Middleware",
        description:
          "Create auth middleware that extracts Bearer token from headers and attaches decoded user to req.user.",
        goal: "Protect private routes with JWT token verification.",
        targetFiles: ["src/middleware/auth.js"],
        evaluationCriteria: [
          "Extracts token from Authorization header",
          "Calls jwt.verify with process.env.JWT_SECRET",
          "Rejects expired or tampered tokens",
        ],
      },
    ],
    files: [
      {
        path: "src/models/User.js",
        content: `const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

// TODO: Task 1 - Add pre-save hook to hash password with bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  // Hash password here
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
`,
        visible: true,
        editable: true,
      },
      {
        path: "src/routes/auth.js",
        content: `const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-123';

// TODO: Task 2 - Implement registration and login
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.create({ name, email, password });
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, message: 'Logged in successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
`,
        visible: true,
        editable: true,
      },
      {
        path: "src/middleware/auth.js",
        content: `const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key-123');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};
`,
        visible: true,
        editable: true,
      },
    ],
  },
  "nextjs-task-dashboard": {
    slug: "nextjs-task-dashboard",
    title: "Realtime Next.js Task Attempt Evaluator",
    description:
      "Build an automated task execution feedback loop with App Router API routes and MongoDB Atlas.",
    track: "fullstack",
    difficulty: "intermediate",
    tasks: [
      {
        order: 1,
        title: "Create MongoDB Attempt Submission Endpoint",
        description:
          "Implement POST /api/tasks/attempt in Next.js App Router to record task submissions into MongoDB.",
        goal: "Store attempt status and test evaluations in the taskattempts collection.",
        targetFiles: ["src/app/api/tasks/attempt/route.ts"],
        evaluationCriteria: [
          "Connects to MongoDB using connectToDatabase()",
          "Creates TaskAttempt record with status and feedback",
          "Returns 201 created status with saved document",
        ],
      },
    ],
    files: [
      {
        path: "src/app/api/tasks/attempt/route.ts",
        content: `import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import TaskAttempt from "@/lib/models/TaskAttempt";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const attempt = await TaskAttempt.create({
      userId: body.userId,
      userProjectId: body.userProjectId,
      taskId: body.taskId,
      status: body.status,
      feedback: body.feedback,
    });

    return NextResponse.json({ success: true, attempt }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
`,
        visible: true,
        editable: true,
      },
    ],
  },
  "react-code-editor-component": {
    slug: "react-code-editor-component",
    title: "Interactive Code Workspace UI",
    description:
      "Build a multi-file tabs component with live output execution and evaluation criteria badges.",
    track: "frontend",
    difficulty: "intermediate",
    tasks: [
      {
        order: 1,
        title: "Build File Tabs Navigator",
        description: "Create tab buttons to switch between multiple editable project files.",
        goal: "Render active file content based on selected tab.",
        targetFiles: ["src/components/EditorTabs.tsx"],
        evaluationCriteria: [
          "Active tab is highlighted with border and background",
          "Clicking a tab invokes onSelectTab callback",
          "Shows file icons according to file extension",
        ],
      },
    ],
    files: [
      {
        path: "src/components/EditorTabs.tsx",
        content: `"use client";

import React from "react";
import { FileCode } from "lucide-react";

interface EditorTabsProps {
  files: Array<{ path: string }>;
  activePath: string;
  onSelectTab: (path: string) => void;
}

export default function EditorTabs({ files, activePath, onSelectTab }: EditorTabsProps) {
  return (
    <div className="flex items-center gap-1 border-b border-slate-800 bg-slate-900/80 px-2 pt-2">
      {files.map((file) => {
        const isActive = file.path === activePath;
        return (
          <button
            key={file.path}
            onClick={() => onSelectTab(file.path)}
            className={\`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-t-lg transition-all \${
              isActive
                ? "bg-slate-800 text-white border-t-2 border-indigo-500 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }\`}
          >
            <FileCode className="h-3.5 w-3.5 text-indigo-400" />
            {file.path.split('/').pop()}
          </button>
        );
      })}
    </div>
  );
}
`,
        visible: true,
        editable: true,
      },
    ],
  },
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectToDatabase();

    let project = await Project.findOne({ slug });

    if (!project) {
      // If not in DB yet, fallback to predefined template
      const fallback = fallbackProjectsMap[slug];
      if (fallback) {
        // Auto-seed into DB
        project = await Project.create(fallback).catch(() => fallback);
      }
    }

    if (!project && !fallbackProjectsMap[slug]) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: project || fallbackProjectsMap[slug],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
