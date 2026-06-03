'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Pin, FileText, Sparkles, ChevronRight, Bookmark, X } from 'lucide-react';
import type { Note, Document } from '@/types';
import NoteEditor from '@/components/notes/NoteEditor';
import DocumentEditor from '@/components/documents/DocumentEditor';

type ItemType = 'note' | 'document';

interface MemoryItem {
  id: string;
  title: string;
  preview: string;
  category: ItemType;
  timestamp: string;
  raw: Note | Document;
}

const CATEGORIES = ['All', 'Notes', 'Documents'] as const;
type Category = typeof CATEGORIES[number];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function toMemoryItem(item: Note | Document, type: ItemType): MemoryItem {
  return {
    id:        item.id,
    title:     item.title || 'Untitled',
    preview:   item.content.slice(0, 100) || 'Empty',
    category:  type,
    timestamp: timeAgo(item.updated_at),
    raw:       item,
  };
}

export default function MemoryPage() {
  const [notes, setNotes]           = useState<Note[]>([]);
  const [documents, setDocuments]   = useState<Document[]>([]);
  const [search, setSearch]         = useState('');
  const [category, setCategory]     = useState<Category>('All');
  const [activeItem, setActiveItem] = useState<MemoryItem | null>(null);

  const loadAll = useCallback(async () => {
    const [nr, dr] = await Promise.all([
      fetch(`/api/notes${search ? `?q=${encodeURIComponent(search)}` : ''}`),
      fetch(`/api/documents${search ? `?q=${encodeURIComponent(search)}` : ''}`),
    ]);
    if (nr.ok) setNotes(await nr.json() as Note[]);
    if (dr.ok) setDocuments(await dr.json() as Document[]);
  }, [search]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const allItems: MemoryItem[] = [
    ...notes.map(n => toMemoryItem(n, 'note')),
    ...documents.map(d => toMemoryItem(d, 'document')),
  ].sort((a, b) =>
    new Date((b.raw as Note).updated_at).getTime() - new Date((a.raw as Note).updated_at).getTime()
  );

  const filtered = allItems.filter(item => {
    if (category === 'Notes')     return item.category === 'note';
    if (category === 'Documents') return item.category === 'document';
    return true;
  });

  // First 2 items are "featured" (pinned visually)
  const featured = filtered.slice(0, 2);
  const recent   = filtered.slice(2);

  const createNote = async () => {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Untitled Note', content: '', tags: [], project_id: null }),
    });
    if (res.ok) {
      const note = await res.json() as Note;
      setNotes(prev => [note, ...prev]);
      setActiveItem(toMemoryItem(note, 'note'));
    }
  };

  const handleNoteSave = (updated: Note) => {
    setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
    setActiveItem(toMemoryItem(updated, 'note'));
  };

  const handleNoteDelete = async (id: string) => {
    await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    setNotes(prev => prev.filter(n => n.id !== id));
    if (activeItem?.id === id) setActiveItem(null);
  };

  const handleDocSave = (updated: Document) => {
    setDocuments(prev => prev.map(d => d.id === updated.id ? updated : d));
    setActiveItem(toMemoryItem(updated, 'document'));
  };

  const handleDocDelete = async (id: string) => {
    await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    setDocuments(prev => prev.filter(d => d.id !== id));
    if (activeItem?.id === id) setActiveItem(null);
  };

  const ItemList = () => (
    <>
      {/* Featured (pinned-style) */}
      {featured.length > 0 && (
        <div className="p-6 pb-2">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Pin className="w-3.5 h-3.5 text-gray-700" />
            <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Recent</span>
          </div>
          <div className="space-y-3">
            {featured.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveItem(item)}
                className={`w-full p-4 border rounded-xl hover:bg-white/[0.06] transition-all text-left group ${
                  activeItem?.id === item.id
                    ? 'bg-white/90 border-gray-300'
                    : 'bg-white/60 border-gray-100 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <h3 className="text-[15px] font-medium text-gray-900 pr-2 group-hover:text-gray-700 transition-colors line-clamp-1">{item.title}</h3>
                </div>
                <p className="text-[13px] text-gray-500 line-clamp-2 mb-3 leading-relaxed">{item.preview}</p>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-500 text-[11px] font-medium rounded-md uppercase tracking-wide">
                    <Bookmark className="w-3 h-3" />
                    {item.category === 'note' ? 'Note' : 'Document'}
                  </span>
                  <span className="text-[11px] text-gray-400">{item.timestamp}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Older items list */}
      {recent.length > 0 && (
        <div className="p-6 pt-4">
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Older</span>
          </div>
          <div className="bg-white/[0.02] border border-gray-100 rounded-2xl overflow-hidden divide-y divide-white/[0.05]">
            {recent.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveItem(item)}
                className={`w-full p-4 hover:bg-white/[0.04] transition-colors text-left flex items-center justify-between group ${
                  activeItem?.id === item.id ? 'bg-white/[0.04]' : ''
                }`}
              >
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[15px] font-medium text-gray-900 group-hover:text-gray-700 transition-colors line-clamp-1">{item.title}</h3>
                    <span className="text-[11px] text-gray-400 shrink-0">{item.timestamp}</span>
                  </div>
                  <p className="text-[13px] text-gray-500 line-clamp-1">{item.preview}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center px-6">
          <div className="w-16 h-16 bg-white/[0.02] rounded-full flex items-center justify-center mb-4 border border-gray-100">
            <FileText className="w-8 h-8 text-gray-700/50" />
          </div>
          <h3 className="text-[16px] font-medium text-gray-900 mb-2">Nothing here yet</h3>
          <p className="text-[13px] text-gray-400">Create a note to get started</p>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* ── DESKTOP ──────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex h-full bg-gradient-to-br from-gray-50 to-gray-100">
        {/* List panel */}
        <div className="w-96 border-r border-gray-200/60 bg-white/70 backdrop-blur-xl flex flex-col h-full relative z-10">
          {/* Header */}
          <div className="px-8 py-8 border-b border-gray-200/60 sticky top-0 bg-white/90 backdrop-blur-xl z-20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[24px] font-semibold text-gray-900 tracking-tight">Memory</h2>
              <button
                onClick={createNote}
                className="p-2 bg-gray-900 rounded-full text-white shadow-md hover:scale-105 transition-transform"
                title="New Note"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-5 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-gray-700 transition-colors" />
              <input
                type="text"
                placeholder="Search notes, docs…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-transparent focus:border-gray-400 focus:bg-gray-50 text-gray-900 placeholder-gray-400 rounded-[10px] focus:outline-none transition-all text-[15px]"
              />
            </div>

            {/* Category filters */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all active:scale-95 ${
                    category === cat
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <ItemList />
          </div>
        </div>

        {/* Detail / editor panel */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gray-900/5 rounded-full blur-[120px] pointer-events-none" />
          {activeItem ? (
            <div className="flex-1 h-full overflow-hidden">
              {activeItem.category === 'note' ? (
                <NoteEditor
                  note={activeItem.raw as Note}
                  onSave={handleNoteSave}
                  onDelete={handleNoteDelete}
                />
              ) : (
                <DocumentEditor
                  document={activeItem.raw as Document}
                  onSave={handleDocSave}
                  onDelete={handleDocDelete}
                />
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center z-10 px-12">
              <div className="text-[13px] text-gray-400 font-medium uppercase tracking-wider mb-4 flex items-center gap-2">
                <Bookmark className="w-4 h-4" />
                Select an item or create a new note
              </div>
              <button
                onClick={createNote}
                className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-[14px] font-medium transition-all shadow-md active:scale-95"
              >
                New Note
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE ───────────────────────────────────────────────────────── */}
      <div className="lg:hidden min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative pb-28">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-gray-900/10 rounded-full blur-[100px] pointer-events-none" />

        {activeItem ? (
          /* Mobile editor view */
          <div className="flex flex-col h-screen">
            <div className="flex items-center gap-3 px-5 pt-12 pb-4 bg-gradient-to-br from-gray-50 to-gray-100/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-20">
              <button
                onClick={() => setActiveItem(null)}
                className="p-2 rounded-xl bg-gray-100 text-gray-500 active:scale-90 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-[15px] font-medium text-gray-900 line-clamp-1">{activeItem.title}</span>
            </div>
            <div className="flex-1 overflow-hidden">
              {activeItem.category === 'note' ? (
                <NoteEditor
                  note={activeItem.raw as Note}
                  onSave={handleNoteSave}
                  onDelete={handleNoteDelete}
                />
              ) : (
                <DocumentEditor
                  document={activeItem.raw as Document}
                  onSave={handleDocSave}
                  onDelete={handleDocDelete}
                />
              )}
            </div>
          </div>
        ) : (
          /* Mobile list view */
          <>
            {/* Header */}
            <div className="px-5 pt-5 pb-3 sticky top-0 bg-gradient-to-br from-gray-50 to-gray-100/80 backdrop-blur-xl z-20 border-b border-gray-100">
              <h1 className="text-[20px] font-semibold text-gray-900 tracking-tight mb-3">Memory</h1>

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search notes, docs…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white/70 text-white placeholder-[#9ca3af] rounded-xl focus:outline-none focus:bg-gray-50 transition-colors"
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-none">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-[14px] font-medium whitespace-nowrap transition-transform active:scale-95 border ${
                      category === cat
                        ? 'bg-gray-900 text-white border-transparent shadow-sm'
                        : 'bg-white/70 text-gray-500 border-gray-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile content */}
            <div className="px-5 py-6 space-y-6 z-10 relative">
              {/* Featured cards — horizontal scroll */}
              {featured.length > 0 && (
                <div>
                  <h2 className="text-[20px] font-semibold text-gray-900 tracking-tight mb-3 px-1">Recent</h2>
                  <div className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-none snap-x snap-mandatory">
                    {featured.map(item => (
                      <div
                        key={item.id}
                        onClick={() => setActiveItem(item)}
                        className="snap-center shrink-0 w-[280px] p-5 bg-white/80 backdrop-blur-lg rounded-[24px] border border-gray-200/60 active:scale-[0.98] transition-all shadow-lg cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 text-[11px] font-medium rounded-lg uppercase tracking-wide">
                            {item.category === 'note' ? 'Note' : 'Document'}
                          </div>
                          <Pin className="w-4 h-4 text-gray-700" />
                        </div>
                        <h3 className="text-[17px] font-medium text-gray-900 mb-2 leading-tight line-clamp-1">{item.title}</h3>
                        <p className="text-[14px] text-gray-500 line-clamp-2 leading-relaxed mb-4 font-light">{item.preview}</p>
                        <span className="text-[12px] text-gray-400 font-medium">{item.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Older list */}
              {recent.length > 0 && (
                <div>
                  <h2 className="text-[20px] font-semibold text-gray-900 tracking-tight mb-3 px-1">Older</h2>
                  <div className="bg-white/70 rounded-[24px] overflow-hidden border border-gray-100 shadow-lg">
                    {recent.map((item, index) => (
                      <div key={item.id} className="relative">
                        <button
                          onClick={() => setActiveItem(item)}
                          className="w-full px-5 py-4 active:bg-gray-100 transition-colors flex items-center justify-between group"
                        >
                          <div className="flex-1 pr-4 text-left">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-[16px] font-medium text-gray-900 line-clamp-1">{item.title}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] text-gray-400">{item.timestamp}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-300/50" />
                              <span className="text-[13px] text-gray-500 line-clamp-1">{item.preview}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                        </button>
                        {index < recent.length - 1 && (
                          <div className="absolute bottom-0 left-5 right-0 h-[1px] bg-gray-100" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 bg-white/70 rounded-[24px] flex items-center justify-center mb-6 shadow-lg border border-gray-100">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-[20px] font-semibold text-gray-900 mb-2">No results</h3>
                  <p className="text-[15px] text-gray-500 font-light">Try searching for something else</p>
                </div>
              )}
            </div>

            {/* Floating new note button */}
            <button
              onClick={createNote}
              className="fixed right-5 w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg active:scale-90 transition-transform flex items-center justify-center z-30"
            style={{ bottom: 'calc(env(safe-area-inset-bottom) + 72px)' }}
            >
              <Sparkles className="w-6 h-6" />
            </button>
          </>
        )}
      </div>
    </>
  );
}
