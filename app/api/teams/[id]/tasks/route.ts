import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import ProjectTask from "@/models/ProjectTask";
import Team from "@/models/Team";
import { verifyToken } from "@/lib/auth";
import mongoose from "mongoose";

// Get tasks for a specific team
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

  // Get tasks for the team
  const tasks = await ProjectTask.find({ teamId: id }).sort({ createdAt: -1 });
  return NextResponse.json({ success: true, tasks });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer "))
    return NextResponse.json(
      { success: false, message: "Not authorized" },
      { status: 401 }
    );

  const decoded = await verifyToken(auth.split(" ")[1]);
  if (!decoded?.id)
    return NextResponse.json(
      { success: false, message: "Invalid token" },
      { status: 401 }
    );

  if (!mongoose.Types.ObjectId.isValid(id))
    return NextResponse.json(
      { success: false, message: "Invalid team ID" },
      { status: 400 }
    );

  await connectToDatabase();

  // ensure user is on the team
  const team = await Team.findOne({ _id: id, members: decoded.id });
  if (!team)
    return NextResponse.json(
      { success: false, message: "Team not found or access denied" },
      { status: 404 }
    );

  const taskData = await req.json();
  const task = await ProjectTask.create({ ...taskData, teamId: id });

  return NextResponse.json({ success: true, task }, { status: 201 });
}
