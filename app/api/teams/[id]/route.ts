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
      $or: [{ owner: decoded.id }, { members: decoded.id }],
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
