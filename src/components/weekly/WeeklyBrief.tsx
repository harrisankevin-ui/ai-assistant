'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

export default function WeeklyBrief() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

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

  const projectName = (id: string | null) =>
    id ? (projects.find(p => p.id === id)?.name ?? null) : null;

  const tasksForDay = (day: Date) =>
    tasks
      .filter(t => t.due_at && isSameDay(new Date(t.due_at), day))
      .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime());

  const hasAnyTasks = tasks.length > 0;

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

          return (
            <div
              key={i}
              className={`flex flex-col rounded-xl overflow-hidden ${isToday ? 'ring-1 ring-indigo-500' : ''}`}
            >
              {/* Day header */}
              <div className={`px-2 py-2.5 text-center shrink-0 ${isToday ? 'bg-indigo-600' : 'bg-gray-800'}`}>
                <div className={`text-xs font-semibold tracking-wider ${isToday ? 'text-indigo-100' : 'text-gray-400'}`}>
                  {DAYS[i]}
                </div>
                <div className={`text-lg font-bold leading-tight ${isToday ? 'text-white' : 'text-gray-300'}`}>
                  {day.getDate()}
                </div>
              </div>

              {/* Tasks */}
              <div className="flex-1 bg-gray-900 p-1.5 overflow-y-auto space-y-1.5">
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

      {/* Empty state */}
      {!loading && !hasAnyTasks && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-gray-500 text-sm">No scheduled tasks this week.</p>
            <p className="text-gray-600 text-xs mt-1">Ask Max to schedule something.</p>
          </div>
        </div>
      )}
    </div>
  );
}
