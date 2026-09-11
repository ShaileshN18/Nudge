import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Project from "@/lib/models/Project";

const fallbackProjectsMap: Record<string, any> = {
  "devblog": {
    slug: "devblog",
    title: "DevBlog",
    description:
      "Full-stack React and Express blog application with dynamic routes, markdown rendering, and MongoDB.",
    track: "fullstack",
    difficulty: "Medium",
    tasks: [
      {
        order: 1,
        title: "Display a single blog post",
        description:
          "Fetch a blog post by its id from the backend and display its title, content[render markdown] and author info",
        goal: "Fetch and render blog post data by route id param.",
        targetFiles: [
          "src/pages/Post.jsx",
          "server/routes/postRoutes.js",
          "server/models/Post.js",
        ],
        evaluationCriteria: [
          "Extracts id parameter from route with useParams()",
          "Calls GET /api/posts/:id with axios/fetch",
          "Includes [id] in useEffect dependency array to re-fetch on param change",
          "Renders post title, markdown content, and author metadata",
        ],
      },
      {
        order: 2,
        title: "Create and publish new blog post",
        description:
          "Implement form validation and POST /api/posts to store new posts in MongoDB.",
        goal: "Create new posts with title, markdown body, and tags.",
        targetFiles: ["src/pages/NewPost.jsx", "server/routes/postRoutes.js"],
        evaluationCriteria: [
          "Form submission prevents default and validates inputs",
          "Calls POST /api/posts with JSON payload",
          "Redirects to newly created post on success",
        ],
      },
    ],
    files: [
      {
        path: "src/pages/Post.jsx",
        content: `import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Post() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch post by id from backend
    axios.get(\`/api/posts/\${id}\`)
      .then((res) => {
        setPost(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Post not found');
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="text-gray-400">Loading...</div>;
  if (error) return <div className="text-red-400">{error}</div>;
  if (!post) return <div className="text-gray-400">Post not found</div>;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
      <p className="text-gray-400 mb-6">By {post.author}</p>
      <div className="prose text-slate-200">
        {post.content}
      </div>
    </div>
  );
}
`,
        visible: true,
        editable: true,
      },
      {
        path: "server/routes/postRoutes.js",
        content: `const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// GET /api/posts/:id
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/posts
router.post('/', async (req, res) => {
  try {
    const { title, content, author } = req.body;
    const newPost = await Post.create({ title, content, author });
    res.status(201).json(newPost);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
`,
        visible: true,
        editable: true,
      },
      {
        path: "server/models/Post.js",
        content: `const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Post || mongoose.model('Post', postSchema);
`,
        visible: true,
        editable: true,
      },
      {
        path: "src/pages/Home.jsx",
        content: `import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">DevBlog Community</h1>
      <p className="text-slate-400 mb-6">Browse tutorials, engineering stories, and articles.</p>
    </div>
  );
}
`,
        visible: true,
        editable: true,
      },
      {
        path: "src/pages/NewPost.jsx",
        content: `import React, { useState } from 'react';

export default function NewPost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">Create New Post</h2>
    </div>
  );
}
`,
        visible: true,
        editable: true,
      },
      {
        path: "src/App.jsx",
        content: `import React from 'react';
import Post from './pages/Post';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <Post />
    </div>
  );
}
`,
        visible: true,
        editable: true,
      },
      {
        path: "src/main.jsx",
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
`,
        visible: true,
        editable: true,
      },
      {
        path: "server/models/User.js",
        content: `const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
`,
        visible: true,
        editable: true,
      },
      {
        path: "server/routes/userRoutes.js",
        content: `const express = require('express');
const router = express.Router();

router.get('/me', (req, res) => {
  res.json({ name: 'Developer', role: 'Author' });
});

module.exports = router;
`,
        visible: true,
        editable: true,
      },
      {
        path: "index.js",
        content: `const express = require('express');
const app = express();
const postRoutes = require('./server/routes/postRoutes');

app.use(express.json());
app.use('/api/posts', postRoutes);

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
`,
        visible: true,
        editable: true,
      },
      {
        path: ".env",
        content: `PORT=5000
NODE_ENV=development
`,
        visible: true,
        editable: true,
      },
      {
        path: "README.md",
        content: `# DevBlog
Interactive full-stack blog platform built with Express and React.
`,
        visible: true,
        editable: true,
      },
    ],
  },
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
  let slug = "";
  try {
    const resolvedParams = await params;
    slug = resolvedParams.slug;
  } catch {
    slug = "";
  }

  let project = null;

  try {
    await connectToDatabase();
    project = await Project.findOne({ slug });

    if (!project) {
      const fallback = fallbackProjectsMap[slug];
      if (fallback) {
        project = await Project.create(fallback).catch(() => fallback);
      }
    }
  } catch (dbError: any) {
    console.warn(`Database access failed for project ${slug}, checking fallback:`, dbError?.message);
    project = fallbackProjectsMap[slug] || null;
  }

  const finalProject = project || fallbackProjectsMap[slug];

  if (!finalProject) {
    return NextResponse.json(
      { success: false, error: "Project not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: finalProject,
  });
}
