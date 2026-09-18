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

    // 1. Fetch base project
    let baseProject = await Project.findOne({
      $or: [{ slug }, { slug: normalizedSlug }],
    });

    if (!baseProject) {
      baseProject = await Project.create({
        slug: fallbackSeed.slug,
        title: fallbackSeed.title,
        description: fallbackSeed.description,
        track: fallbackSeed.track,
        difficulty: fallbackSeed.difficulty,
        tasks: fallbackSeed.tasks,
        files: fallbackSeed.files,
      }).catch(() => fallbackSeed);
    } else if (baseProject && fallbackSeed.files) {
      // Sync base project files if starter templates were updated
      const baseUserModel = baseProject.files?.find((f: any) => f.path.includes("models/User.js"));
      const seedModelFile = fallbackSeed.files.find((f: any) => f.path.includes("models/User.js"));
      if (baseUserModel && seedModelFile && !baseUserModel.content.includes("TODO")) {
        await Project.updateOne(
          { _id: baseProject._id },
          { $set: { files: fallbackSeed.files, tasks: fallbackSeed.tasks } }
        ).catch(() => null);
        baseProject.files = fallbackSeed.files;
      }
    }

    // 2. Look for existing UserProject workspace
    let userProject = await UserProject.findOne({
      userId: session.userId,
      $or: [{ projectSlug: slug }, { projectSlug: normalizedSlug }],
    });

    // 3. First time opening: clone project files into user's own workspace
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

    // Migrate the previously shipped Feedback model that accidentally included
    // a GET handler at module scope. Its top-level await makes CommonJS require()
    // fail before the learner's server can become ready.
    if (normalizedSlug === "feedback-board") {
      let migrated = false;
      const correctedFiles = (userProject.files || []).map((file: any) => {
        if (file.path !== "backend/src/models/Feedback.js") return file;

        const content = String(file.content || "").replace(
          /\nconst feedback = await Feedback\.find\(\)\.sort\(\{ votes: -1 \}\);\s*\n\s*res\.status\(200\)\.json\(feedback\);\s*/,
          "\n"
        );
        if (content === file.content) return file;
        migrated = true;
        return { ...file.toObject?.(), content };
      });

      if (migrated) {
        userProject.files = correctedFiles;
        await userProject.save();
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        project: baseProject,
        userProject: {
          _id: userProject._id,
          projectSlug: userProject.projectSlug,
          files: userProject.files,
          currentTaskIndex: userProject.currentTaskIndex || 0,
          completedTasks: userProject.completedTasks || [],
          activeFilePath: userProject.activeFilePath || "",
          updatedAt: userProject.updatedAt,
        },
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
    const {
      file,
      files,
      deleteFilePath,
      isDirectory,
      renameFile,
      currentTaskIndex,
      completedTasks,
      activeFilePath,
    } = body;

    let baseProject = await Project.findOne({
      $or: [{ slug }, { slug: normalizedSlug }],
    });

    const coreFilePaths = new Set<string>(
      (baseProject?.files || fallbackSeed.files || []).map((f: any) =>
        String(f.path).replace(/^\/+/, "")
      )
    );

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

    if (body.reset === true) {
      const initialFiles = (fallbackSeed.files || []).map((f: any) => ({
        path: f.path,
        content: f.content,
      }));
      userProject.files = initialFiles;
      userProject.completedTasks = [];
      userProject.currentTaskIndex = 0;
      userProject.activeFilePath = initialFiles[0]?.path || "";
      await userProject.save();
      return NextResponse.json({
        success: true,
        data: {
          files: userProject.files,
          completedTasks: userProject.completedTasks,
          currentTaskIndex: userProject.currentTaskIndex,
        },
      });
    }

    // 1. Guardrail & handle deletion
    if (typeof deleteFilePath === "string") {
      const cleanDelete = deleteFilePath.replace(/^\/+/, "");
      // Check if trying to delete a core file or directory containing core files
      const isTryingToDeleteCore = isDirectory
        ? Array.from(coreFilePaths).some(
            (cp) => cp === cleanDelete || cp.startsWith(`${cleanDelete}/`)
          )
        : coreFilePaths.has(cleanDelete);

      if (isTryingToDeleteCore) {
        return NextResponse.json(
          { success: false, error: "Core project files and directories cannot be deleted." },
          { status: 403 }
        );
      }

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

    // 2. Guardrail & handle renaming
    if (renameFile && typeof renameFile.oldPath === "string" && typeof renameFile.newPath === "string") {
      const cleanOld = renameFile.oldPath.replace(/^\/+/, "");
      const cleanNew = renameFile.newPath.replace(/^\/+/, "");

      const isTryingToRenameCore = renameFile.isDirectory
        ? Array.from(coreFilePaths).some(
            (cp) => cp === cleanOld || cp.startsWith(`${cleanOld}/`)
          )
        : coreFilePaths.has(cleanOld);

      if (isTryingToRenameCore) {
        return NextResponse.json(
          { success: false, error: "Core project files and directories cannot be renamed." },
          { status: 403 }
        );
      }

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

    // 3. Update specific file or entire files array
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

    if (Array.isArray(files)) {
      userProject.files = files;
    }

    if (typeof currentTaskIndex === "number") {
      userProject.currentTaskIndex = currentTaskIndex;
    }

    if (Array.isArray(completedTasks)) {
      // Merge unique completed tasks
      const existing = new Set(userProject.completedTasks.map(String));
      completedTasks.forEach((t) => existing.add(String(t)));
      userProject.completedTasks = Array.from(existing);
    }

    if (typeof activeFilePath === "string") {
      userProject.activeFilePath = activeFilePath;
    }

    userProject.lastActiveAt = new Date();
    await userProject.save();

    return NextResponse.json({
      success: true,
      data: {
        currentTaskIndex: userProject.currentTaskIndex,
        completedTasks: userProject.completedTasks,
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
