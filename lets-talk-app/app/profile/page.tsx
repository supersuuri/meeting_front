"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import AvatarSelector from "@/components/AvatarSelector";

export default function ProfilePage() {
  const [user, setUser] = useState({
    name: "",
    email: "",
    bio: "",
    joined: "",
    profileImage: "/assets/profile-placeholder.png",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    imageUrl: "",
  });
  const [updateStatus, setUpdateStatus] = useState({
    loading: false,
    error: "",
  });
  const [selectedAvatar, setSelectedAvatar] = useState("");

  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoading(true);

        // Get the auth token from localStorage or cookies
        const token = localStorage.getItem("token") || "";

        // Include the Authorization header with the Bearer token
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const data = await response.json();

        // Check if the response has the expected structure
        if (!data.success || !data.user) {
          throw new Error("Invalid response format");
        }

        const userData = data.user;

        // Format the date to be more readable
        const joinDate = new Date(userData.createdAt || Date.now());
        const formattedDate = joinDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        });

        setUser({
          name:
            `${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
            userData.username ||
            "Anonymous User",
          email: userData.email || "",
          bio: userData.bio || "No bio available",
          joined: formattedDate,
          profileImage: userData.imageUrl || "/assets/profile-placeholder.png",
        });
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Could not load your profile data");
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, []);

  // Initialize edit form with current user data when editing starts
  useEffect(() => {
    if (isEditing) {
      // Parse the name into first and last
      const nameParts = user.name.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      setEditForm({
        firstName,
        lastName,
        bio: user.bio || "", // Ensure it's never undefined
        imageUrl:
          user.profileImage === "/assets/profile-placeholder.png"
            ? ""
            : user.profileImage,
      });

      // Initialize selectedAvatar with current user image for edit form
      setSelectedAvatar(user.profileImage);
    }
  }, [isEditing, user]);

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUpdateStatus({ loading: true, error: "" });

    try {
      const token = localStorage.getItem("token") || "";

      const response = await fetch("/api/auth/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          bio: editForm.bio,
          imageUrl: selectedAvatar || user.profileImage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();

      // Update the user state with new data
      setUser({
        ...user,
        name:
          `${editForm.firstName || ""} ${editForm.lastName || ""}`.trim() ||
          "Anonymous User",
        bio: editForm.bio || "No bio available",
        profileImage: selectedAvatar || "/assets/profile-placeholder.png",
      });

      // Close the edit form
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      setUpdateStatus({
        loading: false,
        error: "Failed to update profile. Please try again.",
      });
    } finally {
      setUpdateStatus({ loading: false, error: "" });
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-xl">Loading your profile...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-xl text-red-500">{error}</div>
        <Link href="/" className="mt-4 text-blue-600 hover:underline">
          Return to Home
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center pt-36 px-4 sm:px-8 md:px-16">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Profile header */}
        <div className="bg-blue-600 text-white p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold">My Profile</h1>
        </div>

        {/* Profile content */}
        <div className="p-6 md:p-8">
          {isEditing ? (
            // Edit Profile Form
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-blue-100">
                    <Image
                      src={editForm.imageUrl || user.profileImage}
                      alt="Profile"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  {/* <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700">
                      Profile Image URL
                    </label>
                    <input
                      type="text"
                      value={editForm.imageUrl}
                      onChange={(e) =>
                        setEditForm({ ...editForm, imageUrl: e.target.value })
                      }
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com/your-image.jpg"
                    />
                  </div> */}
                  <AvatarSelector
                    selectedAvatar={selectedAvatar}
                    onSelect={setSelectedAvatar}
                  />
                </div>

                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={editForm.firstName}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            firstName: e.target.value,
                          })
                        }
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={editForm.lastName}
                        onChange={(e) =>
                          setEditForm({ ...editForm, lastName: e.target.value })
                        }
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Bio
                    </label>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) =>
                        setEditForm({ ...editForm, bio: e.target.value })
                      }
                      rows={4}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {updateStatus.error && (
                    <p className="text-red-500 text-sm">{updateStatus.error}</p>
                  )}

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateStatus.loading}
                      className="px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {updateStatus.loading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            // Regular Profile View
            <div className="flex flex-col md:flex-row gap-8">
              {/* Profile image */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-blue-100">
                  <Image
                    src={user.profileImage}
                    alt="Profile"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Edit Profile
                </button>
              </div>

              {/* User info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {user.name}
                </h2>
                <p className="text-gray-600 mb-4">{user.email}</p>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    About
                  </h3>
                  <p className="text-gray-600">{user.bio}</p>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-500">
                    Member since {user.joined}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Learning stats section */}
          <div className="mt-10 border-t border-gray-200 pt-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Your Learning Stats
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-600 font-semibold">Courses Completed</p>
                <p className="text-3xl font-bold">5</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-600 font-semibold">Hours Practiced</p>
                <p className="text-3xl font-bold">24</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-600 font-semibold">Current Streak</p>
                <p className="text-3xl font-bold">7 days</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back to home link */}
      <div className="mt-8">
        <Link
          href="/"
          className="text-blue-600 hover:underline flex items-center gap-2"
        >
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}
