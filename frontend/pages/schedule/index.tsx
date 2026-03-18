// frontend/src/pages/schedule/index.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../src/components/common/Layout';
import { Calendar } from '../../src/components/schedule/Calendar/Calendar';
import { ShiftForm } from '../../src/components/schedule/ShiftForm/ShiftForm';
import { AssignmentDialog } from '../../src/components/schedule/AssignmentDialog/AssignmentDialog';
import { Button } from '../../src/components/common/Button';
import { useAuth } from '../../src/hooks/useAuth';
import { useShifts } from '../../src/hooks/useShifts';
import { shiftsService } from '../../src/services/api/shifts.service';
import { skillsService } from '../../src/services/api/skills.service';
import { locationsService } from '../../src/services/api/locations.service';
import { CalendarEvent } from '../../src/types/schedule.types';
import { Shift } from '../../src/types/shift.types';

export default function SchedulePage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [skills, setSkills] = useState<{ id: string; name: string; category: string }[]>([]);
  const [staff, setStaff] = useState([]);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isShiftFormOpen, setIsShiftFormOpen] = useState(false);
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const { shifts, isLoading, fetchShifts, createShift } = useShifts();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [locationsRes, skillsRes] = await Promise.all([
          locationsService.getLocations(),
          skillsService.getSkills(),
        ]);
        // Unwrap double-wrapped responses
        setLocations(locationsRes.data?.data || locationsRes.data || []);
        setSkills(skillsRes.data?.data || skillsRes.data || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      const end = new Date(currentDate);
      end.setDate(end.getDate() + 30);
      fetchShifts({
        startDate: currentDate.toISOString(),
        endDate: end.toISOString(),
      });
    }
  }, [isAuthenticated]);

  const handleEventClick = async (event: CalendarEvent) => {
    try {
      const response = await shiftsService.getShiftById(event.id);
      // getShiftById returns response.data which is { success, data: shift }
      setSelectedShift((response as any).data?.data || (response as any).data);
      setIsAssignmentOpen(true);
    } catch (error) {
      console.error('Failed to fetch shift details:', error);
    }
  };

  const handleTimeSlotClick = async (date: Date) => {
    if (user?.role === 'MANAGER' || user?.role === 'ADMIN') {
      setCurrentDate(date);
      setIsShiftFormOpen(true);
    }
  };

  const handleCreateShift = async (data: any) => {
    await createShift(data);
  };

  const handleAssignStaff = async (shiftId: string, userId: string, requirementId: string) => {
    try {
      await shiftsService.assignStaff(shiftId, { userId, requirementId });
      const end = new Date(currentDate);
      end.setDate(end.getDate() + 30);
      fetchShifts({
        startDate: currentDate.toISOString(),
        endDate: end.toISOString(),
      });
      setIsAssignmentOpen(false);
    } catch (error) {
      console.error('Failed to assign staff:', error);
    }
  };

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
      <div className="p-4 sm:p-6 h-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Schedule</h1>
          {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
            <Button onClick={() => setIsShiftFormOpen(true)} className="w-full sm:w-auto">
              + Create Shift
            </Button>
          )}
        </div>

        <div className="h-[calc(100vh-200px)]">
          <Calendar
            events={shifts.map(shift => ({
              id: shift.id,
              title: shift.title,
              start: new Date(shift.startTime),
              end: new Date(shift.endTime),
              locationId: shift.locationId,
              locationName: shift.location?.name || '',
              status: shift.status,
              requirements: shift.requirements?.map(r => ({
                skillId: r.skill.id,
                skillName: r.skill.name,
                headcount: r.headcount,
                assigned: r.assignments?.length || 0,
              })) || [],
              assignedStaff: shift.requirements?.flatMap(r =>
                r.assignments?.map(a => {
                  if (!a.user) return null;
                  return {
                    id: a.user.id,
                    name: `${a.user.firstName || ''} ${a.user.lastName || ''}`.trim(),
                    role: 'STAFF',
                  };
                }).filter((item): item is { id: string; name: string; role: string } => item !== null) || []
              ) || [],
            }))}
            view={view}
            onViewChange={setView}
            onDateChange={setCurrentDate}
            onEventClick={handleEventClick}
            onTimeSlotClick={handleTimeSlotClick}
          />
        </div>

        <ShiftForm
          isOpen={isShiftFormOpen}
          onClose={() => setIsShiftFormOpen(false)}
          onSubmit={handleCreateShift}
          locations={locations}
          skills={skills}
        />

        {selectedShift && (
          <AssignmentDialog
            isOpen={isAssignmentOpen}
            onClose={() => setIsAssignmentOpen(false)}
            shift={selectedShift}
            staff={staff}
            onAssign={handleAssignStaff}
          />
        )}
      </div>
  );
}