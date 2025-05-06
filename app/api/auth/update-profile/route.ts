import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import mongoose from "mongoose";

// Define allowed avatars
const ALLOWED_AVATARS = [
  "/assets/images/avatar-1.svg",
  "/assets/images/avatar-2.svg",
  "/assets/images/avatar-3.svg",
  "/assets/images/avatar-4.svg",
  "/assets/images/avatar-5.svg",
];

export async function PUT(req: NextRequest) {
  try {
    // Get the auth token from the Authorization header
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    // Verify the token and get the user ID
    const payload = await verifyToken(token);
    if (!payload || !payload.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the updated profile data from the request body
    const { firstName, lastName, bio, imageUrl } = await req.json();

    // Validate avatar selection
    if (imageUrl && !ALLOWED_AVATARS.includes(imageUrl)) {
      return NextResponse.json(
        { success: false, message: "Invalid avatar selection" },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Get the MongoDB native driver db instance
    const db = mongoose.connection.db!;

    // Update the user profile in the database
    const result = await db.collection("users").updateOne(
      { _id: new mongoose.Types.ObjectId(payload.id) },
      {
        $set: {
          firstName,
          lastName,
          bio,
          imageUrl,
          updatedAt: new Date(),
        },
      }
    );

    // For debugging
    console.log("Update result:", result);

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred while updating profile" },
      { status: 500 }
    );
  }
}
