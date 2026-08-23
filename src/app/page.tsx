'use client';

import TodayCard from '@/components/dashboard/TodayCard';
import TodaySchedule from '@/components/dashboard/TodaySchedule';
import TelegramStatusWidget from '@/components/dashboard/TelegramStatusWidget';
import ActiveTasksWidget from '@/components/dashboard/ActiveTasksWidget';
import TelegramMirrorWidget from '@/components/dashboard/TelegramMirrorWidget';
import RemindersWidget from '@/components/dashboard/RemindersWidget';
import MemoryWidget from '@/components/dashboard/MemoryWidget';
import QuickCapture from '@/components/dashboard/QuickCapture';

export default function DashboardPage() {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-3 pb-0">
        <QuickCapture />
      </div>

      {/* Desktop: 3-column grid — fills remaining viewport, no page scroll */}
      <div className="hidden lg:grid lg:grid-cols-[280px_1fr_280px] flex-1 gap-3 p-3 overflow-hidden">
        {/* Left column — scrolls internally */}
        <div className="h-full overflow-y-auto flex flex-col gap-3 pb-3">
          <TodayCard />
          <TodaySchedule />
          <TelegramStatusWidget />
        </div>

        {/* Center column */}
        <div className="h-full overflow-y-auto pb-3">
          <ActiveTasksWidget />
        </div>

        {/* Right column — scrolls internally */}
        <div className="h-full overflow-y-auto flex flex-col gap-3 pb-3">
          <TelegramMirrorWidget />
          <RemindersWidget />
          <MemoryWidget />
        </div>
      </div>

      {/* Mobile: single column stack */}
      <div className="flex lg:hidden flex-col gap-3 p-3 flex-1 overflow-y-auto">
        <TodayCard />
        <TodaySchedule />
        <ActiveTasksWidget />
        <TelegramMirrorWidget />
        <RemindersWidget />
        <MemoryWidget />
        <TelegramStatusWidget />
      </div>
    </div>
  );
}
