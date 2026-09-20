import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import Project from "@/lib/models/Project";
import UserProject from "@/lib/models/UserProject";
import {
  authSeedProject,
  feedbackBoardSeedProject,
} from "@/lib/seedProject";

export const dynamic = "force-dynamic";

function getBaseSeed(slug: string) {
  const isFeedbackSlug =
    slug === "feedback-board" ||
    slug === "feedback_board" ||
    slug === "build-feedback-board";
  return isFeedbackSlug ? feedbackBoardSeedProject : authSeedProject;
}

/**
 * GET /api/user-projects/[slug]
 * Returns user workspace files, progress, and ONLY the currently active task.
 * Future task instructions, criteria, and titles are never exposed to the client.
 */
export async function GET(
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

    // 1. Fetch or initialize base curriculum project
    let baseProject = await Project.findOne({
      $or: [{ slug }, { slug: normalizedSlug }],
    });

    if (!baseProject || !baseProject.tasks || baseProject.tasks.length === 0) {
      baseProject = await Project.create({
        slug: fallbackSeed.slug,
        title: fallbackSeed.title,
        description: fallbackSeed.description,
        track: fallbackSeed.track,
        difficulty: fallbackSeed.difficulty,
        tasks: fallbackSeed.tasks,
        files: fallbackSeed.files,
      }).catch(() => fallbackSeed);
    }

    // 2. Fetch or initialize user's own project workspace
    let userProject = await UserProject.findOne({
      userId: session.userId,
      $or: [{ projectSlug: slug }, { projectSlug: normalizedSlug }],
    });

    if (!userProject) {
      const initialFiles = (baseProject.files || fallbackSeed.files || []).map(
        (f: any) => ({
          path: f.path,
          content: f.content,
        })
      );

      userProject = await UserProject.create({
        userId: session.userId,
        projectId: baseProject._id || new mongoose.Types.ObjectId(),
        projectSlug: normalizedSlug,
        files: initialFiles,
        currentTaskIndex: 0,
        completedTasks: [],
        activeFilePath: initialFiles[0]?.path || "",
        lastActiveAt: new Date(),
      });
    } else {
      userProject.lastActiveAt = new Date();
      await userProject.save().catch(() => null);
    }

    const totalTasks = baseProject.tasks?.length || fallbackSeed.tasks.length;
    const taskIndex = userProject.currentTaskIndex || 0;
    const isCompleted = taskIndex >= totalTasks;

    // Strict Task Isolation: Only expose the current active task!
    let currentTask = null;
    if (!isCompleted && baseProject.tasks && baseProject.tasks[taskIndex]) {
      const rawTask = baseProject.tasks[taskIndex];
      currentTask = {
        _id: String(rawTask._id || taskIndex + 1),
        order: rawTask.order || taskIndex + 1,
        title: rawTask.title,
        description: rawTask.description,
        instructions: rawTask.instructions || "",
        goal: rawTask.goal,
        targetFiles: rawTask.targetFiles || [],
        evaluationCriteria: rawTask.evaluationCriteria || [],
        concepts: rawTask.concepts || [],
        difficulty: rawTask.difficulty || "intermediate",
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        project: {
          slug: baseProject.slug,
          title: baseProject.title,
          description: baseProject.description,
          track: baseProject.track,
          difficulty: baseProject.difficulty,
          totalTasks,
        },
        currentTask,
        currentTaskIndex: taskIndex,
        totalTasks,
        isCompleted,
        completedTasks: userProject.completedTasks || [],
        files: userProject.files || [],
        activeFilePath: userProject.activeFilePath || userProject.files?.[0]?.path || "",
        updatedAt: userProject.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Error fetching user project workspace:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch workspace" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user-projects/[slug]
 * Persists learner's files, active tab, or creates/deletes files.
 * Security Note: Task progression cannot be manipulated here.
 */
export async function PATCH(
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

    const body = await request.json();
    const { file, files, deleteFilePath, isDirectory, renameFile, activeFilePath, reset } = body;

    let baseProject = await Project.findOne({
      $or: [{ slug }, { slug: normalizedSlug }],
    });

    let userProject = await UserProject.findOne({
      userId: session.userId,
      $or: [{ projectSlug: slug }, { projectSlug: normalizedSlug }],
    });

    if (!userProject) {
      const initialFiles = (baseProject?.files || fallbackSeed.files || []).map(
        (f: any) => ({
          path: f.path,
          content: f.content,
        })
      );

      userProject = new UserProject({
        userId: session.userId,
        projectId: baseProject?._id || new mongoose.Types.ObjectId(),
        projectSlug: normalizedSlug,
        files: initialFiles,
        currentTaskIndex: 0,
        completedTasks: [],
        activeFilePath: initialFiles[0]?.path || "",
        lastActiveAt: new Date(),
      });
    }

    // Reset workspace to initial template
    if (reset === true) {
      const initialFiles = (fallbackSeed.files || []).map((f: any) => ({
        path: f.path,
        content: f.content,
      }));
      userProject.files = initialFiles;
      userProject.activeFilePath = initialFiles[0]?.path || "";
      await userProject.save();
      return NextResponse.json({
        success: true,
        data: {
          files: userProject.files,
          activeFilePath: userProject.activeFilePath,
        },
      });
    }

    // Handle file deletion
    if (typeof deleteFilePath === "string") {
      const cleanDelete = deleteFilePath.replace(/^\/+/, "");
      if (isDirectory) {
        userProject.files = userProject.files.filter((f: any) => {
          const fp = f.path.replace(/^\/+/, "");
          return !fp.startsWith(`${cleanDelete}/`) && fp !== cleanDelete;
        });
      } else {
        userProject.files = userProject.files.filter(
          (f: any) => f.path.replace(/^\/+/, "") !== cleanDelete
        );
      }
    }

    // Handle renaming
    if (
      renameFile &&
      typeof renameFile.oldPath === "string" &&
      typeof renameFile.newPath === "string"
    ) {
      const cleanOld = renameFile.oldPath.replace(/^\/+/, "");
      const cleanNew = renameFile.newPath.replace(/^\/+/, "");

      if (renameFile.isDirectory) {
        userProject.files.forEach((f: any) => {
          const fp = f.path.replace(/^\/+/, "");
          if (fp.startsWith(`${cleanOld}/`)) {
            f.path = `${cleanNew}/${fp.slice(cleanOld.length + 1)}`;
          } else if (fp === cleanOld) {
            f.path = cleanNew;
          }
        });
      } else {
        const target = userProject.files.find(
          (f: any) => f.path.replace(/^\/+/, "") === cleanOld
        );
        if (target) {
          target.path = cleanNew;
        }
      }
    }

    // Handle single file update
    if (file && typeof file.path === "string") {
      const cleanPath = file.path.replace(/^\/+/, "");
      const existingIdx = userProject.files.findIndex(
        (f: any) => f.path.replace(/^\/+/, "") === cleanPath
      );

      if (existingIdx !== -1) {
        userProject.files[existingIdx].content = file.content;
      } else {
        userProject.files.push({
          path: cleanPath,
          content: file.content || "",
        });
      }
    }

    // Handle bulk files update
    if (Array.isArray(files)) {
      userProject.files = files;
    }

    if (typeof activeFilePath === "string") {
      userProject.activeFilePath = activeFilePath;
    }

    userProject.lastActiveAt = new Date();
    await userProject.save();

    return NextResponse.json({
      success: true,
      data: {
        files: userProject.files,
        activeFilePath: userProject.activeFilePath,
        updatedAt: userProject.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Error updating user project workspace:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update workspace" },
      { status: 500 }
    );
  }
}
