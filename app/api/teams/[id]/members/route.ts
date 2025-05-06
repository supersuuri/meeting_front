import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Team from "@/models/Team";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import mongoose from "mongoose";

// Add member to team
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id: teamId } = resolvedParams;

    // Authenticate the request
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

    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection failed");
    }

    // Now you can safely use db
    const team = await db.collection("teams").findOne({
      _id: new mongoose.Types.ObjectId(teamId),
    });

    // Get request body
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if team exists and the requester is the owner or an admin
    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to add members
    const isOwner = team.ownerId.toString() === decoded.id;
    const isAdmin =
      team.admins &&
      team.admins.some(
        (adminId: mongoose.Types.ObjectId) => adminId.toString() === decoded.id
      );

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authorized to add members to this team",
        },
        { status: 403 }
      );
    }

    // Check if the user exists
    const user = await db.collection("users").findOne({
      _id: new mongoose.Types.ObjectId(userId),
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is already a member
    if (
      team.members &&
      team.members.some(
        (memberId: mongoose.Types.ObjectId) => memberId.toString() === userId
      )
    ) {
      return NextResponse.json(
        { success: false, message: "User is already a member of this team" },
        { status: 400 }
      );
    }

    // Add user to team members
    await db
      .collection("teams")
      .updateOne(
        { _id: new mongoose.Types.ObjectId(teamId) },
        { $addToSet: { members: new mongoose.Types.ObjectId(userId) } }
      );

    return NextResponse.json({
      success: true,
      message: "Team member added successfully",
    });
  } catch (error) {
    console.error("Error adding team member:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// Remove member from team
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  try {
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

    await connectToDatabase();

    // Find the team
    const team = await Team.findById(id);

    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found" },
        { status: 404 }
      );
    }

    // Check if requester is the owner
    if (team.owner !== decoded.id) {
      return NextResponse.json(
        { success: false, message: "Only the team owner can remove members" },
        { status: 403 }
      );
    }

    const { userId } = await req.json();

    // Cannot remove the owner from members
    if (userId === team.owner) {
      return NextResponse.json(
        { success: false, message: "Cannot remove the team owner" },
        { status: 400 }
      );
    }

    // Remove member
    team.members = team.members.filter(
      (memberId: string) => memberId !== userId
    );
    await team.save();

    return NextResponse.json({ success: true, team });
  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// Get team members
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  try {
    const authHeader = request.headers.get("authorization");
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

    await connectToDatabase();

    // Check if user is a member of the team (not just the owner)
    const team = await Team.findOne({
      _id: id,
      $or: [{ owner: decoded.id }, { members: decoded.id }],
    });

    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found or you are not a member" },
        { status: 404 }
      );
    }

    // Get team members with user details
    const members = await User.find(
      { _id: { $in: team.members } },
      { password: 0 } // Exclude password field
    );

    // Add owner to the list if not already included
    const ownerIncluded = members.some(
      (member) => member._id.toString() === team.owner.toString()
    );

    let allMembers = [...members];
    if (!ownerIncluded) {
      const owner = await User.findById(team.owner, { password: 0 });
      if (owner) {
        allMembers.unshift(owner);
      }
    }

    return NextResponse.json({
      success: true,
      members: allMembers,
      owner: team.owner,
    });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
