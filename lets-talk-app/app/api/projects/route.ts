import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import ProjectTask from "@/models/ProjectTask";
import { verifyToken } from "@/lib/auth";

// Get all project tasks for the authenticated user
export async function GET(req: NextRequest) {
  try {
    // Get token from authorization header
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
    const tasks = await ProjectTask.find({ userId: decoded.id }).sort({
      startDate: 1,
    });

    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    console.error("Error fetching project tasks:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// Create a new project task
export async function POST(req: NextRequest) {
  try {
    // Get token from authorization header
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

    const taskData = await req.json();

    await connectToDatabase();
    const task = await ProjectTask.create({
      ...taskData,
      userId: decoded.id,
    });

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (error) {
    console.error("Error creating project task:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
