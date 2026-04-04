'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search } from 'lucide-react';
import type { Document, Project } from '@/types';
import DocumentList from '@/components/documents/DocumentList';
import DocumentEditor from '@/components/documents/DocumentEditor';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDoc, setActiveDoc] = useState<Document | null>(null);
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetch('/api/projects').then(r => r.ok ? r.json() : []).then(setProjects);
  }, []);

  const loadDocuments = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (filterProject) params.set('project', filterProject);
    const res = await fetch(`/api/documents?${params}`);
    if (res.ok) setDocuments(await res.json());
  }, [search, filterProject]);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  const createDocument = async () => {
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Untitled Document', content: '', project_id: filterProject || null }),
    });
    if (res.ok) {
      const doc = await res.json() as Document;
      setDocuments((prev) => [doc, ...prev]);
      setActiveDoc(doc);
    }
  };

  const handleSave = (updated: Document) => {
    setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    setActiveDoc(updated);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (activeDoc?.id === id) setActiveDoc(null);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full shrink-0">
        <div className="px-3 py-3 border-b border-gray-800 space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-semibold text-white">Documents</h1>
            <button
              onClick={createDocument}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-2.5 py-1.5">
            <Search size={13} className="text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents…"
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

        <div className="flex-1 overflow-y-auto">
          <DocumentList
            documents={documents}
            activeId={activeDoc?.id ?? null}
            onSelect={setActiveDoc}
          />
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 h-full overflow-hidden">
        {activeDoc ? (
          <DocumentEditor document={activeDoc} onSave={handleSave} onDelete={handleDelete} />
        ) : (
          <div className="flex-1 h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-sm">Select a document or</p>
              <button
                onClick={createDocument}
                className="mt-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
              >
                Create New Document
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
