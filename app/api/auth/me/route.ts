// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken } from "@/lib/jwt";
import { JsonWebTokenError } from "jsonwebtoken";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  try {
    const decoded = verifyToken(auth.split(" ")[1]) as { id: string };

    await connectToDatabase();
    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          _id: user._id,
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          bio: user.bio,
          imageUrl: user.imageUrl,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    // The verifyToken utility from @/lib/jwt already logs specific JWT errors,
    // including TokenExpiredError. We can avoid re-logging it here.
    // console.error("Get user error:", error); // This line can be removed or commented out

    if (error.name === "TokenExpiredError") {
      return NextResponse.json({ message: "Token expired" }, { status: 401 });
    }
    // For other JWT-related errors (e.g., malformed token) or configuration issues
    // that verifyToken might throw and log.
    if (
      error instanceof JsonWebTokenError ||
      error.message === "Invalid token format after verification" ||
      error.message.startsWith("JWT_SECRET is not defined")
    ) {
      // These are typically authentication/authorization issues.
      // verifyToken likely logged the specifics.
      return NextResponse.json({ message: "Not authorized" }, { status: 401 });
    }

    // For any other unexpected errors that were not logged by verifyToken:
    console.error("Unexpected error in /api/auth/me route:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
