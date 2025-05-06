"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Gantt, Task, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
// Replace react-datepicker import with shadcn components
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface ProjectTask {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  type: "task" | "milestone";
  userId: string;
}

interface GanttTask extends Task {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  type: "task" | "milestone";
}

const GanttChart = () => {
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [newTask, setNewTask] = useState({
    name: "",
    startDate: "",
    endDate: "",
    progress: 0,
    type: "task" as "task" | "milestone",
  });
  const [editTask, setEditTask] = useState<GanttTask | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      fetchTasks(storedToken);
    } else {
      setError("Please log in to view tasks");
    }
  }, []);

  const fetchTasks = async (authToken: string) => {
    try {
      const response = await axios.get("/api/tasks", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.data.success) {
        const ganttTasks: GanttTask[] = response.data.tasks.map(
          (task: ProjectTask) => ({
            id: task._id,
            name: task.name,
            start: new Date(task.startDate),
            end: new Date(task.endDate),
            progress: task.progress,
            type: task.type as "task" | "milestone",
          })
        );
        setTasks(ganttTasks);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError("Failed to fetch tasks");
    }
  };

  const addTask = async () => {
    if (!token) {
      setError("Please log in to add tasks");
      return;
    }
    try {
      const response = await axios.post("/api/tasks", newTask, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setNewTask({
          name: "",
          startDate: "",
          endDate: "",
          progress: 0,
          type: "task",
        });
        setIsModalOpen(false);
        fetchTasks(token);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError("Failed to add task");
    }
  };

  const updateTask = async () => {
    if (!token || !editTask) {
      setError("Please log in to update tasks");
      return;
    }
    try {
      const response = await axios.patch(
        `/api/tasks/${editTask.id}`,
        {
          name: editTask.name,
          startDate: editTask.start.toISOString().split("T")[0],
          endDate: editTask.end.toISOString().split("T")[0],
          progress: editTask.progress,
          type: editTask.type,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setEditTask(null);
        setIsModalOpen(false);
        fetchTasks(token);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError("Failed to update task");
    }
  };

  const openAddModal = () => {
    setEditTask(null);
    setNewTask({
      name: "",
      startDate: "",
      endDate: "",
      progress: 0,
      type: "task",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (task: GanttTask) => {
    const startDate = task.start.toLocaleDateString("en-CA");
    const endDate = task.end.toLocaleDateString("en-CA");

    setEditTask(task);
    setNewTask({
      name: task.name,
      startDate: startDate,
      endDate: endDate,
      progress: calculateProgress(startDate, endDate),
      type: task.type,
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = () => {
    if (editTask) {
      updateTask();
    } else {
      addTask();
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!token) {
      setError("Please log in to delete tasks");
      return;
    }
    try {
      const response = await axios.delete(`/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        fetchTasks(token);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError("Failed to delete task");
    }
  };

  const calculateProgress = (start: string, end: string): number => {
    if (!start || !end) return 0;

    const startDate = new Date(start);
    const endDate = new Date(end);
    const today = new Date();

    // If task hasn't started yet
    if (today < startDate) return 0;

    // If task is completed or past due
    if (today >= endDate) return 100;

    // Calculate progress percentage
    const totalDuration = endDate.getTime() - startDate.getTime();
    const completedDuration = today.getTime() - startDate.getTime();
    const progress = Math.round((completedDuration / totalDuration) * 100);

    return progress;
  };

  return (
    <div className="p-4 max-w-6xl mx-auto bg-white shadow-lg rounded-lg mt-10 mb-10 py-10 px-10 border-1">
      <h1 className="text-2xl font-bold mb-4">Gantt Chart</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <button
        onClick={openAddModal}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Add Task/Milestone
      </button>
      <button
        onClick={() => router.push("/teams")}
        className="bg-blue-500 text-white px-4 py-2 rounded ml-2" // Added some styling
      >
        Back to Teams
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border-1 shadow-md backdrop-blur-sm p-6 rounded-lg w-96 ">
            <h2 className="text-xl font-bold mb-4">
              {editTask ? "Edit Task/Milestone" : "Add Task/Milestone"}
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Task Name"
                value={newTask.name}
                onChange={(e) =>
                  setNewTask({ ...newTask, name: e.target.value })
                }
                className="border p-2 w-full"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newTask.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newTask.startDate
                      ? format(new Date(newTask.startDate), "PPP")
                      : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      newTask.startDate
                        ? new Date(newTask.startDate)
                        : undefined
                    }
                    onSelect={(date) =>
                      setNewTask({
                        ...newTask,
                        startDate: date
                          ? date.toLocaleDateString("en-CA") // Uses YYYY-MM-DD format regardless of timezone
                          : "",
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newTask.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newTask.endDate
                      ? format(new Date(newTask.endDate), "PPP")
                      : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      newTask.endDate ? new Date(newTask.endDate) : undefined
                    }
                    onSelect={(date) =>
                      setNewTask({
                        ...newTask,
                        endDate: date ? date.toLocaleDateString("en-CA") : "",
                      })
                    }
                    disabled={(date) =>
                      newTask.startDate
                        ? date < new Date(newTask.startDate)
                        : false
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <select
                value={newTask.type}
                onChange={(e) =>
                  setNewTask({
                    ...newTask,
                    type: e.target.value as "task" | "milestone",
                  })
                }
                className="border p-2 w-full"
              >
                <option value="task">Task</option>
                <option value="milestone">Milestone</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSubmit}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                {editTask ? "Update" : "Add"}
              </button>
              <button
                onClick={() => {
                  if (editTask) deleteTask(editTask.id);
                }}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {tasks.length > 0 ? (
        <Gantt
          tasks={tasks}
          viewMode={ViewMode.Day}
          columnWidth={60}
          listCellWidth="200px"
          barCornerRadius={3}
          barProgressColor="#4caf50"
          barBackgroundColor="#2196f3"
          milestoneBackgroundColor="#f44336"
          todayColor="red" // Add this line to show today's date
          onClick={(task) =>
            openEditModal({
              id: task.id,
              name: task.name,
              start: task.start,
              end: task.end,
              progress: task.progress,
              type: task.type as "task" | "milestone",
            })
          }
        />
      ) : (
        <p>No tasks available</p>
      )}
    </div>
  );
};

export default GanttChart;
