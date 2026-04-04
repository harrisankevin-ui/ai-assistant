import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import Sidebar from '@/components/Sidebar';

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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#0a0a0f" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="bg-gray-950 text-gray-100 h-screen flex overflow-hidden">
        <Suspense fallback={<div className="w-56 bg-gray-900 border-r border-gray-800 shrink-0" />}>
          <Sidebar />
        </Suspense>
        <main className="flex-1 overflow-hidden">{children}</main>
      </body>
    </html>
  );
}
