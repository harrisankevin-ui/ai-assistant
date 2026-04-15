import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'AI Assistant',
  description: 'Personal AI Assistant powered by Claude',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AI Assistant',
  },
};

export const viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark bg-[#0a0a0f]">
      <head>
        <meta name="theme-color" content="#0a0a0f" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js?v=2');` }} />
      </head>
      <body className="bg-[#0a0a0f] text-gray-100 h-[100dvh] flex overflow-hidden">
        <Suspense fallback={<div className="hidden lg:flex w-[260px] bg-[#18181b] border-r border-white/[0.08] shrink-0" />}>
          <Sidebar />
        </Suspense>
        <main className="flex-1 overflow-hidden pb-[calc(4rem_+_env(safe-area-inset-bottom))] lg:pb-0 pt-[env(safe-area-inset-top)] lg:pt-0">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
