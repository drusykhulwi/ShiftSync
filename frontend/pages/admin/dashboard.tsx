// frontend/src/pages/admin/dashboard.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../src/components/common/Layout';
import { useAuth } from '../../src/hooks/useAuth';
import { StatsCard } from '../../src/components/dashboard/StatsCard';
import { OnDutyWidget } from '../../src/components/dashboard/OnDutyWidget';
import { UpcomingShifts } from '../../src/components/dashboard/UpcomingShifts';
import { usersService } from '../../src/services/api/users.service';
import { shiftsService } from '../../src/services/api/shifts.service';
import { swapRequestsService } from '../../src/services/api/swap-requests.service';

export default function AdminDashboard() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalStaff: 0,
    openShifts: 0,
    pendingSwaps: 0,
    overtimeAlerts: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.push('/login');
      return;
    }
    if (isAuthenticated) fetchStats();
  }, [isAuthenticated, user, isLoading, router]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const now = new Date();
      const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const [usersRes, shiftsRes, swapsRes] = await Promise.all([
        usersService.getUsers({ limit: 1 }),
        shiftsService.getShifts({ status: 'PUBLISHED', startDate: now.toISOString(), endDate: weekEnd.toISOString(), limit: 100 }),
        swapRequestsService.getSwapRequests({ status: 'PENDING' }),
      ]);

      const allShifts = (shiftsRes as any).data?.data || (shiftsRes as any).data || [];
      const openShifts = allShifts.filter((s: any) => (s.openSpots || 0) > 0).length;

      setStats({
        totalStaff: (usersRes as any).data?.meta?.total || 0,
        openShifts,
        pendingSwaps: ((swapsRes as any).data?.data || (swapsRes as any).data || []).length,
        overtimeAlerts: 0, // requires analytics endpoint
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <StatsCard
            title="Total Staff"
            value={statsLoading ? '...' : stats.totalStaff}
          />
          <StatsCard
            title="Open Shifts"
            value={statsLoading ? '...' : stats.openShifts}
          />
          <StatsCard
            title="Pending Swaps"
            value={statsLoading ? '...' : stats.pendingSwaps}
          />
          <StatsCard
            title="Overtime Alerts"
            value={statsLoading ? '...' : stats.overtimeAlerts}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OnDutyWidget />
          <UpcomingShifts />
        </div>
      </div>
    </Layout>
  );
}