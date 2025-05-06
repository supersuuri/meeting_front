"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import TeamMemberAdd from "@/components/TeamMemberAdd";

interface Team {
  _id: string;
  name: string;
  description?: string;
  ownerId: string;
  admins?: string[];
  members?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

const TeamManagement = () => {
  const { data: session } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showMemberModal, setShowMemberModal] = useState(false);
  const router = useRouter();
  const user = session?.user as { _id: string } | undefined;

  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      if (!(session as any)?.token) return;

      setIsLoading(true);
      try {
        const response = await axios.get("/api/teams", {
          headers: { Authorization: `Bearer ${(session as any).token}` },
        });
        setTeams(response.data.teams || []);
        setError("");
      } catch (error) {
        console.error("Failed to fetch teams:", error);
        setError("Failed to load teams. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, [session]);

  // Check if current user is admin or owner of team
  const isTeamAdminOrOwner = (team: Team) => {
    return (
      team.ownerId === user?._id ||
      (team.admins && team.admins.includes(user?._id || ""))
    );
  };

  // Open team board
  const openTeamBoard = (team: Team) => {
    router.push(`/teams/${team._id}`);
  };

  // Manage team members
  const handleManageMembers = async (team: Team) => {
    setSelectedTeam(team);

    // Fetch team members
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/teams/${team._id}/members`, {
        headers: { Authorization: `Bearer ${(session as any)?.token}` },
      });
      setTeamMembers(response.data.members || []);
      setShowMemberModal(true);
      setError("");
    } catch (error) {
      console.error("Failed to fetch team members:", error);
      setError("Failed to load team members.");
    } finally {
      setIsLoading(false);
    }
  };

  // Remove member from team
  const handleRemoveMember = async (memberId: string) => {
    if (!selectedTeam) return;
  
    try {
      setIsLoading(true);
      await axios.delete(`/api/teams/${selectedTeam._id}/members`, {
        data: { memberId },
        headers: { Authorization: `Bearer ${(session as any).token}` },
      });

      // Update members list
      setTeamMembers(teamMembers.filter((member) => member._id !== memberId));
      toast.success("Member removed successfully");
      setError("");
    } catch (error) {
      console.error("Failed to remove member:", error);
      setError("Failed to remove member");
      toast.error("Failed to remove member");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle admin status
  const handleToggleAdmin = async (memberId: string) => {
    if (!selectedTeam) return;
  
    try {
      setIsLoading(true);
      // Check if user is already an admin
      const isAdmin = selectedTeam.admins?.includes(memberId);
  
      const endpoint = `/api/teams/${selectedTeam._id}/members/admin`;
      const method = isAdmin ? "delete" : "post";
  
      const response = await axios({
        method,
        url: endpoint,
        data: { memberId },
        headers: { Authorization: `Bearer ${(session as any).token}` },
      });

      if (response.data.success) {
        // Update local state
        setSelectedTeam({
          ...selectedTeam,
          admins: response.data.team.admins || [],
        });

        toast.success(isAdmin ? "Admin role removed" : "Admin role added");
        setError("");
      }
    } catch (error) {
      console.error("Failed to update admin status:", error);
      setError("Failed to update admin status");
      toast.error("Failed to update admin role");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Teams</h1>

      {isLoading && !showMemberModal && (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && !showMemberModal && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {teams.length > 0 ? (
        <div className="space-y-3">
          {teams.map((team, index) => (
            <div
              key={team._id || index}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">{team.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {team.description || "No description"}
                  </p>

                  {/* Show user's role in this team */}
                  <div className="mt-1">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        team.ownerId === user?._id
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                          : team.admins?.includes(user?._id || "")
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {team.ownerId === user?._id
                        ? "Owner"
                        : team.admins?.includes(user?._id || "")
                        ? "Admin"
                        : "Member"}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => openTeamBoard(team)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Open Board
                  </button>

                  {/* Only show management options for owners/admins */}
                  {isTeamAdminOrOwner(team) && (
                    <button
                      onClick={() => handleManageMembers(team)}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Manage Members
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">
          You don't have any teams yet. Create one to get started!
        </p>
      )}

      {/* Member Management Modal */}
      {showMemberModal && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Team Members</h2>
              <button
                onClick={() => setShowMemberModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            ) : (
              <div className="divide-y">
                {teamMembers.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between py-2"
                  >
                    <div>
                      <span className="font-medium">{member.name}</span>
                      {member._id === selectedTeam?.ownerId && (
                        <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                          Owner
                        </span>
                      )}
                      {selectedTeam?.admins?.includes(member._id) &&
                        member._id !== selectedTeam?.ownerId && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            Admin
                          </span>
                        )}
                    </div>

                    <div className="flex space-x-2">
                      {/* Only owner can promote/demote admins, and can't demote themselves */}
                      {selectedTeam?.ownerId === user?._id &&
                        member._id !== selectedTeam.ownerId && (
                          <button
                            onClick={() => handleToggleAdmin(member._id)}
                            className="text-sm px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
                          >
                            {selectedTeam?.admins?.includes(member._id)
                              ? "Remove Admin"
                              : "Make Admin"}
                          </button>
                        )}

                      {/* Only owners and admins can remove members, and owners can't be removed */}
                      {(selectedTeam?.ownerId === user?._id ||
                        (selectedTeam?.admins?.includes(user?._id || "") &&
                          member._id !== selectedTeam.ownerId)) &&
                        member._id !== selectedTeam.ownerId && (
                          <button
                            onClick={() => handleRemoveMember(member._id)}
                            className="text-sm px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                          >
                            Remove
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
