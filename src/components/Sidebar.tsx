'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquare, FileText, BookOpen, Kanban, CalendarDays,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItemClass = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
    }`;

  return (
    <aside className="hidden md:flex w-56 bg-gray-900 border-r border-gray-800 flex-col h-full shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-gray-800">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <span className="text-sm font-bold text-white">M</span>
        </div>
        <span className="font-semibold text-white">Max</span>
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

        {/* Tasks */}
        <Link href="/tasks" className={navItemClass(pathname.startsWith('/tasks'))}>
          <Kanban size={18} />
          Tasks
        </Link>

        {/* Weekly Brief */}
        <Link href="/weekly" className={navItemClass(pathname.startsWith('/weekly'))}>
          <CalendarDays size={18} />
          <span>Weekly Brief</span>
        </Link>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-800">
        <p className="text-xs text-gray-500">Max v1</p>
      </div>
    </aside>
  );
}
