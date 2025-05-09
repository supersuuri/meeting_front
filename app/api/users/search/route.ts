import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Authenticate request
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = await verifyToken(token);

    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // Get search parameter
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("email");

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Missing or invalid email query" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Search for users with email that matches the query (case insensitive)
    const users = await User.find({
      email: { $regex: query, $options: "i" },
    }).select("email username firstName lastName imageUrl");

    return NextResponse.json({
      success: true,
      users: users.map((user) => ({
        id: user._id,
        email: user.email,
        username: user.username,
        name:
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          user.username,
        imageUrl: user.imageUrl,
      })),
    });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
