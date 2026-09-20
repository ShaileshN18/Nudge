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
  EvaluationResult,
  FileSnapshot,
  TaskContext,
} from "@/lib/ai/types";
import {
  normalizeEvaluationResult,
  runStaticHeuristicEvaluation,
} from "@/lib/ai/evaluatorService";

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
    const { clientEvaluationResult, currentFiles } = body;

    // 1. Fetch project curriculum & user workspace
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
        { success: false, error: "User workspace not found" },
        { status: 404 }
      );
    }

    // If files are provided in body, persist them first
    if (Array.isArray(currentFiles) && currentFiles.length > 0) {
      userProject.files = currentFiles;
      await userProject.save();
    }

    const currentTaskIndex = userProject.currentTaskIndex || 0;
    const totalTasks = baseProject.tasks.length;

    if (currentTaskIndex >= totalTasks) {
      return NextResponse.json({
        success: true,
        data: {
          alreadyCompleted: true,
          message: "All tasks for this project have already been successfully completed!",
          isCompleted: true,
          currentTaskIndex,
          totalTasks,
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

    const filesSnapshot: FileSnapshot[] = (userProject.files || []).map(
      (f: any) => ({
        path: f.path,
        content: f.content,
      })
    );

    // 2. Evaluate results: validate client evaluation if provided, or run static evaluation
    let evaluationResult: EvaluationResult;

    if (clientEvaluationResult && clientEvaluationResult.criteriaResults) {
      evaluationResult = normalizeEvaluationResult(
        clientEvaluationResult,
        taskContext
      );
    } else {
      evaluationResult = runStaticHeuristicEvaluation(
        taskContext,
        filesSnapshot
      );
    }

    // 3. Save attempt record in database
    const attemptRecord = await TaskAttempt.create({
      userId: session.userId,
      userProjectId: userProject._id,
      projectSlug: normalizedSlug,
      taskId: taskContext.id,
      taskOrder: taskContext.order,
      taskTitle: taskContext.title,
      status: evaluationResult.status,
      score: evaluationResult.score,
      criteriaResults: evaluationResult.criteriaResults,
      overallFeedback: evaluationResult.overallFeedback,
      bugs: evaluationResult.bugs,
      missingRequirements: evaluationResult.missingRequirements,
      conceptualIssues: evaluationResult.conceptualIssues,
      nextStep: evaluationResult.nextStep,
      shouldAskForNudge: evaluationResult.shouldAskForNudge,
      codeSnapshot: filesSnapshot.map((f) => ({
        path: f.path,
        content: f.content,
      })),
    }).catch((err) => {
      console.warn("Failed to persist TaskAttempt record:", err);
      return null;
    });

    let nextTask = null;
    let isCompleted = false;

    // 4. ATOMIC TASK PROGRESSION: Advance only if status is "pass"
    if (evaluationResult.status === "pass") {
      const nextIndex = currentTaskIndex + 1;
      userProject.currentTaskIndex = nextIndex;

      const completedId = String(taskContext.id || taskContext.order);
      if (!userProject.completedTasks.includes(completedId)) {
        userProject.completedTasks.push(completedId);
      }
      userProject.lastActiveAt = new Date();
      await userProject.save();

      isCompleted = nextIndex >= totalTasks;

      // Extract next task for the client
      if (!isCompleted && baseProject.tasks[nextIndex]) {
        const nextRaw = baseProject.tasks[nextIndex];
        nextTask = {
          _id: String(nextRaw._id || nextIndex + 1),
          order: nextRaw.order || nextIndex + 1,
          title: nextRaw.title,
          description: nextRaw.description,
          instructions: nextRaw.instructions || "",
          goal: nextRaw.goal,
          targetFiles: nextRaw.targetFiles || [],
          evaluationCriteria: nextRaw.evaluationCriteria || [],
          concepts: nextRaw.concepts || [],
          difficulty: nextRaw.difficulty || "intermediate",
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        evaluation: evaluationResult,
        passed: evaluationResult.status === "pass",
        attemptId: attemptRecord?._id,
        currentTaskIndex: userProject.currentTaskIndex,
        totalTasks,
        isCompleted,
        nextTask,
        completedTasks: userProject.completedTasks,
      },
    });
  } catch (error: any) {
    console.error("Error evaluating task:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to evaluate task" },
      { status: 500 }
    );
  }
}
