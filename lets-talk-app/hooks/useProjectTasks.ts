"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

export interface ProjectTask {
  _id: string;
  projectName: string;
  taskName: string;
  startDate: string;
  endDate: string;
  progress: number;
  dependencies: string[];
  assignedTo: string;
  color: string;
}

export const useProjectTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;

      try {
        setIsLoading(true);

        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await fetch("/api/projects", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch project tasks");
        }

        const data = await response.json();

        if (data.success) {
          setTasks(data.tasks);
        } else {
          throw new Error(data.message || "Failed to fetch project tasks");
        }
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching project tasks:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

  return { tasks, isLoading, error };
};
