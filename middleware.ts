// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyTokenEdge } from "./lib/jwt"; // Changed from verifyToken

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const payload = await verifyTokenEdge(token); // Use the new Edge-compatible function

    if (!payload) {
      console.log("Middleware: Invalid or expired token (Edge verification)");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Optionally, you can add the payload to headers if needed by your pages
    // const requestHeaders = new Headers(request.headers);
    // requestHeaders.set('x-user-id', payload.id);
    // return NextResponse.next({
    //   request: {
    //     headers: requestHeaders,
    //   },
    // });

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/protected/:path*"], // Add your protected routes
};
