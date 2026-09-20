import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import Project from "@/lib/models/Project";
import UserProject from "@/lib/models/UserProject";
import TaskAttempt from "@/lib/models/TaskAttempt";
import {
  authSeedProject,
  feedbackBoardSeedProject,
} from "@/lib/seedProject";
import {
  NudgeLevel,
  NudgeResponse,
  TaskContext,
} from "@/lib/ai/types";
import {
  getBaselineProgressiveNudge,
  normalizeNudgeResponse,
} from "@/lib/ai/nudgeService";

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
    const requestedLevel = (Number(body.level) || 1) as NudgeLevel;
    const clientNudgeJson = body.clientNudgeJson;

    // 1. Fetch project & user workspace
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

    if (currentTaskIndex >= totalTasks) {
      return NextResponse.json({
        success: true,
        data: {
          level: requestedLevel,
          levelName: "Completed",
          title: "All Tasks Complete!",
          hint: "You have completed all tasks in this project. Congratulations!",
          nextLevelAvailable: false,
        },
      });
    }

    const rawTask = baseProject.tasks[currentTaskIndex];
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

    let nudgeResponse: NudgeResponse;

    if (clientNudgeJson) {
      nudgeResponse = normalizeNudgeResponse(clientNudgeJson, requestedLevel);
    } else {
      nudgeResponse = getBaselineProgressiveNudge(taskContext, requestedLevel);
    }

    return NextResponse.json({
      success: true,
      data: nudgeResponse,
    });
  } catch (error: any) {
    console.error("Error generating progressive nudge:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate nudge" },
      { status: 500 }
    );
  }
}
