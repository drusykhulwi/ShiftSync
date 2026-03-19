// frontend/src/components/schedule/AssignmentDialog/AssignmentDialog.tsx
import React, { useState, useEffect } from 'react';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { Select } from '../../common/Select';
import { Input } from '../../common/Input';
import { Shift, ShiftRequirement } from '../../../types/shift.types';
import { usersService } from '../../../services/api/users.service';
import { shiftsService } from '../../../services/api/shifts.service';

interface AssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift;
  staff: any[];
  onAssign: (shiftId: string, userId: string, requirementId: string, overrideReason?: string) => Promise<void>;
  onToast?: (message: string, type: 'success' | 'error' | 'warning') => void;
}

export const AssignmentDialog: React.FC<AssignmentDialogProps> = ({
  isOpen,
  onClose,
  shift,
  onAssign,
  onToast,
}) => {
  const [selectedRequirement, setSelectedRequirement] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingStaff, setIsFetchingStaff] = useState(false);
  const [availableStaff, setAvailableStaff] = useState<any[]>([]);
  const [hardViolations, setHardViolations] = useState<{ type: string; message: string }[]>([]);
  const [warnings, setWarnings] = useState<{ type: string; message: string }[]>([]);
  const [assignmentError, setAssignmentError] = useState<string>('');
  const [showOverride, setShowOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  const selectedReq: ShiftRequirement | undefined = shift.requirements?.find(
    r => r.id === selectedRequirement
  );

  useEffect(() => {
    setSelectedStaff('');
    setHardViolations([]);
    setWarnings([]);
    setAssignmentError('');
    setShowOverride(false);
    setOverrideReason('');
    if (selectedRequirement && shift.locationId) {
      fetchQualifiedStaff(selectedRequirement);
    }
  }, [selectedRequirement]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedRequirement('');
      setSelectedStaff('');
      setAvailableStaff([]);
      setHardViolations([]);
      setWarnings([]);
      setAssignmentError('');
      setShowOverride(false);
      setOverrideReason('');
    }
  }, [isOpen]);

  const fetchQualifiedStaff = async (requirementId: string) => {
    setIsFetchingStaff(true);
    try {
      const response = await usersService.getStaffByLocation(shift.locationId);
      const allStaff = (response as any).data?.data || (response as any).data || [];

      const req = shift.requirements?.find(r => r.id === requirementId);
      if (!req) {
        setAvailableStaff(allStaff);
        return;
      }

      // Filter to staff certified for this skill at this location
      const qualified = allStaff.filter((s: any) =>
        s.certifications?.some(
          (c: any) =>
            c.skillId === req.skillId &&
            c.locationId === shift.locationId &&
            c.isActive !== false
        )
      );

      setAvailableStaff(qualified);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setIsFetchingStaff(false);
    }
  };

  const requirementOptions = shift.requirements?.map(req => ({
    value: req.id,
    label: `${req.skill.name} (${req.assignments?.length || 0}/${req.headcount} filled)`,
  })) || [];

  const alreadyAssigned = selectedReq?.assignments?.map(a => a.userId) || [];
  const staffOptions = availableStaff
    .filter(s => !alreadyAssigned.includes(s.id))
    .map(s => ({ value: s.id, label: `${s.firstName} ${s.lastName}` }));

  const handleAssign = async (withOverride = false) => {
    if (!selectedRequirement || !selectedStaff) return;

    setIsLoading(true);
    setAssignmentError('');
    setHardViolations([]);
    setWarnings([]);

    try {
      await onAssign(
        shift.id,
        selectedStaff,
        selectedRequirement,
        withOverride ? overrideReason : undefined
      );
      onToast?.('Staff assigned successfully', 'success');
      onClose();
    } catch (error: any) {
      const responseData = error.response?.data;
      const errorData = responseData?.error?.error || responseData?.error;

      if (errorData?.code === 3001 && errorData?.details) {
        const hard = errorData.details.violations || [];
        const warns = errorData.details.warnings || [];

        setHardViolations(hard);
        setWarnings(warns);

        if (hard.length > 0) {
          setAssignmentError('Assignment blocked. You can override with a reason below.');
          setShowOverride(true);
          onToast?.(hard[0].message, 'error');
        }
      } else {
        const message = errorData?.message || 'Failed to assign staff';
        setAssignmentError(message);
        onToast?.(message, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getViolationStyle = (type: string) =>
    type.includes('WARNING')
      ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
      : 'bg-red-50 border-red-200 text-red-800';

  const getViolationIcon = (type: string) => {
    const icons: Record<string, string> = {
      CERTIFICATION: '🎓',
      AVAILABILITY: '📅',
      DOUBLE_BOOKING: '🔁',
      OVERLAPPING_SHIFT: '⏰',
      REST_PERIOD: '😴',
      WEEKLY_OVERTIME: '⚠️',
      OVERTIME_WARNING: '⚠️',
      MAX_DAILY_HOURS: '🕐',
      MAX_CONSECUTIVE_DAYS: '📆',
      CONSECUTIVE_DAY_WARNING: '📆',
    };
    return icons[type] || '⚠️';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Staff to Shift" size="md">
      <div className="space-y-5">
        {/* Shift summary */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <h3 className="font-medium text-gray-900">{shift.title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(shift.startTime).toLocaleString()} —{' '}
            {new Date(shift.endTime).toLocaleString()}
          </p>
          <p className="text-xs text-primary-500 mt-1">{shift.location?.name}</p>
        </div>

        {/* Step 1: Requirement */}
        <Select
          label="1. Select Position to Fill"
          value={requirementOptions.find(opt => opt.value === selectedRequirement) || null}
          onChange={(opt) => setSelectedRequirement(opt?.value?.toString() || '')}
          options={requirementOptions}
          placeholder="Choose a skill requirement"
        />

        {/* Step 2: Staff */}
        {selectedRequirement && (
          <div>
            {isFetchingStaff ? (
              <div className="flex items-center space-x-2 py-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500" />
                <span>Loading qualified staff...</span>
              </div>
            ) : staffOptions.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                ⚠️ No qualified staff available for <strong>{selectedReq?.skill?.name}</strong> at this location.
                Staff must have a certification for this skill here.
              </div>
            ) : (
              <Select
                label={`2. Select Staff Member (${staffOptions.length} qualified)`}
                value={staffOptions.find(opt => opt.value === selectedStaff) || null}
                onChange={(opt) => {
                  setSelectedStaff(opt?.value?.toString() || '');
                  setHardViolations([]);
                  setWarnings([]);
                  setAssignmentError('');
                  setShowOverride(false);
                  setOverrideReason('');
                }}
                options={staffOptions}
                placeholder="Choose a qualified staff member"
              />
            )}
          </div>
        )}

        {/* Warnings (non-blocking) */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase">Warnings</p>
            {warnings.map((v, i) => (
              <div key={i} className="flex items-start space-x-2 p-3 rounded-lg border bg-yellow-50 border-yellow-200 text-yellow-800 text-sm">
                <span>{getViolationIcon(v.type)}</span>
                <span>{v.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Hard violations */}
        {hardViolations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase">Constraint Violations</p>
            {hardViolations.map((v, i) => (
              <div key={i} className="flex items-start space-x-2 p-3 rounded-lg border bg-red-50 border-red-200 text-red-800 text-sm">
                <span>{getViolationIcon(v.type)}</span>
                <span>{v.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Override section */}
        {showOverride && (
          <div className="border border-orange-200 bg-orange-50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-orange-800">
              Override Constraints
            </p>
            <p className="text-xs text-orange-700">
              As a manager/admin you can override these constraints. Provide a reason to proceed.
            </p>
            <Input
              label="Override Reason"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Emergency coverage needed"
            />
          </div>
        )}

        {/* General error */}
        {assignmentError && hardViolations.length === 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {assignmentError}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>

          {/* Override button — only shown when there are hard violations */}
          {showOverride && overrideReason.trim() && (
            <Button
              onClick={() => handleAssign(true)}
              isLoading={isLoading}
              variant="outline"
              className="w-full sm:w-auto border-orange-400 text-orange-600 hover:bg-orange-50"
            >
              Override & Assign
            </Button>
          )}

          {/* Normal assign — hidden when override is needed */}
          {!showOverride && (
            <Button
              onClick={() => handleAssign(false)}
              isLoading={isLoading}
              disabled={!selectedRequirement || !selectedStaff || staffOptions.length === 0}
              className="w-full sm:w-auto"
            >
              Assign Staff
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};