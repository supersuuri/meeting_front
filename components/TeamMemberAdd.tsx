"use client";

import { useState } from "react";
import { toast } from "sonner";
import EmailSearch from "./EmailSearch";
import { Button } from "./ui/button";

interface TeamMemberAddProps {
  teamId: string;
  onMemberAdded?: () => void;
}

interface User {
  id: string;
  email: string;
  name: string;
  imageUrl: string;
}

export default function TeamMemberAdd({
  teamId,
  onMemberAdded,
}: TeamMemberAddProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"member" | "admin">(
    "member"
  );

  const handleAddMember = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: selectedUser.email,
          role: selectedRole, // You need to add a way to select role in the UI
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${selectedUser.name} added to team`);
        setSelectedUser(null);
        if (onMemberAdded) onMemberAdded();
      } else {
        throw new Error(data.message || "Failed to add team member");
      }
    } catch (error) {
      console.error("Error adding team member:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add team member"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Add Team Member</h3>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <EmailSearch
            onUserSelect={handleUserSelect}
            placeholder="Search user by email"
          />
        </div>

        <Button
          onClick={handleAddMember}
          disabled={!selectedUser || isSubmitting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? "Adding..." : "Add Member"}
        </Button>
      </div>

      {selectedUser && (
        <div className="p-3 bg-blue-50 rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 relative rounded-full overflow-hidden bg-gray-200">
              <img
                src={selectedUser.imageUrl || "/assets/profile-placeholder.png"}
                alt={selectedUser.name}
                className="object-cover w-full h-full"
              />
            </div>
            <div>
              <div className="font-medium">{selectedUser.name}</div>
              <div className="text-sm text-gray-500">{selectedUser.email}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedUser(null)}
            className="h-8 px-2"
          >
            ✕
          </Button>
        </div>
      )}

      <div className="flex gap-2 items-center">
        <label>
          <input
            type="radio"
            name="role"
            value="member"
            checked={selectedRole === "member"}
            onChange={() => setSelectedRole("member")}
          />
          Member
        </label>
        <label>
          <input
            type="radio"
            name="role"
            value="admin"
            checked={selectedRole === "admin"}
            onChange={() => setSelectedRole("admin")}
          />
          Admin
        </label>
      </div>
    </div>
  );
}
