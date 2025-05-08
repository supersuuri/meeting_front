"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react"; // Import useCallback
import { useAuth } from "@/context/AuthContext";
import Loading from "@/components/Loading";

interface Member {
  _id: string;
  email: string;
}

interface Team {
  _id: string;
  name: string;
  owner: string;
  members: string[];
}

interface MembersResponse {
  members: Member[];
}

export default function TeamPage() {
  const { token, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { id: teamId } = useParams() as { id: string };
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // Define fetchData here and wrap with useCallback
    if (!teamId) return;
    setLoading(true);
    setError(null);
    const currentToken = localStorage.getItem("token"); // Use a different variable name to avoid conflict with token from useAuth if it's in scope

    try {
      // Fetch team details
      const teamRes = await fetch(`/api/teams/${teamId}`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });
      if (!teamRes.ok) {
        throw new Error(`Failed to fetch team: ${teamRes.statusText}`);
      }
      const teamData: Team = await teamRes.json();
      console.log("Client: Fetched team data:", teamData);
      setTeam(teamData);

      // Fetch team members
      const membersRes = await fetch(`/api/teams/${teamId}/members`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });
      if (!membersRes.ok) {
        throw new Error(`Failed to fetch members: ${membersRes.statusText}`);
      }
      const membersData: MembersResponse = await membersRes.json();
      console.log("Client: Fetched members data:", membersData);
      setMembers(membersData.members);
    } catch (err: any) {
      console.error("Client: Fetch error", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [teamId]); // Add teamId as a dependency

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Call fetchData from useEffect

  const handleAdd = async () => {
    if (!newEmail.trim() || !token) return;
    setLoading(true);
    try {
      await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newEmail }),
      });
      setNewEmail("");
      await fetchData(); // Now fetchData is in scope
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!token) return;
    setLoading(true);
    try {
      await fetch(`/api/teams/${teamId}/members`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ memberId }),
      });
      await fetchData(); // Now fetchData is in scope
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || isLoading || !team) return <Loading />;
  if (error) return <p>Error: {error}</p>;
  if (!team) return <p>Team not found.</p>;

  const amOwner = team.owner === /* your user id from context */ "";

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{team.name}</h1>
      <p>Owner ID: {team.owner}</p>

      <section className="mb-6">
        <h2 className="text-xl font-semibold">Members</h2>
        <ul className="space-y-2">
          {members.map((m) => (
            <li
              key={m._id}
              className="flex justify-between items-center p-2 bg-white border rounded"
            >
              <span>{m.email}</span>
            </li>
          ))}
        </ul>
      </section>

      {amOwner && (
        <section className="bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2">Add Member</h3>
          <div className="flex space-x-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="user@example.com"
              className="border p-2 rounded flex-grow"
            />
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
