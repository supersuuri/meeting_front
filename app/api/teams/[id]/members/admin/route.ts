import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";
import Team from "@/models/Team";

// Define runtime for this API route
export const runtime = "nodejs";

// Add member as admin
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  let body;
  try {
    body = await request.json();
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
    const teamId = id;
    const team = await Team.findById(teamId);

    if (!team || !team.admins) {
      return NextResponse.json(
        { success: false, message: "Team or team admins not found" },
        { status: 404 }
      );
    }

    // Only a current admin can add admins
    if (!team.admins.map(String).includes(decoded.id)) {
      return NextResponse.json(
        { success: false, message: "Only team admins can manage admin roles" },
        { status: 403 }
      );
    }

    // Add user to admins array if not already there
    if (!team.admins.map(String).includes(memberId)) {
      team.admins.push(memberId);
      await team.save();
    }

    return NextResponse.json({
      success: true,
      message: "Admin added successfully",
      team,
    });
  } catch (error) {
    console.error("Error adding admin:", error, { teamId: id, body });
    return NextResponse.json(
      { success: false, message: "Failed to add admin" },
      { status: 400 }
    );
  }
}

// Remove member from admin role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    const teamId = id;

    const team = await db.collection("teams").findOne({
      _id: new ObjectId(teamId),
    });

    if (!team || !team.admins) {
      return NextResponse.json(
        { success: false, message: "Team or team admins not found" },
        { status: 404 }
      );
    }

    // Only a current admin can remove admins
    if (!team.admins.map(String).includes(decoded.id)) {
      return NextResponse.json(
        { success: false, message: "Only team admins can manage admin roles" },
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
