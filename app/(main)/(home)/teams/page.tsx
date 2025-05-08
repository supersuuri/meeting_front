"use client";

import AddTeam from "@/components/AddTeam";
import Loading from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface Team {
  _id: string;
  name: string;
  admin: string; // Add admin property
}

export default function TeamsPage() {
  const { isLoading, isAuthenticated, token } = useAuth();
  const router = useRouter();

  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const userId = token ? JSON.parse(atob(token.split(".")[1]))?.id : null;

  const fetchTeams = () => {
    if (!token) return;
    setLoadingTeams(true);
    fetch("/api/teams", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ← send token
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

  const handleDeleteOrLeave = useCallback(
    async (team: Team) => {
      if (!token) return;
      try {
        const res = await fetch(`/api/teams/${team._id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to delete/leave team");
        fetchTeams();
      } catch (err) {
        alert((err as Error).message);
      }
    },
    [token, userId]
  );

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
                onClick={() => router.push(`/teams/${t._id}`)}
                className="p-4 bg-white border rounded hover:bg-gray-50 flex items-center justify-between cursor-pointer"
              >
                <span>{t.name}</span>
                {userId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTeamToDelete(t);
                      setShowConfirmModal(true);
                    }}
                    className={`ml-4 px-3 py-1 rounded text-white ${
                      t.admin === userId ? "" : "bg-gray-500 hover:bg-gray-700"
                    }`}
                  >
                    {t.admin === userId ? (
                      <img
                        src="/assets/trash-bin.png"
                        alt="Delete"
                        className="w-5 h-5"
                      />
                    ) : (
                      <img
                        src="/assets/leave.png"
                        alt="Leave"
                        className="w-5 h-5"
                      />
                    )}
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No teams yet.</p>
        )}
      </div>

      {/* Confirm Delete Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {teamToDelete?.admin === userId ? "Delete Team" : "Leave Team"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to{" "}
              {teamToDelete?.admin === userId ? "delete" : "leave"} this team?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                type="button"
              >
                Cancel
              </button>
            </DialogClose>
            <button
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              type="button"
              onClick={async () => {
                if (teamToDelete) {
                  await handleDeleteOrLeave(teamToDelete);
                  setShowConfirmModal(false);
                  setTeamToDelete(null);
                }
              }}
            >
              {teamToDelete?.admin === userId ? "Delete" : "Leave"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
