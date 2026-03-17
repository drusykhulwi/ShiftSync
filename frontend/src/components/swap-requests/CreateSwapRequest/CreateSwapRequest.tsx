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
  const [selectedShift, setSelectedShift] = useState<string>('');
  const [selectedResponder, setSelectedResponder] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'SWAP' | 'DROP'>('SWAP');

  useEffect(() => {
    if (isOpen) {
      fetchMyShifts();
    }
  }, [isOpen]);

  const fetchMyShifts = async () => {
    try {
      // Get user's upcoming shifts
      const response = await shiftsService.getShifts({
        startDate: new Date().toISOString(),
      });
      // Filter shifts assigned to this user
      const userShifts = (response.data || []).filter((shift: any) => 
        shift.requirements?.some((r: any) => 
          r.assignments?.some((a: any) => a.userId === userId)
        )
      );
      setMyShifts(userShifts);
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
    }
  };

  const shiftOptions = myShifts.map(shift => ({
    value: shift.id,
    label: `${shift.title} - ${new Date(shift.startTime).toLocaleDateString()}`,
  }));

  const selectedShiftData = myShifts.find(s => s.id === selectedShift);

  const handleCreateSwap = async () => {
    if (!selectedShift || !selectedResponder) return;
    
    setIsLoading(true);
    try {
      await swapRequestsService.createSwapRequest({
        shiftId: selectedShift,
        type: 'SWAP',
        responderId: selectedResponder,
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to create swap request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDrop = async (shiftId: string) => {
    setIsLoading(true);
    try {
      await swapRequestsService.createSwapRequest({
        shiftId,
        type: 'DROP',
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to create drop request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    {
      id: 'SWAP',
      label: 'Request Swap',
      content: (
        <div className="space-y-4">
          <Select
            label="Select Shift"
            value={shiftOptions.find(opt => opt.value === selectedShift) || null}
            onChange={(opt) => setSelectedShift(opt?.value as string || '')}
            options={shiftOptions}
            placeholder="Choose a shift to swap"
            />

          {selectedShiftData && (
            <SelectResponder
              locationId={selectedShiftData.locationId}
              selectedUserId={selectedResponder}
              onSelect={setSelectedResponder}
            />
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSwap}
              disabled={!selectedShift || !selectedResponder}
              isLoading={isLoading}
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
          <Select
            label="Select Shift"
            value={shiftOptions.find(opt => opt.value === selectedShift) || null}
            onChange={(opt) => setSelectedShift(opt?.value as string || '')}
            options={shiftOptions}
            placeholder="Choose a shift to drop"
           />

          {selectedShiftData && (
            <DropShift
              shift={selectedShiftData}
              onSubmit={handleCreateDrop}
              onCancel={onClose}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Shift Change" size="lg">
      <Tabs tabs={tabs} defaultTab={activeTab} onChange={(tab) => setActiveTab(tab as 'SWAP' | 'DROP')} />
    </Modal>
  );
};