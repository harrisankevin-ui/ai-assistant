'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, FileText, BookOpen, Kanban, Bot,
  ChevronDown, ChevronRight, Plus, Trash2, Circle, CalendarDays,
} from 'lucide-react';
import type { Project } from '@/types';

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

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentProjectId = searchParams.get('project');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasksOpen, setTasksOpen] = useState(true);
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
    }
    setNewName('');
    setAdding(false);
  };

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    setProjects(prev => prev.filter(p => p.id !== id));
    // If currently viewing this project, go to all tasks
    if (pathname.startsWith('/tasks') && window.location.search.includes(id)) {
      router.push('/tasks');
    }
  };

  const navItemClass = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
    }`;

  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col h-screen shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-gray-800">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <Bot size={16} className="text-white" />
        </div>
        <span className="font-semibold text-white">AI Assistant</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {/* Chat */}
        <Link href="/chat" className={navItemClass(pathname.startsWith('/chat'))}>
          <MessageSquare size={18} />
          Chat
        </Link>

        {/* Notes */}
        <Link href="/notes" className={navItemClass(pathname.startsWith('/notes'))}>
          <FileText size={18} />
          Notes
        </Link>

        {/* Documents */}
        <Link href="/documents" className={navItemClass(pathname.startsWith('/documents'))}>
          <BookOpen size={18} />
          Documents
        </Link>

        {/* Tasks — collapsible with projects */}
        <div>
          <button
            onClick={() => setTasksOpen(o => !o)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith('/tasks') ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Kanban size={18} />
            <span className="flex-1 text-left">Tasks</span>
            {tasksOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {tasksOpen && (
            <div className="ml-6 mt-0.5 space-y-0.5">
              {/* All Tasks */}
              <Link
                href="/tasks"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  pathname === '/tasks' && !currentProjectId
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-500 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Circle size={10} className="text-gray-500 fill-gray-500" />
                All Tasks
              </Link>

              {/* Project links */}
              {projects.map(p => (
                <div key={p.id} className="group flex items-center gap-1">
                  <Link
                    href={`/tasks?project=${p.id}`}
                    className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      pathname.startsWith('/tasks') && currentProjectId === p.id
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-500 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Circle size={10} className={`${COLOR_CLASSES[p.color] || 'text-indigo-400'} fill-current`} />
                    <span className="truncate">{p.name}</span>
                  </Link>
                  <button
                    onClick={(e) => deleteProject(p.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}

              {/* Add project */}
              {adding ? (
                <div className="px-2 py-1 space-y-1.5">
                  <input
                    ref={addInputRef}
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') createProject();
                      if (e.key === 'Escape') { setAdding(false); setNewName(''); }
                    }}
                    placeholder="Project name…"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                  />
                  <div className="flex gap-1 flex-wrap">
                    {PROJECT_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setNewColor(c)}
                        className={`w-4 h-4 rounded-full transition-all ${COLOR_CLASSES[c]?.replace('text-', 'bg-') || 'bg-indigo-400'} ${newColor === c ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-900' : ''}`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={createProject}
                      className="flex-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setAdding(false); setNewName(''); }}
                      className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded text-xs transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAdding(true)}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-400 text-xs transition-colors rounded-lg hover:bg-gray-800 w-full"
                >
                  <Plus size={12} />
                  Add Project
                </button>
              )}
            </div>
          )}
        </div>

        {/* Weekly Brief */}
        <Link href="/weekly" className={navItemClass(pathname.startsWith('/weekly'))}>
          <CalendarDays size={18} />
          <span>Weekly Brief</span>
        </Link>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-800">
        <p className="text-xs text-gray-500">Powered by Claude</p>
      </div>
    </aside>
  );
}
