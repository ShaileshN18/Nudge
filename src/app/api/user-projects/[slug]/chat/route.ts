import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import Project from "@/lib/models/Project";
import UserProject from "@/lib/models/UserProject";
import {
  authSeedProject,
  feedbackBoardSeedProject,
} from "@/lib/seedProject";
import { TaskContext } from "@/lib/ai/types";

export const dynamic = "force-dynamic";

function getBaseSeed(slug: string) {
  const isFeedbackSlug =
    slug === "feedback-board" ||
    slug === "feedback_board" ||
    slug === "build-feedback-board";
  return isFeedbackSlug ? feedbackBoardSeedProject : authSeedProject;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    let slug = "";
    try {
      const resolvedParams = await params;
      slug = resolvedParams.slug;
    } catch {
      slug = "";
    }

    const fallbackSeed = getBaseSeed(slug);
    const normalizedSlug = fallbackSeed.slug;

    await connectToDatabase();

    const body = await request.json().catch(() => ({}));
    const { message, chatHistory } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    let baseProject = await Project.findOne({
      $or: [{ slug }, { slug: normalizedSlug }],
    });

    if (!baseProject || !baseProject.tasks || baseProject.tasks.length === 0) {
      baseProject = fallbackSeed;
    }

    let userProject = await UserProject.findOne({
      userId: session.userId,
      $or: [{ projectSlug: slug }, { projectSlug: normalizedSlug }],
    });

    if (!userProject) {
      return NextResponse.json(
        { success: false, error: "Workspace not found" },
        { status: 404 }
      );
    }

    const currentTaskIndex = userProject.currentTaskIndex || 0;
    const totalTasks = baseProject.tasks.length;
    const rawTask = baseProject.tasks[Math.min(currentTaskIndex, totalTasks - 1)];

    const taskContext: TaskContext = {
      id: String(rawTask._id || currentTaskIndex + 1),
      order: rawTask.order || currentTaskIndex + 1,
      totalTasks,
      title: rawTask.title,
      description: rawTask.description,
      instructions: rawTask.instructions,
      goal: rawTask.goal,
      targetFiles: rawTask.targetFiles || [],
      evaluationCriteria: rawTask.evaluationCriteria || [],
      concepts: rawTask.concepts || [],
      difficulty: rawTask.difficulty || "intermediate",
    };

    // Return Socratic guiding response
    const fallbackResponse = `Let's focus on **Task ${taskContext.order}: ${taskContext.title}**.\n\nGoal: *${taskContext.goal}*\n\nTake a look at \`${taskContext.targetFiles[0]}\`. What specific part of the function or endpoint logic are you currently working on? Think about what data comes in and what needs to be returned.`;

    return NextResponse.json({
      success: true,
      data: {
        reply: fallbackResponse,
        taskContext,
      },
    });
  } catch (error: any) {
    console.error("Error in Socratic chat handler:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process chat" },
      { status: 500 }
    );
  }
}
