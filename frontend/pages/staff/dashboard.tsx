// frontend/src/pages/staff/dashboard.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../src/components/common/Layout';
import { useAuth } from '../../src/hooks/useAuth';
import { StatsCard } from '../../src/components/dashboard/StatsCard';
import { UpcomingShifts } from '../../src/components/dashboard/UpcomingShifts';
import { shiftsService } from '../../src/services/api/shifts.service';
import { swapRequestsService } from '../../src/services/api/swap-requests.service';
import { format, differenceInHours, startOfWeek, endOfWeek } from 'date-fns';

const isUserAssigned = (shift: any, userId: string) =>
  shift.requirements?.some((req: any) =>
    req.assignments?.some(
      (a: any) => a.userId === userId || a.user?.id === userId
    )
  );

export default function StaffDashboard() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    hoursThisWeek: 0,
    nextShiftTime: '—',
    nextShiftSubtitle: 'No upcoming shifts',
    pendingRequests: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'STAFF')) {
      router.push('/login');
      return;
    }
    if (isAuthenticated && user) fetchStats();
  }, [isAuthenticated, user, isLoading, router]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const now = new Date();
      const weekStart = startOfWeek(now);
      const weekEnd = endOfWeek(now);

      const [shiftsRes, swapsRes] = await Promise.all([
        // No status filter — staff should see all their assigned shifts
        shiftsService.getShifts({
          startDate: weekStart.toISOString(),
          endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          limit: 100,
        }),
        swapRequestsService.getSwapRequests({ status: 'PENDING' }),
      ]);

      const allShifts = (shiftsRes as any).data?.data || (shiftsRes as any).data || [];
      const myShifts = user?.id
        ? allShifts.filter((s: any) => isUserAssigned(s, user.id))
        : [];

      // Hours this week (only completed/published shifts)
      const weekShifts = myShifts.filter((s: any) => {
        const start = new Date(s.startTime);
        return start >= weekStart && start <= weekEnd;
      });
      const hoursThisWeek = weekShifts.reduce(
        (sum: number, s: any) =>
          sum + differenceInHours(new Date(s.endTime), new Date(s.startTime)),
        0
      );

      // Next upcoming shift
      const upcoming = myShifts
        .filter((s: any) => new Date(s.startTime) > now)
        .sort(
          (a: any, b: any) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );

      let nextShiftTime = '—';
      let nextShiftSubtitle = 'No upcoming shifts';
      if (upcoming.length > 0) {
        const next = upcoming[0];
        const startDate = new Date(next.startTime);
        const isToday = startDate.toDateString() === now.toDateString();
        nextShiftTime = format(startDate, 'h:mm a');
        nextShiftSubtitle = isToday ? 'Today' : format(startDate, 'EEE, MMM d');
      }

      const allSwaps = (swapsRes as any).data?.data || (swapsRes as any).data || [];
      const myPendingSwaps = allSwaps.filter(
        (s: any) => s.requesterId === user?.id || s.responderId === user?.id
      );

      setStats({
        hoursThisWeek,
        nextShiftTime,
        nextShiftSubtitle,
        pendingRequests: myPendingSwaps.length,
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">
          Welcome, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mb-6">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <StatsCard
            title="Hours This Week"
            value={statsLoading ? '...' : stats.hoursThisWeek}
            subtitle="of 40"
          />
          <StatsCard
            title="Next Shift"
            value={statsLoading ? '...' : stats.nextShiftTime}
            subtitle={stats.nextShiftSubtitle}
          />
          <StatsCard
            title="Pending Requests"
            value={statsLoading ? '...' : stats.pendingRequests}
            subtitle="Swap requests"
          />
        </div>

        <UpcomingShifts userId={user?.id} />
      </div>
    </Layout>
  );
}