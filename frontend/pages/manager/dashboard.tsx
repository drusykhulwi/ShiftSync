// frontend/src/pages/manager/dashboard.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../src/components/common/Layout';
import { useAuth } from '../../src/hooks/useAuth';
import { StatsCard } from '../../src/components/dashboard/StatsCard';
import { OnDutyWidget } from '../../src/components/dashboard/OnDutyWidget';
import { UpcomingShifts } from '../../src/components/dashboard/UpcomingShifts';
import { staffService } from '../../src/services/api/staff.service';
import { shiftsService } from '../../src/services/api/shifts.service';
import { swapRequestsService } from '../../src/services/api/swap-requests.service';

export default function ManagerDashboard() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    staffAtLocation: 0,
    todaysShifts: 0,
    pendingApprovals: 0,
    openPositions: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // Manager's primary location
  const locationId = (user as any)?.locations?.[0];

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'MANAGER')) {
      router.push('/login');
      return;
    }
    if (isAuthenticated && locationId) fetchStats();
  }, [isAuthenticated, user, isLoading, router]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const now = new Date();
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      const [staffRes, shiftsRes, swapsRes] = await Promise.all([
        staffService.getStaffByLocation(locationId),
        shiftsService.getShifts({
          locationId,
          status: 'PUBLISHED',
          startDate: new Date(now.setHours(0, 0, 0, 0)).toISOString(),
          endDate: todayEnd.toISOString(),
          limit: 100,
        }),
        swapRequestsService.getSwapRequests({ status: 'ACCEPTED' }),
      ]);

      const staffList = (staffRes as any).data?.data || (staffRes as any).data || [];
      const todayShifts = (shiftsRes as any).data?.data || (shiftsRes as any).data || [];
      const openPositions = todayShifts.reduce((sum: number, s: any) => sum + (s.openSpots || 0), 0);

      setStats({
        staffAtLocation: staffList.length,
        todaysShifts: todayShifts.length,
        pendingApprovals: ((swapsRes as any).data?.data || (swapsRes as any).data || []).length,
        openPositions,
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Manager Dashboard</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <StatsCard
            title="Staff at Location"
            value={statsLoading ? '...' : stats.staffAtLocation}
          />
          <StatsCard
            title="Today's Shifts"
            value={statsLoading ? '...' : stats.todaysShifts}
          />
          <StatsCard
            title="Pending Approvals"
            value={statsLoading ? '...' : stats.pendingApprovals}
          />
          <StatsCard
            title="Open Positions"
            value={statsLoading ? '...' : stats.openPositions}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OnDutyWidget locationId={locationId} />
          <UpcomingShifts locationId={locationId} />
        </div>
      </div>
    </Layout>
  );
}