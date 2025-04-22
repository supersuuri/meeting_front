"use client";

import { useProjectTasks, ProjectTask } from "@/hooks/useProjectTasks";
import { useEffect, useState } from "react";
import Alert from "./Alert";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import {
  format,
  addDays,
  eachDayOfInterval,
  isSameDay,
  differenceInDays,
} from "date-fns";
import { cn } from "@/lib/utils";
import DatePicker from "react-datepicker";
import { toast } from "sonner";

// Helper to group tasks by project
const groupTasksByProject = (tasks: ProjectTask[]) => {
  return tasks.reduce((acc, task) => {
    if (!acc[task.projectName]) {
      acc[task.projectName] = [];
    }
    acc[task.projectName].push(task);
    return acc;
  }, {} as Record<string, ProjectTask[]>);
};

// Form data interface
interface TaskFormData {
  projectName: string;
  taskName: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  assignedTo: string;
  color: string;
}

const initialFormData: TaskFormData = {
  projectName: "",
  taskName: "",
  startDate: new Date(),
  endDate: addDays(new Date(), 7),
  progress: 0,
  assignedTo: "",
  color: "#2196F3",
};

const GanttChart = () => {
  const { tasks, isLoading, error } = useProjectTasks();
  const [isClient, setIsClient] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>(initialFormData);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render on client
  if (!isClient) return null;

  // Show loading state
  if (isLoading)
    return (
      <div className="h-60 flex items-center justify-center">
        Loading project tasks...
      </div>
    );

  // Show error
  if (error)
    return (
      <Alert
        title={`Error loading project tasks: ${error}`}
        iconUrl="/assets/no-calls.svg"
      />
    );

  // If no tasks, show empty state
  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4">
        <Alert title="No project tasks found" iconUrl="/assets/no-calls.svg" />
        <AddTaskDialog
          formData={formData}
          setFormData={setFormData}
          open={dialogOpen}
          setOpen={setDialogOpen}
        />
      </div>
    );
  }

  // Group tasks by project
  const projectGroups = groupTasksByProject(tasks);

  // Find date range for all tasks
  const allDates = tasks.flatMap((task) => [
    new Date(task.startDate),
    new Date(task.endDate),
  ]);
  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

  // Ensure we show at least 14 days
  const endDate = new Date(
    Math.max(maxDate.getTime(), addDays(minDate, 14).getTime())
  );

  // Generate date headers
  const dateRange = eachDayOfInterval({ start: minDate, end: endDate });

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold">Project Timeline</h2>
        <AddTaskDialog
          formData={formData}
          setFormData={setFormData}
          open={dialogOpen}
          setOpen={setDialogOpen}
        />
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        {/* Header with dates */}
        <div className="flex min-w-max">
          <div className="w-48 flex-shrink-0 border-r border-gray-200 p-2 font-semibold">
            Project / Task
          </div>
          <div className="flex flex-1">
            {dateRange.map((date) => (
              <div
                key={date.toISOString()}
                className="w-16 flex-shrink-0 text-center border-r border-gray-200 p-2 text-xs"
              >
                {format(date, "MMM d")}
              </div>
            ))}
          </div>
        </div>

        {/* Projects and tasks */}
        {Object.entries(projectGroups).map(([projectName, projectTasks]) => (
          <div key={projectName} className="border-t border-gray-200">
            {/* Project row */}
            <div className="flex min-w-max bg-gray-50">
              <div className="w-48 flex-shrink-0 border-r border-gray-200 p-2 font-semibold">
                {projectName}
              </div>
              <div className="flex flex-1 h-8"></div>
            </div>

            {/* Task rows */}
            {projectTasks.map((task) => {
              const startDate = new Date(task.startDate);
              const endDate = new Date(task.endDate);
              const startOffset = differenceInDays(startDate, minDate);
              const duration = differenceInDays(endDate, startDate) + 1;

              return (
                <div key={task._id} className="flex min-w-max hover:bg-blue-50">
                  <div className="w-48 flex-shrink-0 border-r border-gray-200 p-2 pl-6 text-sm">
                    {task.taskName}
                  </div>
                  <div className="flex flex-1 relative h-10 items-center">
                    <div
                      className="absolute h-6 rounded-md flex items-center justify-between px-2 text-white text-xs"
                      style={{
                        left: `${startOffset * 64}px`,
                        width: `${duration * 64}px`,
                        backgroundColor: task.color || "#2196F3",
                      }}
                    >
                      <span className="truncate max-w-[100px]">
                        {task.taskName}
                      </span>
                      <span>{task.progress}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// Dialog component for adding new tasks
const AddTaskDialog = ({
  formData,
  setFormData,
  open,
  setOpen,
}: {
  formData: TaskFormData;
  setFormData: React.Dispatch<React.SetStateAction<TaskFormData>>;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      const data = await response.json();

      if (data.success) {
        toast.success("Task created successfully");
        setFormData(initialFormData);
        setOpen(false);

        // Reload page to refresh tasks
        window.location.reload();
      } else {
        throw new Error(data.message || "Failed to create task");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create task");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">Add New Task</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold mb-4">
            Add New Project Task
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Name</label>
              <Input
                value={formData.projectName}
                onChange={(e) =>
                  setFormData({ ...formData, projectName: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Task Name</label>
              <Input
                value={formData.taskName}
                onChange={(e) =>
                  setFormData({ ...formData, taskName: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <DatePicker
                selected={formData.startDate}
                onChange={(date) =>
                  setFormData({ ...formData, startDate: date || new Date() })
                }
                className="w-full rounded-md border border-input p-2"
                dateFormat="MMMM d, yyyy"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <DatePicker
                selected={formData.endDate}
                onChange={(date) =>
                  setFormData({
                    ...formData,
                    endDate: date || addDays(new Date(), 1),
                  })
                }
                className="w-full rounded-md border border-input p-2"
                dateFormat="MMMM d, yyyy"
                minDate={formData.startDate}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Progress (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    progress: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Assigned To</label>
              <Input
                value={formData.assignedTo}
                onChange={(e) =>
                  setFormData({ ...formData, assignedTo: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <Input
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Add Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GanttChart;
