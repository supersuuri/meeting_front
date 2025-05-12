import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Team from "@/models/Team";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import mongoose from "mongoose";

async function requireUser(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) throw new Error("Not authorized");
  const decoded = await verifyToken(auth.split(" ")[1]);
  if (!decoded?.id) throw new Error("Invalid token");
  return decoded.id;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }
  const decoded = await verifyToken(auth.split(" ")[1]);
  if (!decoded?.id) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  await connectToDatabase();

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Invalid or missing team ID" },
      { status: 400 }
    );
  }

  const team = await Team.findById(id);
  if (!team) {
    return NextResponse.json({ message: "Team not found" }, { status: 404 });
  }

  // build one array of all user‐IDs (admins and members)
  const allUserIds = [
    ...new Set(
      [...(team.admins || []), ...(team.members || [])] // Use Set to avoid duplicates if a user is both admin and member explicitly
        .filter(Boolean)
        .map((x) => new mongoose.Types.ObjectId(x.toString()))
    ),
  ]; // Ensure mapping to ObjectId

  const users = await User.find({ _id: { $in: allUserIds } }).select(
    "-password -__v"
  );

  return NextResponse.json({ members: users });
}

export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUserId = await requireUser(req); // Renamed to currentUserId for clarity
    const { email, role } = await req.json(); // role is "member" or "admin"
    const userToAdd = await User.findOne({ email }); // Renamed to userToAdd
    if (!userToAdd) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }
    const { id: teamId } = await paramsPromise;
    await connectToDatabase();
    const team = await Team.findById(teamId);

    if (!team) {
      return NextResponse.json({ message: "Team not found" }, { status: 404 });
    }
    // Only admins can add members
    if (!team.admins || !team.admins.map(String).includes(currentUserId)) {
      return NextResponse.json(
        { message: "Forbidden: Only admins can add members" },
        { status: 403 }
      );
    }

    const userToAddIdStr = userToAdd._id.toString();
    const userToAddObjectId = userToAdd._id;

    // Ensure arrays exist on the team document
    if (!team.members) {
      team.members = [];
    }
    if (!team.admins) {
      team.admins = [];
    }

    const isCurrentlyMember = team.members
      .map((id: mongoose.Types.ObjectId) => id.toString())
      .includes(userToAddIdStr);
    const isCurrentlyAdmin = team.admins
      .map((id: mongoose.Types.ObjectId) => id.toString())
      .includes(userToAddIdStr);

    if (role === "admin") {
      if (isCurrentlyAdmin) {
        return NextResponse.json(
          { message: "User is already an admin." },
          { status: 400 }
        );
      }
      // Add to admins array if not already there
      if (!team.admins.map((id: mongoose.Types.ObjectId) => id.toString()).includes(userToAddIdStr)) {
        team.admins.push(userToAddObjectId);
      }
      // If they were a regular member, remove them from members list (promotion)
      if (isCurrentlyMember) {
        team.members = team.members.filter(
          (id: mongoose.Types.ObjectId) => id.toString() !== userToAddIdStr
        );
      }
    } else {
      // role === "member"
      if (isCurrentlyMember) {
        return NextResponse.json(
          { message: "User is already a member." },
          { status: 400 }
        );
      }
      // If they are currently an admin, prevent adding as a regular member via this endpoint.
      // Demotion should be a separate action.
      if (isCurrentlyAdmin) {
        return NextResponse.json(
          {
            message:
              "User is currently an admin. To make them a regular member, please use the demote action.",
          },
          { status: 400 }
        );
      }
      // Add to members array
      if (!team.members.map((id: mongoose.Types.ObjectId) => id.toString()).includes(userToAddIdStr)) {
        team.members.push(userToAddObjectId);
      }
    }

    await team.save();
    return NextResponse.json({
      success: true,
      message: "Member processed successfully.",
    });
  } catch (e: any) {
    console.error("Error processing member:", e);
    return NextResponse.json(
      { message: e.message || "Failed to process member" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUserId = await requireUser(req); // Renamed for clarity
    const { memberId } = await req.json(); // ID of member to remove
    const { id: teamId } = await paramsPromise;
    await connectToDatabase();
    const team = await Team.findById(teamId);

    if (!team) {
      return NextResponse.json({ message: "Team not found" }, { status: 404 });
    }
    // Only admins can remove members
    if (!team.admins || !team.admins.map(String).includes(currentUserId)) {
      return NextResponse.json(
        { message: "Forbidden: Only admins can remove members" },
        { status: 403 }
      );
    }

    // Prevent removing the last admin if they are removing themselves or another last admin
    if (
      team.admins.map(String).includes(memberId) &&
      team.admins.length === 1
    ) {
      return NextResponse.json(
        { message: "Cannot remove the last admin." },
        { status: 400 }
      );
    }

    team.members = team.members.filter(
      (m: mongoose.Types.ObjectId) => m.toString() !== memberId
    );
    // Also remove from admins array if they were an admin
    if (team.admins) {
      team.admins = team.admins.filter(
        (adminId: mongoose.Types.ObjectId) => adminId.toString() !== memberId
      );
    }

    await team.save();
    return NextResponse.json({ message: "Member removed" });
  } catch (e: any) {
    console.error("Error removing member:", e);
    return NextResponse.json(
      { message: e.message || "Failed to remove member" },
      { status: 500 }
    );
  }
}

