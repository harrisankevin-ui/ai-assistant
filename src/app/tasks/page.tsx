'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Project } from '@/types';
import KanbanBoard from '@/components/tasks/KanbanBoard';

const PROJECT_COLORS = [
  'indigo', 'green', 'orange', 'pink', 'yellow', 'cyan', 'purple', 'red',
];

const COLOR_CLASSES: Record<string, string> = {
  indigo: 'text-indigo-400',
  green: 'text-green-400',
  orange: 'text-orange-400',
  pink: 'text-pink-400',
  yellow: 'text-yellow-400',
  cyan: 'text-cyan-400',
  purple: 'text-purple-400',
  red: 'text-red-400',
};

const DOT_CLASSES: Record<string, string> = {
  indigo: 'bg-indigo-400',
  green: 'bg-green-400',
  orange: 'bg-orange-400',
  pink: 'bg-pink-400',
  yellow: 'bg-yellow-400',
  cyan: 'bg-cyan-400',
  purple: 'bg-purple-400',
  red: 'bg-red-400',
};

export default function TasksPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('indigo');
  const addInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/projects').then(r => r.ok ? r.json() : []).then(setProjects);
  }, []);

  useEffect(() => {
    if (adding) addInputRef.current?.focus();
  }, [adding]);

  const createProject = async () => {
    const name = newName.trim();
    if (!name) return;
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color: newColor }),
    });
    if (res.ok) {
      const p = await res.json() as Project;
      setProjects(prev => [...prev, p]);
      setSelectedProjectId(p.id);
    }
    setNewName('');
    setAdding(false);
  };

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    setProjects(prev => prev.filter(p => p.id !== id));
    if (selectedProjectId === id) setSelectedProjectId(null);
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId) ?? null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800">
        <h1 className="text-lg font-semibold text-white">
          {selectedProject ? selectedProject.name : 'All Tasks'}
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {selectedProject
            ? `Tasks for ${selectedProject.name}`
            : 'All tasks across every project'}
        </p>
      </div>

      {/* Project filter tab bar */}
      <div className="flex items-center gap-2 overflow-x-auto px-6 py-3 border-b border-gray-800 shrink-0">
        {/* All Tasks tab */}
        <button
          onClick={() => setSelectedProjectId(null)}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            selectedProjectId === null
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          All Tasks
        </button>

        {/* Project tabs */}
        {projects.map(p => (
          <div key={p.id} className="group relative shrink-0">
            <button
              onClick={() => setSelectedProjectId(p.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors pr-7 ${
                selectedProjectId === p.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${DOT_CLASSES[p.color] ?? 'bg-indigo-400'}`} />
              <span>{p.name}</span>
            </button>
            <button
              onClick={(e) => deleteProject(p.id, e)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-0.5 text-gray-500 hover:text-red-400 transition-all"
            >
              <Trash2 size={11} />
            </button>
          </div>
        ))}

        {/* Add Project */}
        {adding ? (
          <div className="flex items-center gap-2 shrink-0">
            <input
              ref={addInputRef}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') createProject();
                if (e.key === 'Escape') { setAdding(false); setNewName(''); }
              }}
              placeholder="Project name…"
              className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500 w-36"
            />
            <div className="flex gap-1">
              {PROJECT_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`w-4 h-4 rounded-full transition-all ${DOT_CLASSES[c] ?? 'bg-indigo-400'} ${newColor === c ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-900' : ''}`}
                />
              ))}
            </div>
            <button
              onClick={createProject}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => { setAdding(false); setNewName(''); }}
              className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <Plus size={13} />
            Add Project
          </button>
        )}
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard projectId={selectedProjectId} />
      </div>
    </div>
  );
}
