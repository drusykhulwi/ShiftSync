// frontend/src/pages/analytics/index.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../src/components/common/Layout';
import { Tabs } from '../../src/components/common/Tabs';
import { OvertimeDashboard } from '../../src/components/analytics/OvertimeDashboard/OvertimeDashboard';
import { FairnessDashboard } from '../../src/components/analytics/FairnessDashboard/FairnessDashboard';
import { RiskDashboard } from '../../src/components/analytics/RiskDashboard/RiskDashboard';
import { useAuth } from '../../src/hooks/useAuth';

export default function AnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overtime');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Only admins and managers can access analytics
    if (!authLoading && user && user.role === 'STAFF') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, authLoading, user, router]);

  const tabs = [
    {
      id: 'overtime',
      label: 'Overtime Report',
      content: <OvertimeDashboard />,
    },
    {
      id: 'fairness',
      label: 'Fairness Report',
      content: <FairnessDashboard />,
    },
    {
      id: 'risks',
      label: 'Risk Assessment',
      content: <RiskDashboard />,
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
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Analytics Dashboard</h1>
        <Tabs tabs={tabs} defaultTab="overtime" onChange={setActiveTab} />
      </div>
    </Layout>
  );
}