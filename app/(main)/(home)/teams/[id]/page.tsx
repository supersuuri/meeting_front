"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react"; // Added useMemo
import { useAuth } from "@/context/AuthContext";
import Loading from "@/components/Loading";
import TeamGanttChart from "@/components/TeamGanttChart";
import EmailSearch from "@/components/EmailSearch"; // Add this import
import TeamNote from "@/components/TeamNote";

// Import icons for sidebar
import {
  Clipboard,
  FileText,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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
  username?: string;
}

interface Team {
  _id: string;
  name: string;
  admins?: string[]; // Represents a list of additional admin user IDs
  members: string[];
  description?: string;
}

interface MembersResponse {
  members: Member[];
}

interface Note {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  createdBy: {
    username: string;
    email: string;
  };
  lastEditedBy: {
    username: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function TeamPage() {
  const { token, isLoading, isAuthenticated, user: currentUser } = useAuth(); // Assuming user object from useAuth has id
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
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberRole, setNewMemberRole] = useState<"member" | "admin">(
    "member"
  );
  const [emailSearchKey, setEmailSearchKey] = useState(Date.now()); // Key to reset EmailSearch
  const [notes, setNotes] = useState<Note[]>([]);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteTags, setNewNoteTags] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // New state for search term
  const [filterTags, setFilterTags] = useState(""); // New state for filter tags
  const [tagInput, setTagInput] = useState(""); // For the controlled input for tags
  const [allTeamTags, setAllTeamTags] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // New state for sidebar collapse

  // New state for the change role modal
  const [showChangeRoleModal, setShowChangeRoleModal] = useState(false);
  const [editingMemberInfo, setEditingMemberInfo] = useState<{
    id: string;
    email: string;
    username?: string;
    currentIsAdmin: boolean;
  } | null>(null);
  const [selectedRoleInModal, setSelectedRoleInModal] = useState<
    "member" | "admin"
  >("member");

  // 1. fetchData only fetches the team
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
      setTeam(teamData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  // 2. Fetch all users when team changes
  useEffect(() => {
    const fetchMembers = async () => {
      if (!team || !token) return;
      try {
        const res = await fetch(`/api/teams/${teamId}/members`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          setMembers([]);
          return;
        }
        const data = await res.json();
        setMembers(data.members || []);
      } catch (error) {
        setMembers([]);
      }
    };
    fetchMembers();
  }, [team, token, teamId]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  // 3. useEffect for fetchData (unchanged)
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add fetchNotes function
  const fetchNotes = useCallback(async () => {
    if (!teamId || !token) return;
    try {
      let url = `/api/teams/${teamId}/notes`;
      const queryParams = new URLSearchParams();
      if (searchTerm.trim()) {
        queryParams.append("searchTerm", searchTerm.trim());
      }
      // Use filterTags for the actual query, which is updated by tagInput
      if (filterTags.trim()) {
        queryParams.append("tags", filterTags.trim());
      }
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes);
      } else {
        setNotes([]); // Clear notes on error or if not found
        console.error("Failed to fetch notes:", await res.text());
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
      setNotes([]);
    }
  }, [teamId, token, searchTerm, filterTags]); // Add searchTerm and filterTags to dependencies

  const fetchAllTeamTags = useCallback(async () => {
    if (!teamId || !token) return;
    try {
      const res = await fetch(`/api/teams/${teamId}/notes/tags`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAllTeamTags(data.tags || []);
      } else {
        console.error("Failed to fetch team tags:", await res.text());
        setAllTeamTags([]);
      }
    } catch (error) {
      console.error("Error fetching team tags:", error);
      setAllTeamTags([]);
    }
  }, [teamId, token]);

  // useEffect for fetching notes and all team tags
  useEffect(() => {
    if (activeTab === "notes") {
      fetchNotes();
      fetchAllTeamTags();
    }
  }, [activeTab, fetchNotes, fetchAllTeamTags]); // Added fetchAllTeamTags

  const handleAdd = async () => {
    if (!newEmail.trim() || !token) return;
    setLoading(true);
    setError(null); // <-- clear previous error
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newEmail, role: newMemberRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to add member");
        return;
      }
      setNewEmail("");
      setNewMemberRole("member");
      setShowAddMemberModal(false); // Close the modal on success
      setEmailSearchKey(Date.now()); // Reset EmailSearch component
      await fetchData(); // Re-fetch data to update the member list
    } catch (e: any) {
      setError(e.message);
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

  const userId = useMemo(() => {
    // Prefer getting userId from auth context if available and reliable
    if (currentUser?.id) return currentUser.id;
    if (token && token.includes(".")) {
      try {
        return JSON.parse(atob(token.split(".")[1]))?.id || "";
      } catch (e) {
        console.error("Failed to parse token:", e);
        return "";
      }
    }
    return "";
  }, [token, currentUser]);

  const isadmin = useMemo(() => {
    if (!team || !userId) return false;
    return team.admins?.map(String).includes(userId);
  }, [team, userId]);

  const handlePromoteToAdmin = async (memberId: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/members/admin`, {
        method: "POST",
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

  const handleDemoteFromAdmin = async (memberId: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/members/admin`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ memberId }),
      });
      if (!res.ok) throw new Error("Failed to demote member");
      // Optionally: Show a toast or console message here
      console.log("Admin rights removed!");
      await fetchData();
    } catch (e) {
      // Optionally: Handle the error with a toast or log
      console.error("Failed to demote member:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!token || !newNoteTitle.trim() || !newNoteContent.trim()) return;
    try {
      const res = await fetch(`/api/teams/${teamId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newNoteTitle,
          content: newNoteContent,
          tags: newNoteTags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      });

      if (res.ok) {
        setShowAddNoteModal(false);
        setNewNoteTitle("");
        setNewNoteContent("");
        setNewNoteTags("");
        fetchNotes();
      }
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);
    setFilterTags(value); // Update filterTags to trigger search as user types

    const lastTagPart = value.split(",").pop()?.trim().toLowerCase() || "";

    if (lastTagPart) {
      const currentSelectedTags = value
        .toLowerCase()
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);
      const suggestions = allTeamTags.filter(
        (tag) =>
          tag.toLowerCase().startsWith(lastTagPart) && // Changed from includes to startsWith
          !currentSelectedTags.includes(tag.toLowerCase()) // Don't suggest already selected/typed tags
      );
      setTagSuggestions(suggestions);
      setShowTagSuggestions(suggestions.length > 0);
    } else {
      setTagSuggestions([]);
      setShowTagSuggestions(false);
    }
  };

  const handleTagSuggestionClick = (suggestion: string) => {
    const currentTags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    let newTagsArray: string[];

    // If the suggestion is already part of the input, remove it (toggle behavior)
    // Or, more simply, just ensure it's added if not present in the last part.
    // For this implementation, we'll append or replace the last part.
    const parts = tagInput.split(",");
    if (parts.length > 0) {
      parts[parts.length - 1] = suggestion; // Replace the last part being typed
      newTagsArray = parts.map((p) => p.trim()).filter((p) => p);
    } else {
      newTagsArray = [suggestion];
    }

    // Ensure no duplicates if user manually typed something similar
    const uniqueNewTags = Array.from(new Set(newTagsArray));
    const newTagsString = uniqueNewTags.join(", ");

    setTagInput(newTagsString);
    setFilterTags(newTagsString); // This will trigger the fetchNotes
    setShowTagSuggestions(false);
    setTagSuggestions([]);
  };

  // Toggle sidebar collapsed state
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Determine the member’s current role and whether the Save button should be disabled
  const currentRole = editingMemberInfo
    ? editingMemberInfo.currentIsAdmin
      ? "admin"
      : "member"
    : undefined;
  const isSaveDisabled = !editingMemberInfo || selectedRoleInModal === currentRole;

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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Notes</h2>
              <button
                onClick={() => setShowAddNoteModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Note
              </button>
            </div>

            {/* Search and Filter Inputs */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="search-notes"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Search Notes
                </label>
                <input
                  type="text"
                  id="search-notes"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Search by title or content..."
                />
              </div>
              <div className="relative">
                {" "}
                {/* Added relative positioning */}
                <label
                  htmlFor="filter-tags"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Filter by Tags (comma-separated)
                </label>
                <input
                  type="text"
                  id="filter-tags"
                  value={tagInput} // Use tagInput for the display value
                  onChange={handleTagInputChange}
                  onFocus={() => {
                    // Show suggestions on focus if there's text
                    const lastTagPart =
                      tagInput.split(",").pop()?.trim().toLowerCase() || "";
                    if (lastTagPart && allTeamTags.length > 0) {
                      const currentSelectedTags = tagInput
                        .toLowerCase()
                        .split(",")
                        .map((t) => t.trim())
                        .filter((t) => t);
                      const suggestions = allTeamTags.filter(
                        (tag) =>
                          tag.toLowerCase().startsWith(lastTagPart) && // Changed from includes to startsWith
                          !currentSelectedTags.includes(tag.toLowerCase())
                      );
                      if (suggestions.length > 0) {
                        setTagSuggestions(suggestions);
                        setShowTagSuggestions(true);
                      }
                    }
                  }}
                  onBlur={() =>
                    setTimeout(() => setShowTagSuggestions(false), 150)
                  } // Delay to allow click
                  className="w-full p-2 border rounded"
                  placeholder="e.g., urgent, project-x"
                  autoComplete="off"
                />
                {showTagSuggestions && tagSuggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    <ul>
                      {tagSuggestions.map((tag, index) => (
                        <li
                          key={index}
                          onMouseDown={() => handleTagSuggestionClick(tag)} // Use onMouseDown
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            {/* End Search and Filter Inputs */}

            {notes.length === 0 ? (
              <p className="text-gray-500">
                No notes found matching your criteria, or no notes available
                yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 ms:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
                {notes.map((note) => (
                  <TeamNote
                    key={note._id}
                    note={note}
                    teamId={teamId}
                    onUpdate={fetchNotes}
                    onDelete={fetchNotes}
                    searchTerm={searchTerm} // Pass searchTerm here
                  />
                ))}
              </div>
            )}

            <Dialog open={showAddNoteModal} onOpenChange={setShowAddNoteModal}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Note</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 p-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newNoteTitle}
                      onChange={(e) => setNewNoteTitle(e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Enter note title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content
                    </label>
                    <textarea
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      rows={4}
                      className="w-full p-2 border rounded"
                      placeholder="Enter note content"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={newNoteTags}
                      onChange={(e) => setNewNoteTags(e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <button
                    onClick={() => {
                      setShowAddNoteModal(false);
                      setNewNoteTitle("");
                      setNewNoteContent("");
                      setNewNoteTags("");
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddNote}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    disabled={!newNoteTitle.trim() || !newNoteContent.trim()}
                  >
                    Add Note
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        );
      case "members":
        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Members</h2>
              {isadmin && (
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => setShowAddMemberModal(true)}
                  type="button"
                >
                  Add Member
                </button>
              )}
            </div>
            <ul className="grid grid-cols-1 ms:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
              {members.map((m) => {
                const isMemberAlsoAdmin = team?.admins
                  ?.map(String)
                  .includes(String(m._id));
                return (
                  <li
                    key={m._id}
                    className="flex justify-between items-center p-2 bg-white border rounded"
                  >
                    <div>
                      <div className="font-semibold text-lg">
                        {m.username || m.email.split("@")[0] || "User"}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>{m.email}</span>
                        <span className="ml-2 text-xs font-semibold">
                          ({isMemberAlsoAdmin ? "admin" : "member"})
                        </span>
                        {isadmin &&
                          userId !== m._id && ( // Admin can manage others, but not demote/promote self via this button
                            <button
                              className="ml-2 p-1 hover:bg-gray-100 rounded"
                              onClick={() => {
                                setEditingMemberInfo({
                                  id: m._id,
                                  email: m.email,
                                  username: m.username,
                                  currentIsAdmin: !!isMemberAlsoAdmin, // Ensure boolean
                                });
                                setSelectedRoleInModal(
                                  isMemberAlsoAdmin ? "admin" : "member"
                                );
                                setShowChangeRoleModal(true);
                              }}
                              title="Edit role"
                            >
                              <img
                                src="/assets/pencil.svg"
                                alt="Edit role"
                                className="w-4 h-4"
                              />
                            </button>
                          )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {isadmin &&
                        userId !== m._id && ( // Admin can remove others, but not self via this button
                          <button
                            onClick={() => handleRemove(m._id)}
                            className="text-red-600 hover:underline text-sm"
                          >
                            Remove
                          </button>
                        )}
                    </div>
                  </li>
                );
              })}
            </ul>
            {/* Existing Add Member Modal Dialog */}
            <Dialog
              open={showAddMemberModal}
              onOpenChange={(isOpen) => {
                setShowAddMemberModal(isOpen);
                if (!isOpen) {
                  setError(null);
                  setNewEmail("");
                  setNewMemberRole("member"); // Reset role as well
                  setEmailSearchKey(Date.now()); // Generate new key to reset EmailSearch
                }
              }}
            >
              <DialogContent className="bg-white p-6 rounded-lg shadow-xl sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-semibold text-gray-900">
                    Add New Member
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-sm text-gray-600">
                    Search for a user by their email address and assign them a
                    role within the team.
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-6 space-y-6">
                  {" "}
                  {/* Increased spacing */}
                  <div>
                    <label
                      htmlFor="email-search-modal"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      User Email
                    </label>
                    <EmailSearch
                      key={emailSearchKey} // Add key to control re-rendering and reset
                      onUserSelect={(user) => {
                        setNewEmail(user.email);
                      }}
                      placeholder="Search by email..."
                      // Ensure EmailSearch's input field is styled appropriately, e.g., with Tailwind classes like:
                      // className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="member-role-modal"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Role
                    </label>
                    <select
                      id="member-role-modal"
                      value={newMemberRole}
                      onChange={(e) =>
                        setNewMemberRole(e.target.value as "member" | "admin")
                      }
                      className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  {error && ( // Display errors within the modal
                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                      {error}
                    </p>
                  )}
                </div>

                <DialogFooter className="mt-8 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    disabled={loading || !newEmail}
                  >
                    {loading ? "Adding..." : "Add Member"}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={() => {
                      setShowAddMemberModal(false); // This will trigger onOpenChange(false)
                    }}
                  >
                    Cancel
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* New Change Role Modal Dialog */}
            {editingMemberInfo && (
              <Dialog
                open={showChangeRoleModal}
                onOpenChange={(isOpen) => {
                  setShowChangeRoleModal(isOpen);
                  if (!isOpen) {
                    setEditingMemberInfo(null);
                  }
                }}
              >
                <DialogContent className="bg-white p-6 rounded-lg shadow-xl sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold text-gray-900">
                      Change Role for{" "}
                      {editingMemberInfo.username ||
                        editingMemberInfo.email.split("@")[0]}
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-sm text-gray-600">
                      Current role:{" "}
                      {editingMemberInfo.currentIsAdmin ? "Admin" : "Member"}.
                      Select the new role below.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="mt-6 space-y-4">
                    <div>
                      <label
                        htmlFor="change-member-role-modal-select"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        New Role
                      </label>
                      <select
                        id="change-member-role-modal-select"
                        value={selectedRoleInModal}
                        onChange={(e) =>
                          setSelectedRoleInModal(
                            e.target.value as "member" | "admin"
                          )
                        }
                        className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>

                  <DialogFooter className="mt-8 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!editingMemberInfo) return;

                        const roleChanged = selectedRoleInModal !== currentRole;

                        if (roleChanged) {
                          try {
                            if (selectedRoleInModal === "admin") {
                              await handlePromoteToAdmin(editingMemberInfo.id);
                            } else {
                              await handleDemoteFromAdmin(editingMemberInfo.id);
                            }
                          } catch (modalError) {
                            console.error("Error changing role:", modalError);
                          }
                        }

                        setShowChangeRoleModal(false);
                        setEditingMemberInfo(null);
                      }}
                      className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm
    ${
      isSaveDisabled
        ? "bg-blue-300 text-white cursor-not-allowed opacity-50"
        : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
    }`}
                      disabled={isSaveDisabled}
                    >
                      {loading && editingMemberInfo
                        ? "Saving..."
                        : "Save Changes"}
                    </button>

                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 sm:mt-0 sm:w-auto sm:text-sm"
                      onClick={() => {
                        setShowChangeRoleModal(false);
                        setEditingMemberInfo(null);
                      }}
                    >
                      Cancel
                    </button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
      <div
        className={`text-black flex flex-col transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="p-4 flex items-center justify-between">
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold truncate">{team.name}</h1>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded"
            aria-label={
              sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
          >
            {sidebarCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </button>
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
                } ${sidebarCollapsed ? "justify-center" : ""}`}
                title="Tasks"
              >
                <Clipboard
                  className={!sidebarCollapsed ? "mr-3" : ""}
                  size={20}
                />
                {!sidebarCollapsed && <span>Tasks</span>}
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("notes")}
                className={`flex items-center w-full px-4 py-3 hover:bg-gray-100 ${
                  activeTab === "notes"
                    ? "bg-gray-200 border-l-4 border-blue-500"
                    : ""
                } ${sidebarCollapsed ? "justify-center" : ""}`}
                title="Notes"
              >
                <FileText
                  className={!sidebarCollapsed ? "mr-3" : ""}
                  size={20}
                />
                {!sidebarCollapsed && <span>Notes</span>}
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("members")}
                className={`flex items-center w-full px-4 py-3 hover:bg-gray-100 ${
                  activeTab === "members"
                    ? "bg-gray-200 border-l-4 border-blue-500"
                    : ""
                } ${sidebarCollapsed ? "justify-center" : ""}`}
                title="Members"
              >
                <Users className={!sidebarCollapsed ? "mr-3" : ""} size={20} />
                {!sidebarCollapsed && <span>Members</span>}
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex items-center w-full px-4 py-3 hover:bg-gray-100 ${
                  activeTab === "settings"
                    ? "bg-gray-200 border-l-4 border-blue-500"
                    : ""
                } ${sidebarCollapsed ? "justify-center" : ""}`}
                title="Settings"
              >
                <Settings
                  className={!sidebarCollapsed ? "mr-3" : ""}
                  size={20}
                />
                {!sidebarCollapsed && <span>Settings</span>}
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
