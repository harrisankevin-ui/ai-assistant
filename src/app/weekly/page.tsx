import { Suspense } from 'react';
import WeeklyBrief from '@/components/weekly/WeeklyBrief';

export default function WeeklyPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-800 shrink-0">
        <h1 className="text-lg font-semibold text-white">Weekly Brief</h1>
        <p className="text-xs text-gray-500 mt-0.5">Your week at a glance</p>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <Suspense fallback={
          <div className="h-full flex items-center justify-center">
            <div className="text-gray-500 text-sm">Loading...</div>
          </div>
        }>
          <WeeklyBrief />
        </Suspense>
      </div>
    </div>
  );
}
