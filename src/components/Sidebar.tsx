'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageSquare, CheckSquare, Calendar, BookOpen } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/',       icon: Home,          label: 'Today'  },
  { href: '/chat',   icon: MessageSquare, label: 'Chat'   },
  { href: '/tasks',  icon: CheckSquare,   label: 'Tasks'  },
  { href: '/weekly', icon: Calendar,      label: 'Weekly' },
  { href: '/memory', icon: BookOpen,      label: 'Memory' },
] as const;

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col w-[220px] bg-white border-r border-gray-200 relative z-50 shrink-0 h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-gray-100">
        <h1 className="text-[18px] font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-[10px] bg-gray-900 flex items-center justify-center">
            <span className="text-white text-[13px] font-black">M</span>
          </span>
          Max AI
        </h1>
        <p className="text-[11px] text-gray-400 mt-1.5 font-medium tracking-wide uppercase">Personal Assistant</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          // "/" is active only on exact match; others use startsWith
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                isActive
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`}
                strokeWidth={isActive ? 2.5 : 1.75}
              />
              <span className="text-[13px] tracking-wide">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-100">
        <div className="text-[11px] text-gray-400">
          <div>Status: Online</div>
          <div className="mt-0.5">Max v1</div>
        </div>
      </div>
    </aside>
  );
}
