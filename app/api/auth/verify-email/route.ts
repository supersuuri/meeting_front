// app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, message: "No verification token provided." },
        { status: 400 }
      );
    }

    // Find user by verification token and check expiration
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }, // Ensure token hasn't expired
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired verification token." },
        { status: 400 }
      );
    }

    // Mark user as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = null; // Clear token
    user.emailVerificationExpires = null; // Clear expiration
    await user.save();

    // Redirect to a success page or return a response
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    return NextResponse.redirect(`${baseUrl}/login?verified=true`); // Or JSON response
    // return NextResponse.json(
    //   { success: true, message: 'Email verified successfully.' },
    //   { status: 200 }
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { success: false, message: "Server error during verification." },
      { status: 500 }
    );
  }
}
