import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import User from "@/lib/models/User";

export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json(
        { success: false, user: null, message: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const user = await User.findById(session.userId).select("-passwordHash");

    if (!user) {
      return NextResponse.json(
        { success: false, user: null, message: "User not found" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
