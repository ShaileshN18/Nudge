import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Project from "@/models/Project";

export async function GET() {
  try {
    await connectToDatabase();
    const projects = await Project.find({}).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
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
