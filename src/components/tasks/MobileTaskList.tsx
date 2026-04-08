'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, CheckCircle2, Circle, Loader } from 'lucide-react';
import type { Task, Project } from '@/types';

const PRIORITY_BORDER: Record<string, string> = {
  high:     'border-l-red-500',
  moderate: 'border-l-orange-400',
  low:      'border-l-teal-500',
};

const PRIORITY_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  high:     { bg: 'bg-red-500/20',    text: 'text-red-400',    label: 'HIGH' },
  moderate: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'MED'  },
  low:      { bg: 'bg-teal-500/20',   text: 'text-teal-400',   label: 'LOW'  },
};

const DOT_CLASSES: Record<string, string> = {
  indigo: 'bg-indigo-400', green: 'bg-green-400', orange: 'bg-orange-400',
  pink: 'bg-pink-400', yellow: 'bg-yellow-400', cyan: 'bg-cyan-400',
  purple: 'bg-purple-400', red: 'bg-red-400',
};

const STATUS_TABS = ['All', 'To Do', 'In Progress', 'Done'] as const;
type StatusTab = typeof STATUS_TABS[number];

const STATUS_MAP: Record<StatusTab, string | null> = {
  'All': null, 'To Do': 'todo', 'In Progress': 'in_progress', 'Done': 'done',
};

const NEXT_STATUS: Record<string, string> = {
  'todo': 'in_progress',
  'in_progress': 'done',
  'done': 'todo',
};

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

function formatDue(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (isToday(iso)) return 'Today';
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
    ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  });
}

interface Props {
  projectId: string | null;
}

export default function MobileTaskList({ projectId }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(projectId);
  const [statusTab, setStatusTab] = useState<StatusTab>('All');

  const loadTasks = useCallback(async () => {
    const url = selectedProject ? `/api/tasks?project=${selectedProject}` : '/api/tasks';
    const res = await fetch(url);
    if (res.ok) setTasks(await res.json());
  }, [selectedProject]);

  useEffect(() => {
    loadTasks();
    fetch('/api/projects').then(r => r.ok ? r.json() : []).then(setProjects);
  }, [loadTasks]);

  // Sync external projectId prop
  useEffect(() => { setSelectedProject(projectId); }, [projectId]);

  const cycleStatus = async (task: Task) => {
    const newStatus = NEXT_STATUS[task.status] ?? 'todo';
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json() as Task;
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    }
  };

  const projectName = (id: string | null) =>
    id ? (projects.find(p => p.id === id)?.name ?? null) : null;

  // Filter by status tab
  const statusFilter = STATUS_MAP[statusTab];
  const filtered = tasks.filter(t =>
    (statusFilter === null || t.status === statusFilter)
  );

  // Group by priority
  const high     = filtered.filter(t => t.priority === 'high');
  const moderate = filtered.filter(t => t.priority === 'moderate');
  const low      = filtered.filter(t => t.priority === 'low');

  const groups = [
    { label: 'High Priority', tasks: high },
    { label: 'Medium Priority', tasks: moderate },
    { label: 'Low Priority', tasks: low },
  ].filter(g => g.tasks.length > 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Project filter pills */}
      <div className="flex gap-2 px-4 pt-3 pb-1 overflow-x-auto shrink-0 scrollbar-none">
        <button
          onClick={() => setSelectedProject(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            selectedProject === null ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'
          }`}
        >
          All
        </button>
        {projects.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedProject(p.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedProject === p.id ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${DOT_CLASSES[p.color] ?? 'bg-indigo-400'}`} />
            {p.name}
          </button>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto shrink-0 scrollbar-none">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setStatusTab(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              statusTab === tab ? 'bg-gray-700 text-white' : 'text-gray-500'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <CheckCircle2 size={36} className="text-gray-700" />
            <p className="text-gray-500 text-sm">No tasks</p>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.label} className="mt-4">
              {/* Section header */}
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest px-1 mb-2">
                {group.label}
              </p>

              {/* Section card */}
              <div className="bg-gray-900 rounded-2xl overflow-hidden border border-white/5">
                {group.tasks.map((task, i) => {
                  const badge = PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE.moderate;
                  const showToday = task.priority === 'high' && task.due_at !== null && isToday(task.due_at);
                  const badgeText = showToday ? 'Today' : badge.label;
                  const pName = !selectedProject ? projectName(task.project_id) : null;

                  return (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 px-4 py-3.5 border-l-4 min-h-[64px] ${
                        PRIORITY_BORDER[task.priority] ?? PRIORITY_BORDER.moderate
                      } ${i > 0 ? 'border-t border-white/5' : ''}`}
                    >
                      {/* Status cycle button — tap to advance: todo → in_progress → done → todo */}
                      <button
                        onClick={() => cycleStatus(task)}
                        className="shrink-0 active:scale-90 transition-transform"
                        title={`Status: ${task.status} — tap to advance`}
                      >
                        {task.status === 'done'
                          ? <CheckCircle2 size={22} className="text-indigo-400" />
                          : task.status === 'in_progress'
                            ? <Loader size={22} className="text-orange-400" />
                            : <Circle size={22} className="text-gray-500" />
                        }
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-[15px] font-semibold leading-snug ${task.status === 'done' ? 'line-through text-gray-500' : 'text-white'}`}>
                          {task.title}
                        </p>
                        {(pName || task.due_at) && (
                          <div className="flex items-center gap-2 mt-0.5">
                            {pName && (
                              <span className="text-xs text-indigo-400 font-medium">{pName}</span>
                            )}
                            {pName && task.due_at && (
                              <span className="text-gray-600">·</span>
                            )}
                            {task.due_at && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar size={10} />
                                {formatDue(task.due_at)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Priority badge */}
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${badge.bg} ${badge.text}`}>
                        {badgeText}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
