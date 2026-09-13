import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Project from "@/lib/models/Project";
import {
  authSeedProject,
  feedbackBoardSeedProject,
} from "@/lib/seedProject";

export const dynamic = "force-dynamic";

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

  const isFeedbackSlug =
    slug === "feedback-board" ||
    slug === "feedback_board" ||
    slug === "build-feedback-board";

  const isAuthSlug =
    slug === "build-auth" ||
    slug === "build_auth" ||
    slug === "build-express-mongodb-auth" ||
    slug === "default" ||
    (!slug && !isFeedbackSlug);

  const fallbackSeed = isFeedbackSlug
    ? feedbackBoardSeedProject
    : authSeedProject;

  let project = null;

  try {
    await connectToDatabase();
    project = await Project.findOne({
      $or: [
        { slug },
        isFeedbackSlug
          ? { slug: "feedback-board" }
          : { slug: "build-auth" },
      ],
    });

    if (!project) {
      project = await Project.create({
        slug: fallbackSeed.slug,
        title: fallbackSeed.title,
        description: fallbackSeed.description,
        track: fallbackSeed.track,
        difficulty: fallbackSeed.difficulty,
        tasks: fallbackSeed.tasks,
        files: fallbackSeed.files,
      }).catch(() => fallbackSeed);
    } else if (project && (!project.files || project.files.length < 4)) {
      project.slug = fallbackSeed.slug;
      project.title = fallbackSeed.title;
      project.description = fallbackSeed.description;
      project.track = fallbackSeed.track;
      project.difficulty = fallbackSeed.difficulty;
      project.tasks = fallbackSeed.tasks as any;
      project.files = fallbackSeed.files as any;
      await project.save().catch(() => null);
    }
  } catch (dbError: any) {
    console.warn(
      `Database access failed for project ${slug}, using seed project:`,
      dbError?.message
    );
    project = fallbackSeed;
  }

  const finalProject = project || fallbackSeed;

  return NextResponse.json({
    success: true,
    data: finalProject,
  });
}

