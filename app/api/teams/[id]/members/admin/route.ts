import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";

// Define runtime for this API route
export const runtime = "nodejs";

// Add member as admin
export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { memberId } = body;
    const token = request.headers.get("authorization")?.split(" ")[1] || "";
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const db = (global as any).mongo.db;
    const teamId = context.params.id;

    const team = await db.collection("teams").findOne({
      _id: new ObjectId(teamId),
    });

    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found" },
        { status: 404 }
      );
    }

    // Only team owner can add admins
    if (team.ownerId.toString() !== decoded.id) {
      return NextResponse.json(
        { success: false, message: "Only team owner can manage admin roles" },
        { status: 403 }
      );
    }

    // Add user to admins array if not already there
    const updatedTeam = await db
      .collection("teams")
      .findOneAndUpdate(
        { _id: new ObjectId(teamId) },
        { $addToSet: { admins: new ObjectId(memberId) } },
        { returnDocument: "after" }
      );

    return NextResponse.json({
      success: true,
      message: "Admin added successfully",
      team: updatedTeam.value,
    });
  } catch (error) {
    console.error("Error adding admin:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add admin" },
      { status: 500 }
    );
  }
}

// Remove member from admin role
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { memberId } = body;
    const token = request.headers.get("authorization")?.split(" ")[1] || "";
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const db = (global as any).mongo.db;
    const teamId = context.params.id;

    const team = await db.collection("teams").findOne({
      _id: new ObjectId(teamId),
    });

    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found" },
        { status: 404 }
      );
    }

    // Only team owner can remove admins
    if (team.ownerId.toString() !== decoded.id) {
      return NextResponse.json(
        { success: false, message: "Only team owner can manage admin roles" },
        { status: 403 }
      );
    }

    // Remove user from admins array
    const updatedTeam = await db
      .collection("teams")
      .findOneAndUpdate(
        { _id: new ObjectId(teamId) },
        { $pull: { admins: new ObjectId(memberId) } },
        { returnDocument: "after" }
      );

    return NextResponse.json({
      success: true,
      message: "Admin removed successfully",
      team: updatedTeam.value,
    });
  } catch (error) {
    console.error("Error removing admin:", error);
    return NextResponse.json(
      { success: false, message: "Failed to remove admin" },
      { status: 500 }
    );
  }
}
