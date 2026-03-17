// frontend/src/pages/admin/audit-logs.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../components/common/Layout';
import { Tabs } from '../../components/common/Tabs';
import { AuditLogViewer } from '../../components/audit/AuditLogViewer/AuditLogViewer';
import { AuditStats } from '../../components/audit/AuditStats/AuditStats';
import { UserActivity } from '../../components/audit/UserActivity/UserActivity';
import { AuditExport } from '../../components/audit/AuditExport/AuditExport';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';

export default function AuditLogsPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('logs');
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Only admins can access audit logs
    if (!authLoading && user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, authLoading, user, router]);

  const tabs = [
    {
      id: 'logs',
      label: 'Audit Logs',
      content: <AuditLogViewer />,
    },
    {
      id: 'stats',
      label: 'Statistics',
      content: <AuditStats />,
    },
    {
      id: 'user-activity',
      label: 'User Activity',
      content: <UserActivity />,
    },
  ];

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Audit Logs</h1>
          <Button onClick={() => setIsExportOpen(true)}>
            Export Logs
          </Button>
        </div>

        <Tabs tabs={tabs} defaultTab="logs" onChange={setActiveTab} />

        <AuditExport
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
        />
      </div>
    </Layout>
  );
}