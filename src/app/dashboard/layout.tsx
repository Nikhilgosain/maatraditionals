'use client';

import { useState, ReactNode } from 'react';
import Header from '@/components/common/Header';
import Sidebar from '@/components/common/Sidebar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#E6E9F2]">
      <Header toggleSidebar={() => setSidebarOpen(true)} />

      <div className="pt-16 flex">
        <Sidebar isOpen={isSidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-auto max-h-[calc(100vh-4rem)] p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
