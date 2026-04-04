'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskStatus, Project } from '@/types';
import TaskColumn from './TaskColumn';
import TaskModal from './TaskModal';

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];

interface Props {
  projectId?: string | null;
}

export default function KanbanBoard({ projectId }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo');

  const loadTasks = useCallback(async () => {
    const url = projectId ? `/api/tasks?project=${projectId}` : '/api/tasks';
    const res = await fetch(url);
    if (res.ok) setTasks(await res.json());
  }, [projectId]);

  useEffect(() => {
    loadTasks();
    fetch('/api/projects').then(r => r.ok ? r.json() : []).then(setProjects);
  }, [loadTasks]);

  const projectName = (id: string | null) =>
    id ? (projects.find(p => p.id === id)?.name ?? null) : null;

  const handleAdd = (status: TaskStatus) => {
    setEditingTask({});
    setDefaultStatus(status);
    setModalOpen(true);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setDefaultStatus(task.status);
    setModalOpen(true);
  };

  const handleSave = async (data: { title: string; description: string; status: TaskStatus }) => {
    const payload = { ...data, project_id: projectId ?? null };

    if (editingTask?.id) {
      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json() as Task;
        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      }
    } else {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json() as Task;
        setTasks(prev => [...prev, created]);
      }
    }
    setModalOpen(false);
    setEditingTask(null);
  };

  const handleMove = async (id: string, newStatus: TaskStatus) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json() as Task;
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="flex gap-4 h-full p-6 overflow-x-auto">
      {STATUSES.map(status => (
        <TaskColumn
          key={status}
          status={status}
          tasks={tasks.filter(t => t.status === status)}
          projectName={projectId ? null : projectName}
          onMove={handleMove}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleAdd}
        />
      ))}

      {modalOpen && (
        <TaskModal
          task={editingTask}
          defaultStatus={defaultStatus}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingTask(null); }}
        />
      )}
    </div>
  );
}
