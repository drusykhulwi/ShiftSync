// frontend/src/pages/staff/schedule.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../src/components/common/Layout';
import { useAuth } from '../../src/hooks/useAuth';
import { useShifts } from '../../src/hooks/useShifts';
import { Calendar } from '../../src/components/schedule/Calendar/Calendar';

export default function StaffSchedulePage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const { shifts, isLoading, fetchShifts } = useShifts();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'STAFF')) {
      router.push('/login');
      return;
    }
    if (isAuthenticated) {
      const end = new Date(currentDate);
      end.setDate(end.getDate() + 30);
      // No status filter — show all assigned shifts regardless of status
      fetchShifts({
        startDate: currentDate.toISOString(),
        endDate: end.toISOString(),
      });
    }
  }, [isAuthenticated, authLoading, router]);

  // Only shifts this staff member is assigned to
  const myShifts = shifts.filter(shift =>
    shift.requirements?.some(req =>
      req.assignments?.some(
        (a: any) => a.userId === user?.id || a.user?.id === user?.id
      )
    )
  );

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 h-full">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">My Schedule</h1>
        <div className="h-[calc(100vh-200px)]">
          <Calendar
            events={myShifts.map(shift => {
              // Only show the requirements this staff member is assigned to
              const myRequirements = shift.requirements?.filter(r =>
                r.assignments?.some(
                  (a: any) => a.userId === user?.id || a.user?.id === user?.id
                )
              ) || [];

              return {
                id: shift.id,
                title: shift.title,
                start: new Date(shift.startTime),
                end: new Date(shift.endTime),
                locationId: shift.locationId,
                locationName: shift.location?.name || '',
                status: shift.status,
                requirements: myRequirements.map(r => ({
                  skillId: r.skill.id,
                  skillName: r.skill.name,
                  headcount: r.headcount,
                  assigned: r.assignments?.length || 0,
                })),
                assignedStaff: [],
              };
            })}
            view={view}
            onViewChange={setView}
            onDateChange={setCurrentDate}
            onEventClick={() => {}}
            onTimeSlotClick={() => {}}
          />
        </div>
      </div>
    </Layout>
  );
}