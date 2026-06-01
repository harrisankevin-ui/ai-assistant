'use client';

import { useEffect, useState } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Memory {
  key: string;
  value: string;
  category: string;
}

export default function MemoryWidget() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/memories')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setMemories(Array.isArray(data) ? data.slice(0, 4) : []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-gray-400" />
        <h4 className="text-sm font-semibold text-gray-800">Memory</h4>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : memories.length === 0 ? (
        <p className="text-sm text-gray-400">No memories saved yet</p>
      ) : (
        <ul className="space-y-2">
          {memories.map((m) => (
            <li key={m.key} className="text-sm text-gray-600 leading-snug line-clamp-1">
              {m.value}
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/memory"
        className="mt-3 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
      >
        View all <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
