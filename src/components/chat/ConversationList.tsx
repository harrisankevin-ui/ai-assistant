'use client';

import { useState } from 'react';
import { MessageSquare, Trash2, ChevronLeft } from 'lucide-react';
import type { Conversation } from '@/types';

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle button — sits below safe area / status bar */}
      <button
        className="lg:hidden fixed left-4 z-40 p-2 bg-[#18181b]/90 backdrop-blur-sm border border-white/[0.08] rounded-xl text-[#9ca3af] active:scale-90 transition-all"
        style={{ top: 'calc(env(safe-area-inset-top) + 12px)' }}
        onClick={() => setOpen(true)}
        aria-label="Open conversations"
      >
        <MessageSquare size={17} />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer panel */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-40
        w-64 bg-[#111113] border-r border-white/[0.08] flex flex-col h-full shrink-0
        transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* Drawer header */}
        <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[#9ca3af] uppercase tracking-wider">Conversations</span>
          <button
            className="lg:hidden p-1.5 text-[#6b7280] hover:text-white transition-colors rounded-lg hover:bg-white/[0.05]"
            onClick={() => setOpen(false)}
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {conversations.length === 0 && (
            <p className="text-[12px] text-[#6b7280] px-3 py-4">No conversations yet</p>
          )}
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                activeId === conv.id
                  ? 'bg-white/[0.08] text-white'
                  : 'text-[#9ca3af] hover:text-white hover:bg-white/[0.04]'
              }`}
              onClick={() => { onSelect(conv.id); setOpen(false); }}
            >
              <MessageSquare size={14} className="shrink-0 opacity-60" />
              <span className="text-[13px] truncate flex-1">{conv.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-all shrink-0"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
