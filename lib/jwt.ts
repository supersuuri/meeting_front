import jwt from "jsonwebtoken";

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
