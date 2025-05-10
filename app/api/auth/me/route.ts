// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken } from "@/lib/jwt";

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
          _id: user._id, // MongoDB uses _id, but Stream expects id
          id: user._id.toString(), // Add this line to include id
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          bio: user.bio, // Make sure this is included
          imageUrl: user.imageUrl,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Get user error:", error);
    // expired JWT
    if (error.name === "TokenExpiredError") {
      return NextResponse.json({ message: "Token expired" }, { status: 401 });
    }
    // all other token errors
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }
}
