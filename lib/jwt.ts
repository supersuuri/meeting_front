import jwt from "jsonwebtoken";
import * as jose from "jose";

export function verifyToken(token: string) {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error(
        "CRITICAL: JWT_SECRET is not defined in environment variables."
      );
      // In a production environment, you might want to avoid leaking details,
      // but for development, this explicit error is helpful.
      throw new Error(
        "JWT_SECRET is not defined. Authentication system is misconfigured."
      );
    }
    const decoded = jwt.verify(token, secret);

    // Ensure we're returning the data in a consistent format
    // If decoded is an object with an id property, return it directly
    if (decoded && typeof decoded === "object" && "id" in decoded) {
      // Make sure the ID is a string to avoid format issues
      return {
        id: String(decoded.id),
      };
    }

    throw new Error("Invalid token format after verification");
  } catch (error) {
    // Log specific JWT errors, then rethrow
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.NotBeforeError
    ) {
      console.error(
        "Token verification failed:",
        error.name,
        "-",
        error.message
      );
    } else if (
      error instanceof Error &&
      error.message.startsWith("JWT_SECRET is not defined")
    ) {
      // Already logged, or handle as critical configuration error
    } else {
      console.error(
        "An unexpected error occurred during token verification:",
        error
      );
    }
    throw error; // Rethrow the error to be handled by the calling route
  }
}

export async function verifyTokenEdge(
  token: string
): Promise<{ id: string } | null> {
  const secretString = process.env.JWT_SECRET;
  if (!secretString) {
    console.error(
      "CRITICAL: JWT_SECRET is not defined in environment variables for Edge."
    );
    throw new Error(
      "JWT_SECRET is not defined. Authentication system is misconfigured for Edge."
    );
  }
  const secret = new TextEncoder().encode(secretString);

  try {
    const { payload } = await jose.jwtVerify(token, secret);
    if (payload && typeof payload.id === "string") {
      return { id: payload.id };
    }
    if (payload && typeof payload.id === "number") {
      return { id: String(payload.id) };
    }
    // If 'id' is present but not string/number, or payload structure is different
    // you might need to adjust this based on how your JWTs are structured.
    // For example, if your JWT payload is directly the user ID or an object containing it.
    // Assuming the payload itself might be what you need, or it contains an 'id'.
    // This part needs to match the structure of JWTs signed by `jsonwebtoken`
    // If `jsonwebtoken` signs { id: 'userId' }, then `payload.id` should work.
    console.error("Invalid token payload structure in Edge:", payload);
    return null;
  } catch (error) {
    console.error("Edge token verification failed:", error);
    return null;
  }
}
