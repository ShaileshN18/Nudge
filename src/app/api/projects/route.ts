import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Project from "@/lib/models/Project";
import { authSeedProject } from "@/lib/seedProject";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();

    // Ensure the seed project exists and has all files in MongoDB
    let dbProject = await Project.findOne({
      $or: [{ slug: "build-auth" }, { slug: "build-express-mongodb-auth" }],
    });

    if (!dbProject || !dbProject.files || dbProject.files.length < 5) {
      if (dbProject) {
        dbProject.slug = authSeedProject.slug;
        dbProject.title = authSeedProject.title;
        dbProject.description = authSeedProject.description;
        dbProject.track = authSeedProject.track;
        dbProject.difficulty = authSeedProject.difficulty;
        dbProject.tasks = authSeedProject.tasks as any;
        dbProject.files = authSeedProject.files as any;
        await dbProject.save().catch(() => null);
      } else {
        dbProject = await Project.create({
          slug: authSeedProject.slug,
          title: authSeedProject.title,
          description: authSeedProject.description,
          track: authSeedProject.track,
          difficulty: authSeedProject.difficulty,
          tasks: authSeedProject.tasks,
          files: authSeedProject.files,
        }).catch(() => null);
      }
    }

    const projectsList = dbProject ? [dbProject] : [authSeedProject];

    return NextResponse.json({
      success: true,
      count: projectsList.length,
      data: projectsList,
    });
  } catch (error: any) {
    // Graceful fallback to in-memory seed project if DB connection fails
    return NextResponse.json({
      success: true,
      count: 1,
      data: [authSeedProject],
    });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const project = await Project.create(body);

    return NextResponse.json(
      { success: true, data: project },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

