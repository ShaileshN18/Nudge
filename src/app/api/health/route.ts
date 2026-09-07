import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/lib/models/User";
import Project from "@/lib/models/Project";
import UserProject from "@/lib/models/UserProject";
import TaskAttempt from "@/lib/models/TaskAttempt";

export async function GET() {
  try {
    await connectToDatabase();

    // Initialize collections on MongoDB Atlas if not existing
    await Promise.all([
      User.createCollection(),
      Project.createCollection(),
      UserProject.createCollection(),
      TaskAttempt.createCollection(),
    ]);

    return NextResponse.json({
      status: "ok",
      message: "Nudge Next.js API is running!",
      dbStatus: "connected",
      collections: ["users", "projects", "userprojects", "taskattempts"],
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to connect to database or initialize collections",
        error: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
