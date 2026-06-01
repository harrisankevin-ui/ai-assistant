'use client';

import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  due_at: string | null;
  project_id: string | null;
}

interface Project {
  id: string;
  name: string;
}

function getToday() {
  const now = new Date();
  const toronto = new Date(now.toLocaleString('en-CA', { timeZone: 'America/Toronto' }));
  const y = toronto.getFullYear();
  const m = String(toronto.getMonth() + 1).padStart(2, '0');
  const d = String(toronto.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getTodayDayName() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/Toronto' });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Toronto',
  });
}

export default function TodaySchedule() {
  const [events, setEvents] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const today = getToday();
      const [eventsRes, projectsRes] = await Promise.all([
        fetch(`/api/tasks?weekly_brief=true&date_from=${today}&date_to=${today}`),
        fetch('/api/projects'),
      ]);
      const eventsData = eventsRes.ok ? await eventsRes.json() : [];
      const projectsData = projectsRes.ok ? await projectsRes.json() : [];
      const sorted = Array.isArray(eventsData)
        ? [...eventsData].sort((a, b) =>
            (a.due_at ?? '').localeCompare(b.due_at ?? ''))
        : [];
      setEvents(sorted);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setLoading(false);
    }
    load();
  }, []);

  const projectMap = new Map(projects.map((p) => [p.id, p.name]));
  const dayName = getTodayDayName();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Weekly schedule</p>
        <Calendar className="w-4 h-4 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-4">{dayName}</h3>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-gray-400 py-2">Nothing scheduled today</p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="flex items-start gap-3">
              <span className="text-xs text-gray-400 font-mono w-16 shrink-0 pt-0.5">
                {event.due_at ? formatTime(event.due_at) : '—'}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{event.title}</p>
                {event.project_id && projectMap.get(event.project_id) && (
                  <p className="text-xs text-gray-400">{projectMap.get(event.project_id)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
