// actions/stream.actions.ts
"use server";

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { StreamClient } from "@stream-io/node-sdk";
import { verifyToken } from "@/lib/auth";

const streamApiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const streamSecretKey = process.env.STREAM_SECRET_KEY;

export const tokenProvider = async () => {
  try {
    // Get JWT token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    
    // If no token in cookies, we can't get a Stream token
    if (!token) {
      console.error("Authentication token not found in cookies");
      // Don't throw here if you want to handle this at the UI level
      // Instead, return a specific error object
      return { error: "Authentication token not found" };
    }

    // Rest of your existing code
    const user = await verifyToken(token);
    if (!user) {
      console.error("Invalid authentication token");
      return { error: "Invalid authentication token" };
    }

    if (!streamApiKey) throw new Error("Stream API key is missing");
    if (!streamSecretKey) throw new Error("Stream API secret is missing");

    const client = new StreamClient(streamApiKey, streamSecretKey);
    const userId = user.id;

    const validity = 60 * 60;
    const streamToken = client.generateUserToken({
      user_id: userId,
      validity_in_seconds: validity,
    });

    return streamToken;
  } catch (error) {
      console.error("Token provider specific error:", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Internal error" };
  }
};
