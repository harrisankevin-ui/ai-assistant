import { Suspense } from 'react';
import WeeklyBrief from '@/components/weekly/WeeklyBrief';

export default function WeeklyPage() {
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="px-6 py-4 border-b border-gray-200/60 bg-white/60 backdrop-blur-xl shrink-0">
        <h1 className="text-lg font-semibold text-gray-900">Weekly Brief</h1>
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
