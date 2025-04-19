// providers/StreamProvider.tsx
"use client";

import { useAuth } from "@/context/AuthContext";
import { StreamVideo, StreamVideoClient } from "@stream-io/video-react-sdk";
import { ReactNode, useEffect, useState } from "react";
import { tokenProvider } from "@/actions/stream.actions";
import Loading from "@/components/Loading";

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;

const authConfig = {
  tokenProvider: async () => {
    try {
      const result = await tokenProvider();

      // Handle error object case
      if (result && typeof result !== "string" && result.error) {
        // Handle auth error - redirect to login
        window.location.href =
          "/login?redirect=" + encodeURIComponent(window.location.pathname);
        throw new Error("Authentication failed");
      }

      // Ensure we only return a string
      if (typeof result !== "string") {
        throw new Error("Token must be a string");
      }

      return result;
    } catch (error) {
      console.error("Token provider error:", error);
      throw error; // Re-throw to prevent client connection with invalid token
    }
  },
};

const StreamProvider = ({ children }: { children: ReactNode }) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    if (!API_KEY) {
      console.error("Stream API key is missing");
      return;
    }

    const initClient = async () => {
      try {
        const client = new StreamVideoClient({
          apiKey: API_KEY,
          user: {
            id: user.id,
            name: user.firstName || user.username || "User",
            image: user.imageUrl,
          },
          tokenProvider: authConfig.tokenProvider,
        });

        try {
          // Pass the user object to connectUser()
          await client.connectUser({
            id: user.id,
            name: user.firstName || user.username || "User",
            image: user.imageUrl,
          });
          setVideoClient(client);
        } catch (error) {
          console.error("Failed to connect user:", error);
          // Could redirect to login page here if needed
        }
      } catch (error) {
        console.error("Failed to initialize Stream client:", error);
      }
    };

    initClient();

    return () => {
      if (videoClient) {
        videoClient.disconnectUser();
        setVideoClient(undefined);
      }
    };
  }, [user, isAuthenticated, isLoading]);

  if (!videoClient) return <Loading />;

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};

export default StreamProvider;
