'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, FileText, BookOpen, Kanban, CalendarDays } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/chat',      icon: MessageSquare, label: 'Chat'   },
  { href: '/notes',     icon: FileText,      label: 'Notes'  },
  { href: '/documents', icon: BookOpen,      label: 'Docs'   },
  { href: '/tasks',     icon: Kanban,        label: 'Tasks'  },
  { href: '/weekly',    icon: CalendarDays,  label: 'Weekly' },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-gray-900 border-t border-gray-800 flex items-stretch pb-[env(safe-area-inset-bottom)]">
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors ${
              active ? 'text-indigo-400' : 'text-gray-500'
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.75} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
