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

  // fetch the team, but don’t rely on populate alone for admins/admin
  const team = await Team.findById(id);
  if (!team) {
    return NextResponse.json({ message: "Team not found" }, { status: 404 });
  }

  // build one array of all user‐IDs (primary admin, extra admins, and members)
  const allIds = [team.admin, ...(team.admins || []), ...(team.members || [])]
    .filter(Boolean)
    .map((x) => new mongoose.Types.ObjectId(x));

  // load all those users
  const users = await User.find({ _id: { $in: allIds } }).select(
    "-password -__v"
  );

  return NextResponse.json({ members: users });
}

export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUser(req);
    const { email, role } = await req.json();
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }
    const { id: teamId } = await paramsPromise; // Await paramsPromise here
    await connectToDatabase();
    const team = await Team.findById(teamId);
    if (!team || team.admin.toString() !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (team.members.includes(user._id)) {
      return NextResponse.json(
        { message: "Already a member" },
        { status: 400 }
      );
    }
    team.members.push(user._id);
    if (role === "admin") {
      if (!team.admins) team.admins = [];
      if (!team.admins.includes(user._id)) {
        team.admins.push(user._id);
      }
      team.admins.push(user._id);
    }
    await team.save();
    return NextResponse.json({ success: true, message: "Member added" });
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
    if (!team || team.admin.toString() !== userId) {
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

