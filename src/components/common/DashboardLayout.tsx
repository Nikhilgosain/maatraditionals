"use client"
import { useState, ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
  
    const toggleSidebar = () => setSidebarOpen(true);
    const closeSidebar = () => setSidebarOpen(false);
  
    return (
      <div className="min-h-screen bg-[#E6E9F2]">
        <Header toggleSidebar={toggleSidebar} />
        {/* Apply top padding equal to header height */}
        <div className="pt-16 flex">
          <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />
          {/* Wrap content in a scrollable container */}
          <div className="flex-1 overflow-auto max-h-[calc(100vh-4rem)] p-6">
            {children}
          </div>
        </div>
  
      </div>
    );
  }
  