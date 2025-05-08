"use client";

import { useAuth } from "@/context/AuthContext";
import Alert from "@/components/Alert";
import Loading from "@/components/Loading";
import MeetingRoom from "@/components/MeetingRoom";
import MeetingSetup from "@/components/MeetingSetup";
import { useGetCallById } from "@/hooks/useGetCallById";
import { StreamCall, StreamTheme } from "@stream-io/video-react-sdk";
import { useParams } from "next/navigation";
import { useState } from "react";

const MeetingPage = () => {
  const params = useParams<{ id: string }>(); // Get the params object

  // Check if params or params.id is missing
  if (!params?.id) {
    // Return a loading state or an error message.
    // You might want to use your <Loading /> component or a specific message.
    return (
      <p className="text-center text-3xl font-bold text-white">
        Meeting ID not available.
      </p>
    );
  }
  const { id } = params; // Now it's safe to destructure id

  const { isLoading, user } = useAuth();
  const { call, isCallLoading } = useGetCallById(id);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  if (isLoading || isCallLoading) return <Loading />;

  if (!call)
    return (
      <p className="text-center text-3xl font-bold text-white">
        Call Not Found
      </p>
    );

  const notAllowed =
    call.type === "invited" &&
    (!user || !call.state.members.find((m) => m.user.id === user.id));

  if (notAllowed)
    return <Alert title="You are not allowed to join this meeting" />;

  return (
    <main className="h-screen w-full">
      <StreamCall call={call}>
        <StreamTheme>
          {!isSetupComplete ? (
            <MeetingSetup setIsSetupComplete={setIsSetupComplete} />
          ) : (
            <MeetingRoom />
          )}
        </StreamTheme>
      </StreamCall>
    </main>
  );
};

export default MeetingPage;
