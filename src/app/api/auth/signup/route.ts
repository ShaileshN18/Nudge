import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { hashPassword, signToken, authCookieOptions, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Secure password hashing
    const passwordHash = await hashPassword(password);

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    const tokenPayload = {
      userId: newUser._id.toString(),
      email: newUser.email,
      name: newUser.name,
    };

    const token = await signToken(tokenPayload);

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
        },
      },
      { status: 201 }
    );

    // Set HTTP-only cookie
    response.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions);

    return response;
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create account" },
      { status: 500 }
    );
  }
}
