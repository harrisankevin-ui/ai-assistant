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
  if (events > 0 && tasks === 0)
    return `Clear day, ${events} commitment${events !== 1 ? 's' : ''}`;
  if (events === 0 && tasks > 0)
    return `${tasks} open task${tasks !== 1 ? 's' : ''}`;
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
    <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.06)] rounded-2xl p-4">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1.5">Today</p>
      <h2 className="text-xl font-bold text-gray-900 leading-tight mb-3 min-h-[1.75rem]">
        {headline}
      </h2>

      <button
        onClick={() => router.push('/weekly')}
        className="flex items-center gap-1.5 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors mb-4"
      >
        <Plus className="w-3.5 h-3.5" />
        Add
      </button>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Events', value: stats.events },
          { label: 'Open tasks', value: stats.openTasks },
          { label: 'Reminders', value: stats.reminders },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-50/80 rounded-xl p-2.5 text-center">
            <p className="text-xl font-bold text-gray-900">{loading ? '–' : value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
