// frontend/src/components/common/Layout.tsx
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '../notifications/NotificationToast/ToastContainer';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // default closed on mobile

  return (
    <ToastContainer>
      <div className="min-h-screen bg-gray-50">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        {/* 
          On mobile: no left margin (sidebar overlays)
          On desktop: push content by sidebar width
        */}
        <div className={`transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <main className="p-4">{children}</main>
        </div>
      </div>
    </ToastContainer>
  );
};