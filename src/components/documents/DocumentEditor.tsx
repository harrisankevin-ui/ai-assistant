'use client';

import { useState, useEffect } from 'react';
import { Save, Trash2 } from 'lucide-react';
import type { Document } from '@/types';

interface Props {
  document: Document;
  onSave: (updated: Document) => void;
  onDelete: (id: string) => void;
}

export default function DocumentEditor({ document, onSave, onDelete }: Props) {
  const [title, setTitle] = useState(document.title);
  const [content, setContent] = useState(document.content);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setTitle(document.title);
    setContent(document.content);
    setDirty(false);
  }, [document.id, document.title, document.content]);

  const save = async () => {
    setSaving(true);
    const res = await fetch(`/api/documents/${document.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });
    if (res.ok) {
      const updated = await res.json() as Document;
      onSave(updated);
      setDirty(false);
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <input
          value={title}
          onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
          className="flex-1 bg-transparent text-lg font-semibold text-white outline-none placeholder-gray-500"
          placeholder="Document title…"
        />
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            <Save size={13} />
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={() => onDelete(document.id)}
            className="p-1.5 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-gray-800"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Content */}
      <textarea
        value={content}
        onChange={(e) => { setContent(e.target.value); setDirty(true); }}
        placeholder="Start writing your document…"
        className="flex-1 p-4 bg-transparent text-sm text-gray-200 placeholder-gray-600 resize-none outline-none leading-relaxed"
      />
    </div>
  );
}
