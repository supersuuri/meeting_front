// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./lib/jwt"; // Create this simple utility

export async function middleware(request: NextRequest) {
  // Get the token from cookies or headers
  const token = request.cookies.get("token")?.value;

  if (!token) {
    // Redirect to login or return unauthorized
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // Verify JWT without database access
    const payload = verifyToken(token);

    // Continue to the protected route
    return NextResponse.next();
  } catch (error) {
    // Invalid token
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/protected/:path*"], // Add your protected routes
};
