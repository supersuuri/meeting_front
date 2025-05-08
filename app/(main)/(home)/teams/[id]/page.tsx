"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import Loading from "@/components/Loading";
import TeamGanttChart from "@/components/TeamGanttChart";

// Import icons for sidebar
import { Clipboard, FileText, Users, Settings } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface Member {
  _id: string;
  email: string;
  id?: string; // <-- add this line
}

interface Team {
  _id: string;
  name: string;
  admin: string;
  members: string[];
  description?: string;
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
  const [activeTab, setActiveTab] = useState("tasks"); // Default active tab
  const [emailSuggestions, setEmailSuggestions] = useState<Member[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchData = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    const currentToken = localStorage.getItem("token");

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
  }, [teamId]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      await fetchData();
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
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewEmail(value);
    if (value.length < 2) {
      setEmailSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/users/search?email=${encodeURIComponent(value)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data: { users: Member[] } = await res.json();
        setEmailSuggestions(
          data.users.filter((u) => !members.some((m) => m.email === u.email))
        );
        setShowSuggestions(true);
      }
    } catch {
      setEmailSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (email: string) => {
    setNewEmail(email);
    setShowSuggestions(false);
  };

  // Helper: is current user the team admin?
  const isadmin =
    team &&
    token &&
    team.admin === (JSON.parse(atob(token.split(".")[1]))?.id || "");

  // Render the appropriate content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "tasks":
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Tasks</h2>
            <TeamGanttChart teamId={teamId} />
          </div>
        );
      case "notes":
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Notes</h2>
            <p className="text-gray-500 mb-2">No notes available yet.</p>
            {/* You can add a notes editor or list here */}
            <textarea
              className="w-full border rounded p-2 min-h-[120px]"
              placeholder="Add notes for your team here (feature coming soon)..."
              disabled
            />
          </div>
        );
      case "members":
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Members</h2>
            <ul className="space-y-2 mb-4">
              {members.map((m) => (
                <li
                  key={m._id}
                  className="flex justify-between items-center p-2 bg-white border rounded"
                >
                  <span>{m.email}</span>
                  {isadmin && m._id !== team?.admin && (
                    <button
                      onClick={() => handleRemove(m._id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {isadmin && (
              <section className="bg-white p-4 rounded shadow mt-6">
                <h3 className="font-medium mb-2">Add Member</h3>
                <div className="flex flex-col relative">
                  <div className="flex space-x-2">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={handleEmailChange}
                      placeholder="user@example.com"
                      className="border p-2 rounded flex-grow"
                      autoComplete="off"
                      onFocus={() =>
                        setShowSuggestions(emailSuggestions.length > 0)
                      }
                      onBlur={() =>
                        setTimeout(() => setShowSuggestions(false), 100)
                      }
                    />
                    <button
                      onClick={handleAdd}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                  {showSuggestions && emailSuggestions.length > 0 && (
                    <ul className="absolute z-10 bg-white border rounded w-full mt-10 max-h-40 overflow-y-auto shadow">
                      {emailSuggestions.map((user) => (
                        <li
                          key={user.id} // <-- FIXED: use user.id, not user._id
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onMouseDown={() => handleSuggestionClick(user.email)}
                        >
                          {user.email}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            )}
          </div>
        );
      case "settings":
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            {isadmin ? (
              <div className="space-y-6 max-w-lg">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const formData = new FormData(form);
                    const name = formData.get("name") as string;
                    const description = formData.get("description") as string;
                    try {
                      setLoading(true);
                      const res = await fetch(`/api/teams/${teamId}`, {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ name, description }),
                      });
                      if (!res.ok) throw new Error("Failed to update team");
                      await fetchData();
                    } catch (err: any) {
                      setError(err.message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block font-medium mb-1">Team Name</label>
                    <input
                      name="name"
                      defaultValue={team?.name}
                      className="border p-2 rounded w-full"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      defaultValue={team?.description || ""}
                      className="border p-2 rounded w-full"
                      rows={3}
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    disabled={loading}
                  >
                    Save Changes
                  </button>
                </form>
                <hr />
                <div>
                  <button
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    disabled={loading}
                    onClick={() => setShowDeleteModal(true)}
                    type="button"
                  >
                    Delete Team
                  </button>
                  <Dialog
                    open={showDeleteModal}
                    onOpenChange={setShowDeleteModal}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Team</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete this team? This action
                          cannot be undone.
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
                          disabled={loading}
                          onClick={async () => {
                            try {
                              setLoading(true);
                              const res = await fetch(`/api/teams/${teamId}`, {
                                method: "DELETE",
                                headers: {
                                  Authorization: `Bearer ${token}`,
                                },
                              });
                              if (!res.ok)
                                throw new Error("Failed to delete team");
                              setShowDeleteModal(false);
                              router.push("/teams");
                            } catch (err: any) {
                              setError(err.message);
                            } finally {
                              setLoading(false);
                            }
                          }}
                          type="button"
                        >
                          Delete
                        </button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">
                Only the team admin can manage settings.
              </p>
            )}
            {error && <p className="text-red-500 mt-4">{error}</p>}
          </div>
        );
      default:
        return null;
    }
  };

  if (loading || isLoading || !team) return <Loading />;
  if (error) return <p>Error: {error}</p>;
  if (!team) return <p>Team not found.</p>;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 text-black flex flex-col">
        <div className="p-4">
          <h1 className="text-xl font-bold truncate">{team.name}</h1>
        </div>

        {/* Navigation links */}
        <nav className="flex-1">
          <ul>
            <li>
              <button
                onClick={() => setActiveTab("tasks")}
                className={`flex items-center w-full px-4 py-3 hover:bg-gray-100 ${
                  activeTab === "tasks"
                    ? "bg-gray-200 border-l-4 border-blue-500"
                    : ""
                }`}
              >
                <Clipboard className="mr-3" size={20} />
                <span>Tasks</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("notes")}
                className={`flex items-center w-full px-4 py-3 hover:bg-gray-100 ${
                  activeTab === "notes"
                    ? "bg-gray-200 border-l-4 border-blue-500"
                    : ""
                }`}
              >
                <FileText className="mr-3" size={20} />
                <span>Notes</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("members")}
                className={`flex items-center w-full px-4 py-3 hover:bg-gray-100 ${
                  activeTab === "members"
                    ? "bg-gray-200 border-l-4 border-blue-500"
                    : ""
                }`}
              >
                <Users className="mr-3" size={20} />
                <span>Members</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex items-center w-full px-4 py-3 hover:bg-gray-100 ${
                  activeTab === "settings"
                    ? "bg-gray-200 border-l-4 border-blue-500"
                    : ""
                }`}
              >
                <Settings className="mr-3" size={20} />
                <span>Settings</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">{renderContent()}</div>
    </div>
  );
}
