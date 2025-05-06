"use client";

import TeamManagement from "@/components/TeamManagement";
import { useAuth } from "@/context/AuthContext";
import Loading from "@/components/Loading";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TeamsPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) return <Loading />;

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-4 mt-4 ml-6">Your Teams</h1>
      <p className="text-gray-600 mb-6 ml-6">
        Create and manage your teams to collaborate on Gantt charts with your
        colleagues.
      </p>
      <TeamManagement />
    </div>
  );
}
