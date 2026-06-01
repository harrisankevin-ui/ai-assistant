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

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)] z-50">
      <div className="flex items-center justify-around px-1 py-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center gap-0.5 w-14 py-1.5 rounded-xl transition-all active:scale-90 ${
                isActive ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {isActive && (
                <div className="absolute top-0.5 w-1 h-1 bg-gray-900 rounded-full" />
              )}
              <Icon
                className="w-[20px] h-[20px]"
                strokeWidth={isActive ? 2.5 : 1.75}
              />
              <span className="text-[9px] font-medium tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
