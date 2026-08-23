'use client';

import QuickCapture from '@/components/dashboard/QuickCapture';

export default function DashboardPage() {
  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="w-full max-w-xl">
        <QuickCapture />
      </div>
    </div>
  );
}
