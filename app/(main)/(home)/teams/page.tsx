"use client";

import AddTeam from "@/components/AddTeam";
import Loading from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Team { _id: string; name: string; }

export default function TeamsPage() {
  const { isLoading, isAuthenticated, token } = useAuth();
  const router = useRouter();

  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchTeams = () => {
    if (!token) return;
    setLoadingTeams(true);
    fetch("/api/teams", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,   // ← send token
      },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      })
      .then((data) => setTeams(data.teams || []))
      .catch(console.error)
      .finally(() => setLoadingTeams(false));
  };

  // redirect if not auth’d
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  // initial fetch
  useEffect(() => {
    if (isAuthenticated) fetchTeams();
  }, [isAuthenticated, token]);

  if (isLoading || loadingTeams) return <Loading />;

  const handleCreated = () => {
    setShowModal(false);
    fetchTeams();
  };

  return (
    <div className="animate-fade-in">
      {/* header + create button */}
      <div className="flex items-center justify-between p-6">
        <h1 className="text-2xl font-bold">Your Teams</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Team
        </button>
      </div>

      {/* teams list */}
      <div className="px-6">
        {teams.length ? (
          <ul className="space-y-2">
            {teams.map((t, idx) => (
              <li
                key={t._id ?? idx}
                className="p-4 bg-white border rounded hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/teams/${t._id}`)}
              >
                {t.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No teams yet.</p>
        )}
      </div>
      {/* modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative bg-white rounded shadow-lg">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
            >
              ✕
            </button>
            <AddTeam onCreated={handleCreated} />
          </div>
        </div>
      )}
    </div>
  );
}
