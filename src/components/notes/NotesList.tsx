'use client';

import { Tag, Clock } from 'lucide-react';
import type { Note } from '@/types';

interface Props {
  notes: Note[];
  activeId: string | null;
  onSelect: (note: Note) => void;
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

export default function NotesList({ notes, activeId, onSelect }: Props) {
  if (notes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        No notes yet. Create one!
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-800">
      {notes.map((note) => (
        <button
          key={note.id}
          onClick={() => onSelect(note)}
          className={`w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors ${
            activeId === note.id ? 'bg-gray-800' : ''
          }`}
        >
          <h3 className="font-medium text-sm text-white truncate">{note.title}</h3>
          <p className="text-xs text-gray-400 truncate mt-0.5">
            {note.content.slice(0, 60) || 'Empty note'}
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock size={10} />
              {timeAgo(note.updated_at)}
            </span>
            {note.tags.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Tag size={10} />
                {note.tags.slice(0, 2).join(', ')}
                {note.tags.length > 2 && ` +${note.tags.length - 2}`}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
