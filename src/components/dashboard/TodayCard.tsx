'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Stats {
  events: number;
  openTasks: number;
  reminders: number;
}

function getToday() {
  const now = new Date();
  const toronto = new Date(
    now.toLocaleString('en-CA', { timeZone: 'America/Toronto' })
  );
  const y = toronto.getFullYear();
  const m = String(toronto.getMonth() + 1).padStart(2, '0');
  const d = String(toronto.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildHeadline(events: number, tasks: number): string {
  if (events === 0 && tasks === 0) return 'Clear day';
  if (events > 0 && tasks === 0) {
    return `Clear day, ${events} commitment${events !== 1 ? 's' : ''}`;
  }
  if (events === 0 && tasks > 0) {
    return `${tasks} open task${tasks !== 1 ? 's' : ''}`;
  }
  return `${events} commitment${events !== 1 ? 's' : ''}, ${tasks} task${tasks !== 1 ? 's' : ''}`;
}

export default function TodayCard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ events: 0, openTasks: 0, reminders: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const today = getToday();

      const [eventsRes, tasksRes, remindersRes] = await Promise.all([
        fetch(`/api/tasks?weekly_brief=true&date_from=${today}&date_to=${today}`),
        fetch(`/api/tasks?weekly_brief=false`),
        fetch(`/api/reminders`),
      ]);

      const events = eventsRes.ok ? await eventsRes.json() : [];
      const tasks = tasksRes.ok ? await tasksRes.json() : [];
      const reminders = remindersRes.ok ? await remindersRes.json() : [];

      const openTasks = Array.isArray(tasks)
        ? tasks.filter((t: { status: string }) => t.status !== 'done').length
        : 0;

      setStats({
        events: Array.isArray(events) ? events.length : 0,
        openTasks,
        reminders: Array.isArray(reminders) ? reminders.length : 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  const headline = loading ? ' ' : buildHeadline(stats.events, stats.openTasks);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">Today</p>
      <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-4 min-h-[2.5rem]">
        {headline}
      </h2>

      <button
        onClick={() => router.push('/weekly')}
        className="flex items-center gap-1.5 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors mb-5"
      >
        <Plus className="w-4 h-4" />
        Add
      </button>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Events', value: stats.events },
          { label: 'Open tasks', value: stats.openTasks },
          { label: 'Reminders', value: stats.reminders },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{loading ? '–' : value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
