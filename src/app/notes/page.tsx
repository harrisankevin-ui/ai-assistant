'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Tag } from 'lucide-react';
import type { Note, Project } from '@/types';
import NotesList from '@/components/notes/NotesList';
import NoteEditor from '@/components/notes/NoteEditor';

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetch('/api/projects').then(r => r.ok ? r.json() : []).then(setProjects);
  }, []);

  const loadNotes = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (filterTag) params.set('tag', filterTag);
    if (filterProject) params.set('project', filterProject);
    const res = await fetch(`/api/notes?${params}`);
    if (res.ok) {
      const data = await res.json() as Note[];
      setNotes(data);
      const tags = Array.from(new Set(data.flatMap((n) => n.tags))).sort();
      setAllTags(tags);
    }
  }, [search, filterTag, filterProject]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const createNote = async () => {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Untitled Note', content: '', tags: [], project_id: filterProject || null }),
    });
    if (res.ok) {
      const note = await res.json() as Note;
      setNotes((prev) => [note, ...prev]);
      setActiveNote(note);
    }
  };

  const handleSave = (updated: Note) => {
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    setActiveNote(updated);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeNote?.id === id) setActiveNote(null);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full shrink-0">
        {/* Header */}
        <div className="px-3 py-3 border-b border-gray-800 space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-semibold text-white">Notes</h1>
            <button
              onClick={createNote}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
          {/* Search */}
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-2.5 py-1.5">
            <Search size={13} className="text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes…"
              className="bg-transparent text-xs text-gray-300 placeholder-gray-500 outline-none flex-1"
            />
          </div>
          {/* Project filter */}
          {projects.length > 0 && (
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 outline-none focus:border-indigo-500"
            >
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="px-3 py-2 border-b border-gray-800 flex flex-wrap gap-1">
            <button
              onClick={() => setFilterTag('')}
              className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                filterTag === '' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                  filterTag === tag ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <Tag size={9} />
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto">
          <NotesList
            notes={notes}
            activeId={activeNote?.id ?? null}
            onSelect={(note) => setActiveNote(note)}
          />
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 h-full overflow-hidden">
        {activeNote ? (
          <NoteEditor note={activeNote} onSave={handleSave} onDelete={handleDelete} />
        ) : (
          <div className="flex-1 h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-sm">Select a note or</p>
              <button
                onClick={createNote}
                className="mt-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
              >
                Create New Note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
