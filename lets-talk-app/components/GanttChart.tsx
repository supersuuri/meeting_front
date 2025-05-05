/* app/page.tsx */
'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';

interface ProjectTask {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  type: 'task' | 'milestone';
  userId: string;
}

interface GanttTask extends Task {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  type: 'task' | 'milestone';
}

const GanttChart = () => {
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [newTask, setNewTask] = useState({
    name: '',
    startDate: '',
    endDate: '',
    progress: 0,
    type: 'task' as 'task' | 'milestone',
  });
  const [editTask, setEditTask] = useState<GanttTask | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      fetchTasks(storedToken);
    } else {
      setError('Please log in to view tasks');
    }
  }, []);

  const fetchTasks = async (authToken: string) => {
    try {
      const response = await axios.get('/api/tasks', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.data.success) {
        const ganttTasks: GanttTask[] = response.data.tasks.map((task: ProjectTask) => ({
          id: task._id,
          name: task.name,
          start: new Date(task.startDate),
          end: new Date(task.endDate),
          progress: task.progress,
          type: task.type as 'task' | 'milestone',
        }));
        setTasks(ganttTasks);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Failed to fetch tasks');
    }
  };

  const addTask = async () => {
    if (!token) {
      setError('Please log in to add tasks');
      return;
    }
    try {
      const response = await axios.post('/api/tasks', newTask, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setNewTask({ name: '', startDate: '', endDate: '', progress: 0, type: 'task' });
        setIsModalOpen(false);
        fetchTasks(token);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Failed to add task');
    }
  };

  const updateTask = async () => {
    if (!token || !editTask) {
      setError('Please log in to update tasks');
      return;
    }
    try {
      const response = await axios.patch(
        `/api/tasks/${editTask.id}`,
        {
          name: editTask.name,
          startDate: editTask.start.toISOString().split('T')[0],
          endDate: editTask.end.toISOString().split('T')[0],
          progress: editTask.progress,
          type: editTask.type,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setEditTask(null);
        setIsModalOpen(false);
        // Fetch tasks after update, only if update was successful
        fetchTasks(token);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Failed to update task');
    }
  };
  
  const deleteTask = async (taskId: string) => {
    if (!token) {
      setError('Please log in to delete tasks');
      return;
    }
    try {
      const response = await axios.delete(`/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        // Fetch tasks after deletion, only if deletion was successful
        fetchTasks(token);
        setIsModalOpen(false); // Close the modal after deletion
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Failed to delete task');
    }
  };
  
  const openAddModal = () => {
    setEditTask(null);
    setNewTask({ name: '', startDate: '', endDate: '', progress: 0, type: 'task' });
    setIsModalOpen(true);
  };

  const openEditModal = (task: GanttTask) => {
    setEditTask(task);
    setNewTask({
      name: task.name,
      startDate: task.start.toISOString().split('T')[0],
      endDate: task.end.toISOString().split('T')[0],
      progress: task.progress,
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

  return (
    <div className="p-4 max-w-6xl w-full mx-auto bg-white shadow-lg rounded-lg mt-10 mb-10 py-10 px-10 border-1">
      <h1 className="text-2xl font-bold mb-4">Gantt Chart</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <button
        onClick={openAddModal}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Add Task/Milestone
      </button>

      {isModalOpen && (
      <div className="fixed inset-0 backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white border-1 shadow-md backdrop-blur-sm p-6 rounded-lg w-96 ">
            <h2 className="text-xl font-bold mb-4">
              {editTask ? 'Edit Task / Milestone' : 'Add Task / Milestone'}
            </h2>
            <div className="space-y-4">
              <select
                value={newTask.type}
                onChange={(e) =>
                  setNewTask({ ...newTask, type: e.target.value as 'task' | 'milestone' })
                }
                className="border p-2 w-full"
              >
                <option value="task">Task</option>
                <option value="milestone">Milestone</option>
              </select>
              {
                newTask.type === 'milestone' ? (
                  <>
                  <input
                    type="text"
                    placeholder="Task Name"
                    value={newTask.name}
                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                    className="border p-2 w-full"
                  />
                  <input
                    type="date"
                    value={newTask.startDate}
                    onChange={(e) => {
                      const newStartDate = e.target.value;
                      setNewTask({ 
                        ...newTask, 
                        startDate: newStartDate,
                        endDate: newStartDate // Set endDate to the same value as startDate
                      });
                    }}
                    className="border p-2 w-full"
                  />
                </>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Task Name"
                      value={newTask.name}
                      onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                      className="border p-2 w-full"
                    />
                    <input
                      type="date"
                      value={newTask.startDate}
                      onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
                      className="border p-2 w-full"
                    />
                    <input
                      type="date"
                      value={newTask.endDate}
                      onChange={(e) => setNewTask({ ...newTask, endDate: e.target.value })}
                      className="border p-2 w-full"
                    />
                  </>
                )
              }
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
                {editTask ? 'Update' : 'Add'}
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
          onClick={(task) =>
            openEditModal({
              id: task.id,
              name: task.name,
              start: task.start,
              end: task.end,
              progress: task.progress,
              type: task.type as 'task' | 'milestone',
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
