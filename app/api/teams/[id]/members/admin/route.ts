import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";
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
      team.admins.push(new ObjectId(memberId)); // Add to admins array

      // Remove the user from the members array, as they are now an admin
      team.members = team.members.filter(
        (member_id_in_array: mongoose.Types.ObjectId) =>
          member_id_in_array.toString() !== memberId
      );

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
  const { id: teamIdString } = await params; // renamed for clarity
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
    const team = await Team.findById(teamIdString); // Use Mongoose model

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

    // Prevent demoting the last admin
    if (
      team.admins.map(String).includes(memberId) &&
      team.admins.length === 1
    ) {
      return NextResponse.json(
        { success: false, message: "Cannot demote the last admin." },
        { status: 400 }
      );
    }

    // Remove user from admins array
    team.admins = team.admins.filter(
      (admin_id: mongoose.Types.ObjectId) => admin_id.toString() !== memberId
    );
    await team.save();

    return NextResponse.json({
      success: true,
      message: "Admin role removed successfully",
      team,
    });
  } catch (error) {
    console.error("Error removing admin:", error);
    return NextResponse.json(
      { success: false, message: "Failed to remove admin" },
      { status: 500 }
    );
  }
}
