"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  imageUrl: string;
}

interface EmailSearchProps {
  onUserSelect: (user: User) => void;
  placeholder?: string;
  className?: string;
}

export default function EmailSearch({
  onUserSelect,
  placeholder = "Search by email",
  className,
}: EmailSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const wasJustSelectedRef = useRef(false); // Use a ref instead of state

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (wasJustSelectedRef.current) {
      // If the query changed because a user was selected,
      // reset the flag and skip the search for this update.
      wasJustSelectedRef.current = false;
      return;
    }

    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        setIsOpen(false); // Close dropdown if query is too short
        return;
      }

      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setSearchResults([]);
          setIsOpen(false);
          throw new Error("Not authenticated");
        }

        const response = await fetch(
          `/api/users/search?email=${encodeURIComponent(searchQuery)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();
        if (data.success && data.users) {
          setSearchResults(data.users);
          setIsOpen(data.users.length > 0);
        } else {
          setSearchResults([]);
          setIsOpen(false);
        }
      } catch (error) {
        console.error("Error searching users:", error);
        setSearchResults([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search to avoid too many requests
    const timeoutId = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]); // Only searchQuery as dependency

  const handleUserSelect = (user: User) => {
    onUserSelect(user);
    wasJustSelectedRef.current = true; // Set ref flag before updating searchQuery
    setSearchQuery(user.email); // Update input with selected email
    setSearchResults([]); // Clear current search results
    setIsOpen(false); // Close the dropdown
  };

  return (
    <div className={cn("relative", className)} ref={wrapperRef}>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          // No need to manage wasJustSelectedRef here; useEffect handles it.
        }}
        onFocus={() => {
          // if (searchQuery.length >= 2 && searchResults.length > 0) setIsOpen(true);
        }}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      />

      {isLoading && (
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      )}

      {isOpen && searchResults.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
          {searchResults.map((user) => (
            <div
              key={user.id}
              className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleUserSelect(user)}
            >
              <div className="h-8 w-8 mr-3 relative">
                <Image
                  src={user.imageUrl || "/assets/profile-placeholder.png"}
                  alt={user.name || user.username || user.email}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <div>
                <div className="text-sm font-medium">
                  {user.name || user.username}
                </div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen &&
        searchQuery.length >= 2 &&
        searchResults.length === 0 &&
        !isLoading && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 p-4 text-center text-sm text-gray-500">
            No users found
          </div>
        )}
    </div>
  );
}
