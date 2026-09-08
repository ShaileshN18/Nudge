import { NextResponse } from "next/server";
import connectToDatabase, { getDatabaseInfo } from "@/lib/db";
import User from "@/lib/models/User";
import Project from "@/lib/models/Project";
import UserProject from "@/lib/models/UserProject";
import TaskAttempt from "@/lib/models/TaskAttempt";

const initialProjects = [
  {
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
        description: "Create the Mongoose user schema and add pre-save bcrypt hashing hook.",
        goal: "Store secure password hashes on user registration.",
        targetFiles: ["src/models/User.js"],
        evaluationCriteria: ["Bcrypt hash with salt rounds >= 10"],
      },
      {
        order: 2,
        title: "Implement Registration & Login Routes",
        description: "Write POST /register and POST /login route handlers returning signed JWT tokens.",
        goal: "Generate and return JWT on valid login credentials.",
        targetFiles: ["src/routes/auth.js"],
        evaluationCriteria: ["JWT token signed with secret in payload"],
      },
    ],
    files: [
      {
        path: "src/models/User.js",
        content: "// Implement User schema here\n",
        visible: true,
        editable: true,
      },
    ],
  },
  {
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
        description: "Implement POST /api/tasks/attempt to record user task submissions.",
        goal: "Store attempt status in taskattempts collection.",
        targetFiles: ["src/app/api/tasks/attempt/route.ts"],
        evaluationCriteria: ["Mongoose TaskAttempt document created"],
      },
    ],
    files: [
      {
        path: "src/app/api/tasks/attempt/route.ts",
        content: "// Task Attempt route handler\n",
        visible: true,
        editable: true,
      },
    ],
  },
  {
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
        evaluationCriteria: ["State updates active tab correctly"],
      },
    ],
    files: [
      {
        path: "src/components/EditorTabs.tsx",
        content: "// Tab switcher component\n",
        visible: true,
        editable: true,
      },
    ],
  },
];

export async function GET() {
  try {
    await connectToDatabase();
    const info = getDatabaseInfo();

    // Initialize collections on MongoDB Atlas / Local MongoDB
    await Promise.all([
      User.createCollection().catch(() => {}),
      Project.createCollection().catch(() => {}),
      UserProject.createCollection().catch(() => {}),
      TaskAttempt.createCollection().catch(() => {}),
    ]);

    // Seed initial projects if collection is empty
    const count = await Project.countDocuments();
    if (count === 0) {
      await Project.insertMany(initialProjects);
    }

    const totalProjects = await Project.countDocuments();

    return NextResponse.json({
      status: "ok",
      message: "Nudge Next.js API & Database connected successfully!",
      dbStatus: "connected",
      dbType: info.isAtlas ? "MongoDB Atlas (Cloud)" : "Local MongoDB",
      host: info.host,
      database: info.dbName,
      collections: ["users", "projects", "userprojects", "taskattempts"],
      projectsCount: totalProjects,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    const rawUri = process.env.MONGODB_URI || "";
    const isPlaceholder =
      rawUri.includes("<username>") ||
      rawUri.includes("<password>") ||
      rawUri.includes("<cluster>");

    let suggestion = "Check your MongoDB connection string in .env";
    if (isPlaceholder) {
      suggestion =
        "Your .env file contains placeholder credentials (<username>:<password>@<cluster>). Replace them with your real Atlas connection string or use mongodb://127.0.0.1:27017/nudge.";
    }

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to connect to MongoDB",
        error: error.message || String(error),
        suggestion,
      },
      { status: 500 }
    );
  }
}
