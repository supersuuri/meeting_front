"use client";

import TeamGanttChart from "@/components/TeamGanttChart";
import { useAuth } from "@/context/AuthContext";
import Loading from "@/components/Loading";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";

export default function TeamGanttPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const teamId = params?.id as string | undefined;
  const [teamName, setTeamName] = useState("");
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchTeam = async () => {
      if (!teamId || !user) {
        if (!isLoading && teamId === undefined) {
          router.push("/teams");
        }
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`/api/teams/${teamId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setTeamName(response.data.team.name);
        } else {
          router.push("/teams");
        }
      } catch (error) {
        router.push("/teams");
      } finally {
        setIsLoadingTeam(false);
      }
    };

    fetchTeam();
  }, [teamId, user, router, isLoading]);

  if (isLoading || isLoadingTeam || !teamId) return <Loading />;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6 mt-4 mx-6">
        <div>
          <h1 className="text-2xl font-bold">{teamName} - Gantt Chart</h1>
          <p className="text-gray-600">
            Collaborate with your team on project tasks and milestones
          </p>
        </div>
        <button
          onClick={() => router.push("/teams")}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Back to Teams
        </button>
      </div>
      <TeamGanttChart teamId={teamId} />
    </div>
  );
}
