// frontend/src/components/swap-requests/CreateSwapRequest/CreateSwapRequest.tsx
import React, { useState, useEffect } from 'react';
import { Modal } from '../../common/Modal';
import { Tabs } from '../../common/Tabs';
import { Select } from '../../common/Select';
import { Button } from '../../common/Button';
import { SelectResponder } from './SelectResponder';
import { DropShift } from './DropShift';
import { shiftsService } from '../../../services/api/shifts.service';
import { swapRequestsService } from '../../../services/api/swap-requests.service';

interface CreateSwapRequestProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
}

export const CreateSwapRequest: React.FC<CreateSwapRequestProps> = ({
  isOpen,
  onClose,
  userId,
  onSuccess,
}) => {
  const [myShifts, setMyShifts] = useState<any[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState<string>('');
  const [selectedResponder, setSelectedResponder] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'SWAP' | 'DROP'>('SWAP');

  useEffect(() => {
    if (isOpen && userId) fetchMyShifts();
    if (!isOpen) {
      setSelectedShiftId('');
      setSelectedResponder('');
      setError('');
    }
  }, [isOpen, userId]);

  const fetchMyShifts = async () => {
    setIsFetching(true);
    try {
      const now = new Date();
      const response = await shiftsService.getShifts({
        startDate: now.toISOString(),
        limit: 50,
      });
      // Unwrap double-wrapped response
      const allShifts = (response as any).data?.data || (response as any).data || [];

      // Filter to only shifts this user is assigned to
      // Check both a.userId and a.user?.id
      const userShifts = allShifts.filter((shift: any) =>
        shift.requirements?.some((r: any) =>
          r.assignments?.some(
            (a: any) => a.userId === userId || a.user?.id === userId
          )
        )
      );
      setMyShifts(userShifts);
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const shiftOptions = myShifts.map(shift => ({
    value: shift.id,
    label: `${shift.title} — ${new Date(shift.startTime).toLocaleDateString()} ${new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
  }));

  const selectedShiftData = myShifts.find(s => s.id === selectedShiftId);

  const handleCreateSwap = async () => {
    if (!selectedShiftId || !selectedResponder) return;
    setIsLoading(true);
    setError('');
    try {
      await swapRequestsService.createSwapRequest({
        shiftId: selectedShiftId,
        type: 'SWAP',
        responderId: selectedResponder,
      });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.error?.message || 'Failed to create swap request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDrop = async (shiftId: string) => {
    setIsLoading(true);
    setError('');
    try {
      await swapRequestsService.createSwapRequest({ shiftId, type: 'DROP' });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.error?.message || 'Failed to create drop request');
    } finally {
      setIsLoading(false);
    }
  };

  const emptyState = (
    <div className="text-center py-6 text-gray-400">
      <p className="text-3xl mb-2">📅</p>
      <p className="text-sm">No upcoming assigned shifts found</p>
    </div>
  );

  const tabs = [
    {
      id: 'SWAP',
      label: 'Request Swap',
      content: (
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {isFetching ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" />
            </div>
          ) : myShifts.length === 0 ? emptyState : (
            <>
              <Select
                label="Select Shift to Swap"
                value={shiftOptions.find(opt => opt.value === selectedShiftId) || null}
                onChange={(opt) => {
                  setSelectedShiftId(opt?.value as string || '');
                  setSelectedResponder('');
                }}
                options={shiftOptions}
                placeholder="Choose a shift"
              />
              {selectedShiftData && (
                <SelectResponder
                  locationId={selectedShiftData.locationId}
                  selectedUserId={selectedResponder}
                  onSelect={setSelectedResponder}
                />
              )}
            </>
          )}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
            <Button
              onClick={handleCreateSwap}
              disabled={!selectedShiftId || !selectedResponder || myShifts.length === 0}
              isLoading={isLoading}
              className="w-full sm:w-auto"
            >
              Send Swap Request
            </Button>
          </div>
        </div>
      ),
    },
    {
      id: 'DROP',
      label: 'Drop Shift',
      content: (
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {isFetching ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" />
            </div>
          ) : myShifts.length === 0 ? emptyState : (
            <>
              <Select
                label="Select Shift to Drop"
                value={shiftOptions.find(opt => opt.value === selectedShiftId) || null}
                onChange={(opt) => setSelectedShiftId(opt?.value as string || '')}
                options={shiftOptions}
                placeholder="Choose a shift"
              />
              {selectedShiftData && (
                <DropShift
                  shift={selectedShiftData}
                  onSubmit={handleCreateDrop}
                  onCancel={onClose}
                />
              )}
            </>
          )}
          {!selectedShiftData && myShifts.length > 0 && (
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Shift Change" size="lg">
      <Tabs
        tabs={tabs}
        defaultTab={activeTab}
        onChange={(tab) => setActiveTab(tab as 'SWAP' | 'DROP')}
      />
    </Modal>
  );
};