'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, CheckSquare, Calendar, BookOpen } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/chat',   icon: MessageSquare, label: 'Chat'   },
  { href: '/tasks',  icon: CheckSquare,   label: 'Tasks'  },
  { href: '/weekly', icon: Calendar,      label: 'Weekly' },
  { href: '/memory', icon: BookOpen,      label: 'Memory' },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0f]/80 backdrop-blur-2xl border-t border-white/[0.08] pb-[env(safe-area-inset-bottom)] z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center gap-1 w-16 py-2 rounded-xl transition-all active:scale-90 ${
                isActive ? 'text-[#4f46e5]' : 'text-[#9ca3af]'
              }`}
            >
              {isActive && (
                <div className="absolute top-1 w-1 h-1 bg-[#4f46e5] rounded-full blur-[1px] shadow-[0_0_4px_#4f46e5]" />
              )}
              <Icon
                className={`w-6 h-6 ${isActive ? 'drop-shadow-[0_0_8px_rgba(79,70,229,0.5)]' : ''}`}
                strokeWidth={isActive ? 2.5 : 1.75}
              />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
