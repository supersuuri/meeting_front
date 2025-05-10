// lib/auth.ts
import jwt, { TokenExpiredError } from "jsonwebtoken";
import connectToDatabase from "./mongodb";
import User from "@/models/User";

export async function verifyToken(
  token: string
): Promise<{ id: string } | null> {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };

    // optional: verify user still exists
    await connectToDatabase();
    const user = await User.findById(decoded.id);
    if (!user) {
      console.error("User not found for token:", decoded.id);
      return null;
    }

    return { id: decoded.id };
  } catch (err: any) {
    if (err instanceof TokenExpiredError) {
      console.error("JWT expired:", err);
    } else {
      console.error("JWT verification failed:", err);
    }
    return null;
  }
}
