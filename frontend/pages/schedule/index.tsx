// frontend/src/pages/schedule/index.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../src/components/common/Layout';
import { Calendar } from '../../src/components/schedule/Calendar/Calendar';
import { ShiftForm } from '../../src/components/schedule/ShiftForm/ShiftForm';
import { AssignmentDialog } from '../../src/components/schedule/AssignmentDialog/AssignmentDialog';
import { Modal } from '../../src/components/common/Modal';
import { Button } from '../../src/components/common/Button';
import { Badge } from '../../src/components/common/Badge';
import { useAuth } from '../../src/hooks/useAuth';
import { useShifts } from '../../src/hooks/useShifts';
import { shiftsService } from '../../src/services/api/shifts.service';
import { skillsService } from '../../src/services/api/skills.service';
import { locationsService } from '../../src/services/api/locations.service';
import { CalendarEvent } from '../../src/types/schedule.types';
import { Shift } from '../../src/types/shift.types';
import { useToast } from '../../src/components/notifications/NotificationToast/ToastContainer';
import { format } from 'date-fns';

export default function SchedulePage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [skills, setSkills] = useState<{ id: string; name: string; category: string }[]>([]);
  const [staff, setStaff] = useState([]);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isShiftFormOpen, setIsShiftFormOpen] = useState(false);
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);
  const [isShiftDetailOpen, setIsShiftDetailOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const { shifts, isLoading, fetchShifts, createShift } = useShifts();
  const { showToast } = useToast();

  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';

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
        setLocations((locationsRes as any).data?.data || (locationsRes as any).data || []);
        setSkills((skillsRes as any).data?.data || (skillsRes as any).data || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    if (isAuthenticated) fetchData();
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

  const refreshShifts = () => {
    const end = new Date(currentDate);
    end.setDate(end.getDate() + 30);
    fetchShifts({
      startDate: currentDate.toISOString(),
      endDate: end.toISOString(),
    });
  };

  const handleEventClick = async (event: CalendarEvent) => {
    try {
      const response = await shiftsService.getShiftById(event.id);
      const shift = (response as any).data?.data || (response as any).data;
      setSelectedShift(shift);
      setIsShiftDetailOpen(true);
    } catch (error) {
      console.error('Failed to fetch shift details:', error);
    }
  };

  const handleTimeSlotClick = async (date: Date) => {
    if (isManager) {
      setCurrentDate(date);
      setIsShiftFormOpen(true);
    }
  };

  const handleCreateShift = async (data: any) => {
    await createShift(data);
    showToast('Shift created successfully', 'success');
  };

  const handlePublishShift = async () => {
    if (!selectedShift) return;
    setIsPublishing(true);
    try {
      await shiftsService.publishShifts([selectedShift.id]);
      showToast('Shift published successfully', 'success');
      setIsShiftDetailOpen(false);
      setSelectedShift(null);
      refreshShifts();
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || 'Failed to publish shift';
      showToast(msg, 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleAssignStaff = async (
    shiftId: string,
    userId: string,
    requirementId: string,
    overrideReason?: string
  ) => {
    await shiftsService.assignStaff(shiftId, { userId, requirementId, overrideReason });
    refreshShifts();
    setIsAssignmentOpen(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      DRAFT: 'default',
      PUBLISHED: 'success',
      COMPLETED: 'info',
      CANCELLED: 'error',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
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
    <Layout>
      <div className="p-4 sm:p-6 h-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Schedule</h1>
          {isManager && (
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

        {/* Create Shift Form */}
        <ShiftForm
          isOpen={isShiftFormOpen}
          onClose={() => setIsShiftFormOpen(false)}
          onSubmit={handleCreateShift}
          locations={locations}
          skills={skills}
        />

        {/* Shift Detail Modal */}
        {selectedShift && (
          <Modal
            isOpen={isShiftDetailOpen}
            onClose={() => { setIsShiftDetailOpen(false); setSelectedShift(null); }}
            title="Shift Details"
            size="md"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-lg">{selectedShift.title}</h3>
                {getStatusBadge(selectedShift.status)}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                <p className="text-gray-600">
                  📅 {format(new Date(selectedShift.startTime), 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-gray-600">
                  ⏰ {format(new Date(selectedShift.startTime), 'h:mm a')} — {format(new Date(selectedShift.endTime), 'h:mm a')}
                </p>
                <p className="text-gray-600">
                  📍 {selectedShift.location?.name || '—'}
                </p>
              </div>

              {/* Requirements summary */}
              {selectedShift.requirements && selectedShift.requirements.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Staffing Requirements</p>
                  <div className="space-y-2">
                    {selectedShift.requirements.map(req => (
                      <div key={req.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <span>{req.skill.name}</span>
                        <span className={`font-medium ${(req.assignments?.length || 0) >= req.headcount ? 'text-green-600' : 'text-orange-500'}`}>
                          {req.assignments?.length || 0}/{req.headcount} filled
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => { setIsShiftDetailOpen(false); setSelectedShift(null); }}
                  className="w-full sm:w-auto"
                >
                  Close
                </Button>

                {isManager && selectedShift.status === 'DRAFT' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsShiftDetailOpen(false);
                        setIsAssignmentOpen(true);
                      }}
                      className="w-full sm:w-auto"
                    >
                      Assign Staff
                    </Button>
                    <Button
                      onClick={handlePublishShift}
                      isLoading={isPublishing}
                      className="w-full sm:w-auto"
                    >
                      Publish Shift
                    </Button>
                  </>
                )}

                {isManager && selectedShift.status === 'PUBLISHED' && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsShiftDetailOpen(false);
                      setIsAssignmentOpen(true);
                    }}
                    className="w-full sm:w-auto"
                  >
                    Assign Staff
                  </Button>
                )}
              </div>
            </div>
          </Modal>
        )}

        {/* Assignment Dialog */}
        {selectedShift && (
          <AssignmentDialog
            isOpen={isAssignmentOpen}
            onClose={() => setIsAssignmentOpen(false)}
            shift={selectedShift}
            staff={staff}
            onAssign={handleAssignStaff}
            onToast={showToast}
          />
        )}
      </div>
    </Layout>
  );
}