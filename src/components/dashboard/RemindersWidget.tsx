'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

interface Reminder {
  id: string;
  text: string;
  due_at: string;
  sent: boolean;
}

function relativeTime(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diff);
  if (abs < 60_000) return 'now';
  if (abs < 3_600_000) {
    const m = Math.round(abs / 60_000);
    return diff > 0 ? `in ${m}m` : `${m}m ago`;
  }
  if (abs < 86_400_000) {
    const h = Math.round(abs / 3_600_000);
    return diff > 0 ? `in ${h}h` : `${h}h ago`;
  }
  const d = Math.round(abs / 86_400_000);
  return diff > 0 ? (d === 1 ? 'tomorrow' : `in ${d}d`) : `${d}d ago`;
}

export default function RemindersWidget() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reminders')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setReminders(Array.isArray(data) ? data.filter((r: Reminder) => !r.sent) : []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-4 h-4 text-gray-400" />
        <h4 className="text-sm font-semibold text-gray-800">Reminders</h4>
      </div>

      {loading ? (
        <div className="h-6 bg-gray-100 rounded animate-pulse w-2/3" />
      ) : reminders.length === 0 ? (
        <p className="text-sm text-gray-400">No active reminders</p>
      ) : (
        <ul className="space-y-2">
          {reminders.slice(0, 4).map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-2">
              <span className="text-sm text-gray-700 truncate">{r.text}</span>
              <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">
                {relativeTime(r.due_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
