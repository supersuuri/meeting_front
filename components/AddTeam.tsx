"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AddTeam({ onCreated }: { onCreated?: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Team name cannot be empty.");
      return;
    }

    // get the token directly
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // use the token from localStorage
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || "Failed to create team");
      }
      onCreated?.();
      // on success, go back to teams list
      router.push("/teams");
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-sm p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Create a New Team</h2>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Team Name"
        className="w-full border rounded px-3 py-2 mb-3"
        disabled={isSubmitting}
      />
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? "Creating…" : "Create Team"}
      </button>
    </form>
  );
}