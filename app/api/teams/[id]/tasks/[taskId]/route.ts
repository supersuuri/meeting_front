import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import ProjectTask from "@/models/ProjectTask";
import Team from "@/models/Team";
import { verifyToken } from "@/lib/auth"; // Assuming this is your JWT verification utility
import mongoose from "mongoose";

export const runtime = "nodejs";

// PATCH handler to update a specific task in a team (Renamed from PUT back to PATCH)
export async function PATCH( 
  req: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  // console.log(`>>> PUT handler invoked...`) should be changed to PATCH if you keep it
  console.log(`>>> PATCH handler invoked for /api/teams/${params.id}/tasks/${params.taskId}`); 
  const { id: teamId, taskId } = params;

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Not authorized, no token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = await verifyToken(token);
    if (!decoded?.id) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(teamId) ||
      !mongoose.Types.ObjectId.isValid(taskId)
    ) {
      console.error("Invalid teamId or taskId format");
      return NextResponse.json(
        { success: false, message: "Invalid team or task ID format" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const team = await Team.findOne({ _id: teamId });
    if (!team) {
      console.error(`Team not found for teamId: ${teamId}`);
      return NextResponse.json(
        { success: false, message: "Team not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    // console.log("Received body for PUT:...") should be changed to PATCH if you keep it
    console.log("Received body for PATCH:", JSON.stringify(body, null, 2));

    const { name, startDate, endDate, progress, type, assignedTo } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (progress !== undefined) updateData.progress = Number(progress);
    if (type !== undefined) updateData.type = type;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;

    console.log("Constructed updateData (before progress recalc):", JSON.stringify(updateData, null, 2));
    
    if (body.startDate && body.endDate && body.progress === undefined) {
        console.log("Recalculating progress because body.progress was undefined.");
        const start = new Date(body.startDate);
        const end = new Date(body.endDate);
        const today = new Date();
        if (today >= end) {
            updateData.progress = 100;
        } else if (today > start) {
            const totalDuration = end.getTime() - start.getTime();
            const completedDuration = today.getTime() - start.getTime();
            updateData.progress = Math.max(0, Math.min(100, Math.round((completedDuration / totalDuration) * 100)));
        } else {
            updateData.progress = 0;
        }
        console.log("Recalculated updateData.progress:", updateData.progress);
    } else if (body.progress !== undefined) {
        updateData.progress = Number(body.progress);
        console.log("Using progress from body:", updateData.progress);
    }

    console.log("Final updateData (before DB call):", JSON.stringify(updateData, null, 2));

    if (Object.keys(updateData).length === 0) {
      console.log("updateData is empty. No update will be performed. Returning original task.");
      const originalTask = await ProjectTask.findOne({ _id: taskId, teamId: teamId });
      if (!originalTask) {
        return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, task: originalTask, message: "No changes detected to update" });
    }

    const updatedTaskDoc = await ProjectTask.findOneAndUpdate(
      { _id: taskId, teamId: teamId },
      { $set: updateData },
      { new: true }
    );

    console.log("Result from findOneAndUpdate:", JSON.stringify(updatedTaskDoc, null, 2));

    if (!updatedTaskDoc) {
      console.error("Task not found with findOneAndUpdate or no document was modified.");
      return NextResponse.json(
        { success: false, message: "Task not found in this team or could not be updated" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, task: updatedTaskDoc });
  } catch (error) {
    console.error("Error updating task:", error);
    const message = error instanceof Error ? error.message : "Server error during task update";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

// DELETE handler to delete a specific task in a team
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  console.log(`>>> DELETE handler invoked for /api/teams/${params.id}/tasks/${params.taskId}`);
  const { id: teamId, taskId } = params;

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Not authorized, no token provided" },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(" ")[1];
    const decoded = await verifyToken(token);
    if (!decoded?.id) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(teamId) ||
      !mongoose.Types.ObjectId.isValid(taskId)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid team or task ID format" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const team = await Team.findOne({ _id: teamId });
    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found" },
        { status: 404 }
      );
    }

    const deletedTask = await ProjectTask.findOneAndDelete({
      _id: taskId,
      teamId: teamId, 
    });

    if (!deletedTask) {
      return NextResponse.json(
        { success: false, message: "Task not found in this team or could not be deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}