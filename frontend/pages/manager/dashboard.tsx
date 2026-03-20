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
import { locationsService } from '../../src/services/api/locations.service';

export default function ManagerDashboard() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const [locationId, setLocationId] = useState<string | undefined>(undefined);
  const [stats, setStats] = useState({
    staffAtLocation: 0,
    todaysShifts: 0,
    pendingApprovals: 0,
    openPositions: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'MANAGER')) {
      router.push('/login');
      return;
    }
    if (isAuthenticated) {
      resolveLocationAndFetch();
    }
  }, [isAuthenticated, user, isLoading, router]);

  const resolveLocationAndFetch = async () => {
    // Try to get locationId from JWT first
    let locId = (user as any)?.locations?.[0];

    // If not in JWT, fetch from my-locations endpoint
    if (!locId) {
      try {
        const res = await locationsService.getMyLocations();
        const myLocations = (res as any).data?.data || (res as any).data || [];
        locId = myLocations[0]?.id;
      } catch (error) {
        console.error('Failed to fetch manager locations:', error);
      }
    }

    setLocationId(locId);
    fetchStats(locId);
  };

  const fetchStats = async (locId?: string) => {
    setStatsLoading(true);
    try {
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      const [staffRes, shiftsRes, swapsRes] = await Promise.all([
        // If no locationId, fall back to all staff (manager sees their location's staff)
        locId
          ? staffService.getStaffByLocation(locId)
          : staffService.getStaff({ limit: 100 }),
        shiftsService.getShifts({
          ...(locId ? { locationId: locId } : {}),
          startDate: todayStart.toISOString(),
          endDate: todayEnd.toISOString(),
          limit: 100,
        }),
        swapRequestsService.getSwapRequests({ status: 'ACCEPTED' }),
      ]);

      const staffList = (staffRes as any).data?.data || (staffRes as any).data || [];
      const todayShifts = (shiftsRes as any).data?.data || (shiftsRes as any).data || [];
      const openPositions = todayShifts.reduce(
        (sum: number, s: any) => sum + (s.openSpots || 0), 0
      );
      const allSwaps = (swapsRes as any).data?.data || (swapsRes as any).data || [];

      setStats({
        staffAtLocation: staffList.length,
        todaysShifts: todayShifts.length,
        pendingApprovals: allSwaps.length,
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
          <StatsCard title="Staff at Location" value={statsLoading ? '...' : stats.staffAtLocation} />
          <StatsCard title="Today's Shifts" value={statsLoading ? '...' : stats.todaysShifts} />
          <StatsCard title="Pending Approvals" value={statsLoading ? '...' : stats.pendingApprovals} />
          <StatsCard title="Open Positions" value={statsLoading ? '...' : stats.openPositions} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OnDutyWidget locationId={locationId} />
          <UpcomingShifts locationId={locationId} />
        </div>
      </div>
    </Layout>
  );
}