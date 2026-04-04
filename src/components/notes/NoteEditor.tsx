'use client';

import { useState, useEffect } from 'react';
import { Save, Trash2, X, Plus } from 'lucide-react';
import type { Note } from '@/types';

interface Props {
  note: Note;
  onSave: (updated: Note) => void;
  onDelete: (id: string) => void;
}

export default function NoteEditor({ note, onSave, onDelete }: Props) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tags, setTags] = useState<string[]>(note.tags);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags);
    setDirty(false);
  }, [note.id, note.title, note.content, note.tags]);

  const handleChange = () => setDirty(true);

  const save = async () => {
    setSaving(true);
    const res = await fetch(`/api/notes/${note.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, tags }),
    });
    if (res.ok) {
      const updated = await res.json() as Note;
      onSave(updated);
      setDirty(false);
    }
    setSaving(false);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      const newTags = [...tags, t];
      setTags(newTags);
      setTagInput('');
      setDirty(true);
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
    setDirty(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <input
          value={title}
          onChange={(e) => { setTitle(e.target.value); handleChange(); }}
          className="flex-1 bg-transparent text-lg font-semibold text-white outline-none placeholder-gray-500"
          placeholder="Note title…"
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
            onClick={() => onDelete(note.id)}
            className="p-1.5 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-gray-800"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-1.5 px-4 py-2 border-b border-gray-800">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 px-2 py-0.5 bg-indigo-900/50 text-indigo-300 rounded-full text-xs"
          >
            {tag}
            <button onClick={() => removeTag(tag)} className="hover:text-red-400">
              <X size={10} />
            </button>
          </span>
        ))}
        <div className="flex items-center gap-1">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            placeholder="Add tag…"
            className="bg-transparent text-xs text-gray-400 placeholder-gray-600 outline-none w-20"
          />
          <button onClick={addTag} className="text-gray-500 hover:text-indigo-400">
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* Content */}
      <textarea
        value={content}
        onChange={(e) => { setContent(e.target.value); handleChange(); }}
        placeholder="Start writing…"
        className="flex-1 p-4 bg-transparent text-sm text-gray-200 placeholder-gray-600 resize-none outline-none font-mono leading-relaxed"
      />
    </div>
  );
}
