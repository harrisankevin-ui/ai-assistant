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
    <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.06)] rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-3.5 h-3.5 text-gray-400" />
        <h4 className="text-sm font-semibold text-gray-800">Memory</h4>
      </div>
      {loading ? (
        <div className="space-y-1.5">
          {[1, 2].map((i) => (
            <div key={i} className="h-3.5 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : memories.length === 0 ? (
        <p className="text-sm text-gray-400">No memories saved yet</p>
      ) : (
        <ul className="space-y-1.5">
          {memories.map((m) => (
            <li key={m.key} className="text-xs text-gray-600 leading-snug line-clamp-1">
              {m.value}
            </li>
          ))}
        </ul>
      )}
      <Link
        href="/memory"
        className="mt-2.5 flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-700 transition-colors"
      >
        View all <ArrowRight className="w-2.5 h-2.5" />
      </Link>
    </div>
  );
}
