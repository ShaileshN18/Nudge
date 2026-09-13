import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Project from "@/lib/models/Project";
import { authSeedProject } from "@/lib/seedProject";

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

  // Normalize slug: whether user accesses "build-auth" or "build-express-mongodb-auth" or "build_auth"
  const isAuthSlug =
    slug === "build-auth" ||
    slug === "build_auth" ||
    slug === "build-express-mongodb-auth" ||
    slug === "default" ||
    !slug;

  let project = null;

  try {
    await connectToDatabase();
    project = await Project.findOne({
      $or: [{ slug }, { slug: "build-auth" }, { slug: "build_auth" }, { slug: "build-express-mongodb-auth" }],
    });

    if (!project && isAuthSlug) {
      project = await Project.create({
        slug: authSeedProject.slug,
        title: authSeedProject.title,
        description: authSeedProject.description,
        track: authSeedProject.track,
        difficulty: authSeedProject.difficulty,
        tasks: authSeedProject.tasks,
        files: authSeedProject.files,
      }).catch(() => authSeedProject);
    } else if (project && (!project.files || project.files.length < 5)) {
      project.slug = authSeedProject.slug;
      project.title = authSeedProject.title;
      project.description = authSeedProject.description;
      project.track = authSeedProject.track;
      project.difficulty = authSeedProject.difficulty;
      project.tasks = authSeedProject.tasks as any;
      project.files = authSeedProject.files as any;
      await project.save().catch(() => null);
    }
  } catch (dbError: any) {
    console.warn(`Database access failed for project ${slug}, using seed project:`, dbError?.message);
    project = authSeedProject;
  }

  const finalProject = project || authSeedProject;

  return NextResponse.json({
    success: true,
    data: finalProject,
  });
}

