import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Note from "@/models/Note";
import { verifyToken } from "@/lib/jwt"; // Assuming you might want to protect this

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 401 }
      );
    }

    // You might want to verify the token here as well for consistency
    // const token = authHeader.split(" ")[1];
    // const decoded = await verifyToken(token);
    // if (!decoded || !decoded.id) {
    //   return NextResponse.json(
    //     { success: false, message: "Invalid token" },
    //     { status: 401 }
    //   );
    // }

    await connectToDatabase();
    const routeParams = await params; // Await params here
    const teamId = routeParams.id; // Use the awaited params

    if (!teamId) {
      return NextResponse.json(
        { success: false, message: "Team ID is required" },
        { status: 400 }
      );
    }

    // Fetch distinct tags for the given teamId
    // Ensure your Note model and schema are correctly defined for this query
    const uniqueTags = await Note.distinct("tags", { teamId: teamId });

    // Filter out any null, undefined, or empty string tags that might be in the database
    const cleanedTags = uniqueTags.filter(
      (tag) => typeof tag === "string" && tag.trim() !== ""
    );

    return NextResponse.json(
      { success: true, tags: cleanedTags },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching unique tags:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
