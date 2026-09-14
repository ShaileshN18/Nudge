import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import Project from "@/lib/models/Project";
import UserProject from "@/lib/models/UserProject";
import { allSeedProjects } from "@/lib/seedProject";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || !session.userId) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    await connectToDatabase();

    const userProjects = await UserProject.find({
      userId: session.userId,
    }).sort({ updatedAt: -1 });

    if (!userProjects || userProjects.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Map project slugs to metadata from DB or seed
    const allDbProjects = await Project.find({});
    const projectMap = new Map<string, any>();

    allSeedProjects.forEach((p) => {
      projectMap.set(p.slug, p);
    });
    allDbProjects.forEach((p) => {
      projectMap.set(p.slug, p);
    });

    const enrolledList = userProjects.map((up) => {
      const meta = projectMap.get(up.projectSlug) || {};
      const totalTasks = meta.tasks?.length || 5;
      const completedCount = up.completedTasks?.length || 0;
      const progressPercent = Math.min(
        100,
        Math.round((completedCount / totalTasks) * 100)
      );

      return {
        _id: up._id,
        projectSlug: up.projectSlug,
        title: meta.title || up.projectSlug,
        description: meta.description || "",
        track: meta.track || "fullstack",
        difficulty: meta.difficulty || "intermediate",
        totalTasks,
        completedTasksCount: completedCount,
        progressPercent,
        currentTaskIndex: up.currentTaskIndex || 0,
        lastActiveAt: up.lastActiveAt || up.updatedAt,
        filesCount: up.files?.length || 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: enrolledList,
    });
  } catch (error: any) {
    console.error("Error fetching user's enrolled projects:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch user projects" },
      { status: 500 }
    );
  }
}
