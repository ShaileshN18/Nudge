import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Project from "@/lib/models/Project";
import {
  authSeedProject,
  feedbackBoardSeedProject,
  allSeedProjects,
} from "@/lib/seedProject";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();

    // Ensure all seed projects exist in MongoDB
    for (const seed of allSeedProjects) {
      let dbProj = await Project.findOne({ slug: seed.slug });
      if (!dbProj || !dbProj.files || dbProj.files.length < 4) {
        if (dbProj) {
          dbProj.title = seed.title;
          dbProj.description = seed.description;
          dbProj.track = seed.track;
          dbProj.difficulty = seed.difficulty;
          dbProj.tasks = seed.tasks as any;
          dbProj.files = seed.files as any;
          await dbProj.save().catch(() => null);
        } else {
          await Project.create({
            slug: seed.slug,
            title: seed.title,
            description: seed.description,
            track: seed.track,
            difficulty: seed.difficulty,
            tasks: seed.tasks,
            files: seed.files,
          }).catch(() => null);
        }
      }
    }

    const projectsList = await Project.find({}).sort({ createdAt: 1 });
    const finalProjects =
      projectsList && projectsList.length > 0 ? projectsList : allSeedProjects;

    return NextResponse.json({
      success: true,
      count: finalProjects.length,
      data: finalProjects,
    });
  } catch (error: any) {
    // Graceful fallback to in-memory seed projects if DB connection fails
    return NextResponse.json({
      success: true,
      count: allSeedProjects.length,
      data: allSeedProjects,
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

