// providers/StreamProvider.tsx
'use client';

import { useAuth } from "@/context/AuthContext";
import { StreamVideo, StreamVideoClient } from "@stream-io/video-react-sdk";
import { ReactNode, useEffect, useState } from "react";
import { tokenProvider } from '@/actions/stream.actions';
import Loading from "@/components/Loading";

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;

const StreamProvider = ({ children }: { children: ReactNode }) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    if (!API_KEY) throw new Error('Stream API key is missing');

    const initClient = async () => {
      try {
        const client = new StreamVideoClient({
          apiKey: API_KEY,
          user: {
            id: user.id,
            name: user.firstName || user.username || 'User',
            image: user.imageUrl,
          },
          tokenProvider,
        });

        setVideoClient(client);
      } catch (error) {
        console.error('Failed to initialize Stream client:', error);
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

  return (
    <StreamVideo client={videoClient}>
      {children}
    </StreamVideo>
  );
};

export default StreamProvider;