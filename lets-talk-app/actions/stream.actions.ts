// actions/stream.actions.ts
'use server';

import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { StreamClient } from "@stream-io/node-sdk";
import { verifyToken } from '@/lib/auth';

const streamApiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const streamSecretKey = process.env.STREAM_SECRET_KEY;

export const tokenProvider = async () => {
  try {
    // Get JWT token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    // Verify the token and get user ID
    const user = await verifyToken(token);
    if (!user) {
      throw new Error('User is not authenticated');
    }

    if (!streamApiKey) throw new Error('Stream API key is missing');
    if (!streamSecretKey) throw new Error('Stream API secret is missing');

    const client = new StreamClient(streamApiKey, streamSecretKey);
    const userId = user.id;

    // Token is valid for an hour
    const validity = 60 * 60;
    const streamToken = client.generateUserToken({
      user_id: userId,
      validity_in_seconds: validity
    });

    return streamToken as string;
  } catch (error) {
    console.error('Token provider error:', error);
    throw new Error('Failed to provide Stream token');
  }
};