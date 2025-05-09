import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Team from "@/models/Team";
import { verifyToken } from "@/lib/auth";
import mongoose from "mongoose";

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

  // Validate the id
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Invalid or missing team ID" },
      { status: 400 }
    );
  }

  try {
    const team = await Team.findOne({
      _id: id,
      $or: [
        { admins: decoded.id }, // <-- changed from admin to admins
        { members: decoded.id },
      ],
    });

    if (!team) {
      return NextResponse.json({ message: "Team not found" }, { status: 404 });
    }

    console.log("Server: Returning team data:", JSON.stringify(team, null, 2)); // <--- Add this log
    return NextResponse.json(team);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { message: "Internal server error", error: errMsg },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: teamId } = await params;
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }
  const decoded = await verifyToken(auth.split(" ")[1]);
  if (!decoded?.id) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  await connectToDatabase();

  // Validate the id
  if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
    return NextResponse.json(
      { message: "Invalid or missing team ID" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { name, description } = body;

  // Only allow the admin to update
  const team = await Team.findById(teamId);
  if (!team) {
    return NextResponse.json({ message: "Team not found" }, { status: 404 });
  }
  if (team.admin.toString() !== decoded.id) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  team.name = name ?? team.name;
  team.description = description ?? team.description;
  await team.save();

  return NextResponse.json(team);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

    // Only allow admin to delete the team
    const team = await Team.findById(id);
    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found" },
        { status: 404 }
      );
    }
    if (team.admin.toString() !== decoded.id) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    await Team.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const { id: teamId, memberId } = await params;
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, message: "Not authorized" },
      { status: 401 }
    );
  }
  const decoded = await verifyToken(auth.split(" ")[1]);
  if (!decoded?.id) {
    return NextResponse.json(
      { success: false, message: "Invalid token" },
      { status: 401 }
    );
  }

  await connectToDatabase();

  // Validate the id
  if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
    return NextResponse.json(
      { success: false, message: "Invalid or missing team ID" },
      { status: 400 }
    );
  }

  const team = await Team.findById(teamId);
  if (!team) {
    return NextResponse.json(
      { success: false, message: "Team not found" },
      { status: 404 }
    );
  }

  // Only team admin can add admins
  if (team.admin.toString() !== decoded.id) {
    return NextResponse.json(
      { success: false, message: "Only team admin can manage admin roles" },
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
}
