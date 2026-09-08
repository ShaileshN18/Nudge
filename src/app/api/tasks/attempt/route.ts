import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import TaskAttempt from "@/lib/models/TaskAttempt";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const {
      userId = new mongoose.Types.ObjectId(),
      userProjectId = new mongoose.Types.ObjectId(),
      taskId = new mongoose.Types.ObjectId(),
      status = "passed",
      feedback = "All automated task criteria passed successfully.",
    } = body;

    const attempt = await TaskAttempt.create({
      userId: new mongoose.Types.ObjectId(String(userId).padEnd(24, "0").slice(0, 24)),
      userProjectId: new mongoose.Types.ObjectId(String(userProjectId).padEnd(24, "0").slice(0, 24)),
      taskId: new mongoose.Types.ObjectId(String(taskId).padEnd(24, "0").slice(0, 24)),
      status,
      feedback,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Task attempt recorded successfully in MongoDB Atlas/Local DB",
        attempt,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || String(err) },
      { status: 500 }
    );
  }
}
