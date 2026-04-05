'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { Task, Project } from '@/types';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const PRIORITY_COLOR: Record<string, string> = {
  high: '#ef4444',
  moderate: '#eab308',
  low: '#22c55e',
};

function getWeekBounds(offset: number): { start: Date; end: Date; label: string } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + offset * 7);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const label = `${fmt(monday)} – ${fmt(sunday)}, ${monday.getFullYear()}`;

  return { start: monday, end: sunday, label };
}

function getDayDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// Returns noon on the given day in Toronto timezone offset (EDT = -4, EST = -5)
function noonOnDay(date: Date): string {
  const month = date.getMonth(); // 0-indexed
  const offsetHours = (month >= 3 && month <= 9) ? 4 : 5; // Apr–Oct = EDT (-4), else EST (-5)
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T12:00:00-0${offsetHours}:00`;
}

export default function WeeklyBrief() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick-add state
  const [addingDay, setAddingDay] = useState<string | null>(null); // day.toDateString() key
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [quickProjectId, setQuickProjectId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const quickInputRef = useRef<HTMLInputElement>(null);

  const { start, end, label } = useMemo(() => getWeekBounds(weekOffset), [weekOffset]);
  const dayDates = useMemo(() => getDayDates(start), [start]);
  const today = new Date();

  const loadTasks = useCallback(async () => {
    setLoading(true);
    const [tasksRes, projectsRes] = await Promise.all([
      fetch(`/api/tasks?week_start=${start.toISOString()}&week_end=${end.toISOString()}`),
      fetch('/api/projects'),
    ]);
    if (tasksRes.ok) setTasks(await tasksRes.json() as Task[]);
    if (projectsRes.ok) setProjects(await projectsRes.json() as Project[]);
    setLoading(false);
  }, [weekOffset]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // Focus the quick-add input when it opens
  useEffect(() => {
    if (addingDay) {
      setTimeout(() => quickInputRef.current?.focus(), 0);
    }
  }, [addingDay]);

  const projectName = (id: string | null) =>
    id ? (projects.find(p => p.id === id)?.name ?? null) : null;

  const tasksForDay = (day: Date) =>
    tasks
      .filter(t => t.due_at && isSameDay(new Date(t.due_at), day))
      .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime());

  const openQuickAdd = (day: Date) => {
    setAddingDay(day.toDateString());
    setQuickTitle('');
    setQuickPriority('moderate');
    setQuickProjectId('');
  };

  const cancelQuickAdd = () => {
    setAddingDay(null);
    setQuickTitle('');
  };

  const submitQuickAdd = async (day: Date) => {
    if (!quickTitle.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quickTitle.trim(),
          status: 'todo',
          priority: quickPriority,
          project_id: quickProjectId || null,
          due_at: noonOnDay(day),
        }),
      });
      if (res.ok) {
        const created = await res.json() as Task;
        setTasks(prev => [...prev, created]);
      }
    } finally {
      setSubmitting(false);
      cancelQuickAdd();
    }
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <button
          onClick={() => setWeekOffset(o => o - 1)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft size={16} />
          Prev
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{label}</span>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              Today
            </button>
          )}
        </div>
        <button
          onClick={() => setWeekOffset(o => o + 1)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 gap-2 overflow-hidden min-h-0">
        {dayDates.map((day, i) => {
          const isToday = isSameDay(day, today);
          const dayTasks = tasksForDay(day);
          const isAddingThisDay = addingDay === day.toDateString();

          return (
            <div
              key={i}
              className={`flex flex-col rounded-xl overflow-hidden ${isToday ? 'ring-1 ring-indigo-500' : ''}`}
            >
              {/* Day header */}
              <div className={`px-2 py-2 shrink-0 ${isToday ? 'bg-indigo-600' : 'bg-gray-800'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-xs font-semibold tracking-wider ${isToday ? 'text-indigo-100' : 'text-gray-400'}`}>
                      {DAYS[i]}
                    </div>
                    <div className={`text-lg font-bold leading-tight ${isToday ? 'text-white' : 'text-gray-300'}`}>
                      {day.getDate()}
                    </div>
                  </div>
                  <button
                    onClick={() => isAddingThisDay ? cancelQuickAdd() : openQuickAdd(day)}
                    className={`p-1 rounded transition-colors ${
                      isToday
                        ? 'text-indigo-200 hover:text-white hover:bg-indigo-500'
                        : 'text-gray-600 hover:text-white hover:bg-gray-700'
                    }`}
                    title="Add task"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* Tasks */}
              <div className="flex-1 bg-gray-900 p-1.5 overflow-y-auto space-y-1.5">
                {/* Quick-add form */}
                {isAddingThisDay && (
                  <div className="mb-1 p-2 bg-gray-800 rounded-lg border border-gray-700">
                    <input
                      ref={quickInputRef}
                      value={quickTitle}
                      onChange={e => setQuickTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') submitQuickAdd(day);
                        if (e.key === 'Escape') cancelQuickAdd();
                      }}
                      placeholder="Task name…"
                      className="w-full bg-transparent text-xs text-white placeholder-gray-500 outline-none mb-2"
                    />
                    <div className="flex gap-1">
                      <select
                        value={quickProjectId}
                        onChange={e => setQuickProjectId(e.target.value)}
                        className="flex-1 min-w-0 bg-gray-700 text-xs text-gray-300 rounded px-1.5 py-1 outline-none border-none"
                      >
                        <option value="">No project</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <select
                        value={quickPriority}
                        onChange={e => setQuickPriority(e.target.value as 'low' | 'moderate' | 'high')}
                        className="bg-gray-700 text-xs text-gray-300 rounded px-1 py-1 outline-none border-none"
                      >
                        <option value="low">Low</option>
                        <option value="moderate">Med</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div className="flex gap-1 mt-1.5">
                      <button
                        onClick={() => submitQuickAdd(day)}
                        disabled={!quickTitle.trim() || submitting}
                        className="flex-1 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded text-xs transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={cancelQuickAdd}
                        className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-400 rounded text-xs transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                {dayTasks.map(task => (
                  <div
                    key={task.id}
                    className="rounded-md p-2 bg-gray-800 hover:bg-gray-750 transition-colors border-l-2"
                    style={{ borderColor: PRIORITY_COLOR[task.priority] ?? PRIORITY_COLOR.moderate }}
                  >
                    {task.due_at && (
                      <div className="text-xs text-gray-400 mb-0.5 font-medium">
                        {formatTime(task.due_at)}
                      </div>
                    )}
                    <div className="text-xs font-medium text-white leading-snug">
                      {task.title}
                    </div>
                    {projectName(task.project_id) && (
                      <div className="text-xs text-indigo-400 mt-1">
                        {projectName(task.project_id)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
