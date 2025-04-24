"use client"; // Only if using app router

import React, { useState } from "react";
import { Gantt, Task, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";

const initialTasks: Task[] = [
  {
    start: new Date("2025-04-21"),
    end: new Date("2025-04-25"),
    name: "Design Phase",
    id: "Task_1",
    type: "task",
    progress: 80,
    isDisabled: false,
    styles: {
      progressColor: "#2196f3",
      progressSelectedColor: "#1976d2",
    },
  },
  {
    start: new Date("2025-04-26"),
    end: new Date("2025-05-02"),
    name: "Development Phase 1",
    id: "Task_2",
    type: "task",
    progress: 40,
    isDisabled: false,
    dependencies: ["Task_1"],
    styles: {
      progressColor: "#4caf50",
      progressSelectedColor: "#388e3c",
    },
  },
  {
    start: new Date("2025-05-03"),
    end: new Date("2025-05-06"),
    name: "Testing",
    id: "Task_3",
    type: "task",
    progress: 10,
    isDisabled: false,
    dependencies: ["Task_2"],
    styles: {
      progressColor: "#f44336",
      progressSelectedColor: "#c62828",
    },
  },
  {
    start: new Date("2025-05-07"),
    end: new Date("2025-05-07"),
    name: "Release v1.0",
    id: "Milestone_1",
    type: "milestone",
    progress: 0,
    isDisabled: false,
    dependencies: ["Task_3"],
    styles: {
      progressColor: "#ff9800",
      progressSelectedColor: "#ef6c00",
    },
  },
  {
    start: new Date("2025-05-08"),
    end: new Date("2025-05-12"),
    name: "Post-Release Bug Fixes",
    id: "Task_4",
    type: "task",
    progress: 0,
    isDisabled: false,
    dependencies: ["Milestone_1"],
    styles: {
      progressColor: "#9c27b0",
      progressSelectedColor: "#7b1fa2",
    },
  },
];

const GanttChartTest = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    name: "",
    start: "",
    end: "",
    progress: 0,
  });

  const handleAddTask = () => {
    const task: Task = {
      id: `Task_${tasks.length + 1}`,
      name: newTask.name,
      start: new Date(newTask.start),
      end: new Date(newTask.end),
      type: "task",
      progress: newTask.progress,
      isDisabled: false,
      styles: {
        progressColor: "#607d8b",
        progressSelectedColor: "#455a64",
      },
    };
    setTasks([...tasks, task]);
    setIsPopupOpen(false);
    setNewTask({ name: "", start: "", end: "", progress: 0 });
  };

  return (
    <div className="bg-white rounded-lg shadow-md border-1 p-4 pt-6 my-6">
      <button
        className="my-2 px-4 py-2 bg-blue-500 text-white rounded"
        onClick={() => setIsPopupOpen(true)}
      >
        Add Task
      </button>
      <div className="rounded-lg">
        <Gantt tasks={tasks} viewMode={ViewMode.Day} />
      </div>

      {isPopupOpen && (
        <div className="fixed inset-0 bg-blurred rounded-lg bg-opacity-50 backdrop-blur-sm flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-lg font-bold mb-4">Add New Task</h2>
            <div className="mb-4">
              <label className="block mb-2">Task Name</label>
              <input
                type="text"
                className="border rounded w-full p-2"
                value={newTask.name}
                onChange={(e) =>
                  setNewTask({ ...newTask, name: e.target.value })
                }
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Start Date</label>
              <input
                type="date"
                className="border rounded w-full p-2"
                value={newTask.start}
                onChange={(e) =>
                  setNewTask({ ...newTask, start: e.target.value })
                }
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">End Date</label>
              <input
                type="date"
                className="border rounded w-full p-2"
                value={newTask.end}
                onChange={(e) =>
                  setNewTask({ ...newTask, end: e.target.value })
                }
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Progress (%)</label>
              <input
                type="number"
                className="border rounded w-full p-2"
                value={newTask.progress}
                onChange={(e) =>
                  setNewTask({
                    ...newTask,
                    progress: parseInt(e.target.value, 10),
                  })
                }
              />
            </div>
            <div className="flex justify-end">
              <button
                className="px-4 py-2 bg-gray-300 rounded mr-2"
                onClick={() => setIsPopupOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded"
                onClick={handleAddTask}
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GanttChartTest;
