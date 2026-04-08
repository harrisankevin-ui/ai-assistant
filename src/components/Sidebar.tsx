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

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col w-[260px] bg-[#18181b]/50 backdrop-blur-3xl border-r border-white/[0.08] relative z-50 shrink-0 h-full">
      {/* Logo */}
      <div className="px-6 py-7 border-b border-white/[0.08] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#4f46e5]/10 rounded-full blur-[40px] pointer-events-none" />
        <h1 className="text-[22px] font-bold text-white tracking-tight flex items-center gap-2">
          <span className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-[#4f46e5] to-[#818cf8] flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.3)]">
            <span className="text-white text-[15px] font-black">M</span>
          </span>
          Max AI
        </h1>
        <p className="text-[12px] text-[#9ca3af] mt-2 font-medium tracking-wide uppercase">Personal Assistant</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-[12px] transition-all relative overflow-hidden group ${
                isActive
                  ? 'bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                  : 'text-[#9ca3af] hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#4f46e5] rounded-r-full shadow-[0_0_10px_rgba(79,70,229,0.8)]" />
              )}
              <Icon
                className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#4f46e5]' : 'group-hover:text-white transition-colors'}`}
                strokeWidth={isActive ? 2.5 : 1.75}
              />
              <span className="text-[14px] font-medium tracking-wide">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[#27272a]">
        <div className="text-[12px] text-[#6b7280]">
          <div>Status: Online</div>
          <div className="mt-1">Max v1</div>
        </div>
      </div>
    </aside>
  );
}
