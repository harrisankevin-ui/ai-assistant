'use client';

import TodayCard from '@/components/dashboard/TodayCard';
import TodaySchedule from '@/components/dashboard/TodaySchedule';
import TelegramStatusWidget from '@/components/dashboard/TelegramStatusWidget';
import ActiveTasksWidget from '@/components/dashboard/ActiveTasksWidget';
import TelegramMirrorWidget from '@/components/dashboard/TelegramMirrorWidget';
import RemindersWidget from '@/components/dashboard/RemindersWidget';
import MemoryWidget from '@/components/dashboard/MemoryWidget';

export default function DashboardPage() {
  return (
    <div className="h-full overflow-y-auto bg-[#f4f4f5]">
      <div className="p-4 lg:p-6 max-w-[1400px] mx-auto">
        {/* Desktop: 3-column grid */}
        <div className="hidden lg:grid lg:grid-cols-[300px_1fr_300px] gap-4">
          {/* Left column */}
          <div className="flex flex-col gap-4">
            <TodayCard />
            <TodaySchedule />
            <TelegramStatusWidget />
          </div>

          {/* Center column */}
          <div>
            <ActiveTasksWidget />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            <TelegramMirrorWidget />
            <RemindersWidget />
            <MemoryWidget />
          </div>
        </div>

        {/* Mobile: single column stack */}
        <div className="flex lg:hidden flex-col gap-4">
          <TodayCard />
          <TodaySchedule />
          <ActiveTasksWidget />
          <TelegramMirrorWidget />
          <RemindersWidget />
          <MemoryWidget />
          <TelegramStatusWidget />
        </div>
      </div>
    </div>
  );
}
