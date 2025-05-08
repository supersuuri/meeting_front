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
  const token = req.headers.get("authorization")?.split(" ")[1] || "";
  const decodedToken = await verifyToken(token);

  if (!decodedToken || !decodedToken.id) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }
  const userId = decodedToken.id; // Use the id from the validated token

  const { id } = await params; // Await params here

  try {
    await connectToDatabase();
    // Validate the id
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid or missing team ID" },
        { status: 400 }
      );
    }
    const team = await Team.findOne({
      _id: id,
      $or: [{ owner: userId }, { members: userId }],
    }).populate("members", "email");
    if (!team)
      return NextResponse.json({ message: "Not found" }, { status: 404 });

    console.log(
      "Server: Returning members data:",
      JSON.stringify({ members: team.members }, null, 2)
    ); // <--- Add this log
    return NextResponse.json({ members: team.members });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUser(req);
    const { email } = await req.json();
    const { id: teamId } = await paramsPromise; // Await paramsPromise here
    await connectToDatabase();
    const user = await User.findOne({ email });
    if (!user)
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    const team = await Team.findById(teamId);
    if (!team || team.owner.toString() !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (team.members.includes(user._id)) {
      return NextResponse.json(
        { message: "Already a member" },
        { status: 400 }
      );
    }
    team.members.push(user._id);
    await team.save();
    return NextResponse.json({ message: "Member added" });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 401 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUser(req);
    const { memberId } = await req.json();
    const { id: teamId } = await paramsPromise; // Await paramsPromise here
    await connectToDatabase();
    const team = await Team.findById(teamId);
    if (!team || team.owner.toString() !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    team.members = team.members.filter(
      (m: string) => m.toString() !== memberId
    );
    await team.save();
    return NextResponse.json({ message: "Member removed" });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 401 });
  }
}
