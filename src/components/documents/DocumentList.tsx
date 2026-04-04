'use client';

import { Clock } from 'lucide-react';
import type { Document } from '@/types';

interface Props {
  documents: Document[];
  activeId: string | null;
  onSelect: (doc: Document) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DocumentList({ documents, activeId, onSelect }: Props) {
  if (documents.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        No documents yet. Create one!
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-800">
      {documents.map((doc) => (
        <button
          key={doc.id}
          onClick={() => onSelect(doc)}
          className={`w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors ${
            activeId === doc.id ? 'bg-gray-800' : ''
          }`}
        >
          <h3 className="font-medium text-sm text-white truncate">{doc.title}</h3>
          <p className="text-xs text-gray-400 truncate mt-0.5">
            {doc.content.slice(0, 80) || 'Empty document'}
          </p>
          <span className="flex items-center gap-1 text-xs text-gray-500 mt-1.5">
            <Clock size={10} />
            {timeAgo(doc.updated_at)}
          </span>
        </button>
      ))}
    </div>
  );
}
