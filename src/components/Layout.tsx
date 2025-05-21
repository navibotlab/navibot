'use client';

import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  return (
    <div className="flex h-screen bg-[#0F1115] overflow-hidden">
      <div className="flex-shrink-0">
        <Sidebar onToggle={(expanded) => setSidebarExpanded(expanded)} />
      </div>
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {children}
        </main>
      </div>
    </div>
  );
} 