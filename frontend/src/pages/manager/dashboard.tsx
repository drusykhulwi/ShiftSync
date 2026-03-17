import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../components/common/Layout';
import { useAuth } from '../../hooks/useAuth';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { OnDutyWidget } from '../../components/dashboard/OnDutyWidget';
import { UpcomingShifts } from '../../components/dashboard/UpcomingShifts';

export default function ManagerDashboard() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'MANAGER')) {
      router.push('/login');
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Manager Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard title="Staff at Location" value="15" change="0" />
          <StatsCard title="Today's Shifts" value="8" change="+2" />
          <StatsCard title="Pending Approvals" value="4" change="-1" />
          <StatsCard title="Open Positions" value="3" change="+1" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OnDutyWidget />
          <UpcomingShifts />
        </div>
      </div>
    </Layout>
  );
}