import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../src/components/common/Layout';
import { useAuth } from '../../src/hooks/useAuth';
import { useShifts } from '../../src/hooks/useShifts';
import { StatsCard } from '../../src/components/dashboard/StatsCard';
import { UpcomingShifts } from '../../src/components/dashboard/UpcomingShifts';
import { format } from 'date-fns';

export default function StaffDashboard() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'STAFF')) {
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mb-6">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard title="Hours This Week" value="32" subtitle="of 40" />
          <StatsCard title="Next Shift" value="5:00 PM" subtitle="Today" />
          <StatsCard title="Pending Requests" value="1" subtitle="Swap requests" />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <UpcomingShifts />
        </div>
      </div>
    </Layout>
  );
}