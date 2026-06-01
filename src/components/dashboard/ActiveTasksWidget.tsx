'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  project_id: string | null;
}

interface Project {
  id: string;
  name: string;
}

const PRIORITY_ORDER: Record<string, number> = { high: 0, moderate: 1, low: 2 };

const PRIORITY_LABEL: Record<string, { text: string; color: string }> = {
  high:     { text: 'High',     color: 'text-red-500'    },
  moderate: { text: 'Moderate', color: 'text-orange-500' },
  low:      { text: 'Low',      color: 'text-teal-600'   },
};

export default function ActiveTasksWidget() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [completing, setCompleting] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    const [tasksRes, projectsRes] = await Promise.all([
      fetch('/api/tasks?weekly_brief=false'),
      fetch('/api/projects'),
    ]);
    const tasksData = tasksRes.ok ? await tasksRes.json() : [];
    const projectsData = projectsRes.ok ? await projectsRes.json() : [];

    const active = Array.isArray(tasksData)
      ? tasksData
          .filter((t: Task) => t.status !== 'done')
          .sort((a: Task, b: Task) =>
            (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9))
          .slice(0, 5)
      : [];

    setTasks(active);
    setProjects(Array.isArray(projectsData) ? projectsData : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

  async function markDone(taskId: string) {
    setCompleting((prev) => new Set(prev).add(taskId));
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done' }),
    });
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setCompleting((prev) => {
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Tasks</p>
        <CheckCircle2 className="w-4 h-4 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-5">Active work</h3>

      {loading ? (
        <div className="space-y-3 flex-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400">All caught up ✓</p>
        </div>
      ) : (
        <div className="space-y-2 flex-1">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <button
                onClick={() => markDone(task.id)}
                disabled={completing.has(task.id)}
                className="mt-0.5 shrink-0 text-gray-300 hover:text-green-500 transition-colors disabled:opacity-50"
                title="Mark done"
              >
                {completing.has(task.id)
                  ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                  : <Circle className="w-5 h-5" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {[
                    task.project_id ? projectMap.get(task.project_id) : null,
                    PRIORITY_LABEL[task.priority]?.text,
                    task.status === 'in_progress' ? 'In progress' : 'Todo',
                  ]
                    .filter(Boolean)
                    .join(' / ')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/tasks"
        className="mt-4 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors self-start"
      >
        View all <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
