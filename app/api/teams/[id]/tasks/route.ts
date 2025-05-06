import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import ProjectTask from "@/models/ProjectTask";
import Team from "@/models/Team";
import { verifyToken } from "@/lib/auth";

// Get tasks for a specific team
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

    // Check if user is a member of the team
    const team = await Team.findOne({
      _id: id,
      members: decoded.id,
    });

    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found or you are not a member" },
        { status: 404 }
      );
    }

    // Get tasks for the team
    const tasks = await ProjectTask.find({ teamId: id }).sort({
      startDate: 1,
    });

    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    console.error("Error fetching team tasks:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// POST handler should be updated to:
export async function POST(
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

    // Check if user is a member of the team
    const team = await Team.findOne({
      _id: id,
      members: decoded.id,
    });

    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found or you are not a member" },
        { status: 404 }
      );
    }

    const taskData = await req.json();

    // Create task for the team
    const task = await ProjectTask.create({
      ...taskData,
      teamId: id,
    });

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (error) {
    console.error("Error creating team task:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
