// frontend/src/components/staff/AvailabilityManager/ExceptionDates.tsx
import React, { useState } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { DatePicker } from '../../common/DatePicker';
import { TimePicker } from '../../common/TimePicker';
import { Modal } from '../../common/Modal';

interface ExceptionDatesProps {
  staffId: string;
}

export const ExceptionDates: React.FC<ExceptionDatesProps> = ({ staffId }) => {
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newException, setNewException] = useState({
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    isAvailable: true,
    reason: '',
  });

  const handleAddException = () => {
    // Mock adding exception - replace with actual API call
    setExceptions([...exceptions, { ...newException, id: Date.now() }]);
    setIsModalOpen(false);
    setNewException({
      date: '',
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true,
      reason: '',
    });
  };

  const handleDeleteException = (id: number) => {
    setExceptions(exceptions.filter(e => e.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-gray-700">Exception Dates</h4>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          + Add Exception
        </Button>
      </div>

      {exceptions.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No exception dates added
        </p>
      ) : (
        <div className="space-y-2">
          {exceptions.map((exc) => (
            <div
              key={exc.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {new Date(exc.date).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  {exc.isAvailable ? 'Available' : 'Unavailable'}: {exc.startTime} - {exc.endTime}
                </p>
                {exc.reason && (
                  <p className="text-xs text-gray-400 mt-1">{exc.reason}</p>
                )}
              </div>
              <button
                onClick={() => handleDeleteException(exc.id)}
                className="text-red-500 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Exception Date"
      >
        <div className="space-y-4">
          <DatePicker
            label="Date"
            value={newException.date}
            onChange={(date) => setNewException({ ...newException, date })}
          />

          <div className="grid grid-cols-2 gap-4">
            <TimePicker
              label="Start Time"
              value={newException.startTime}
              onChange={(time) => setNewException({ ...newException, startTime: time })}
            />
            <TimePicker
              label="End Time"
              value={newException.endTime}
              onChange={(time) => setNewException({ ...newException, endTime: time })}
            />
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newException.isAvailable}
                onChange={(e) => setNewException({ ...newException, isAvailable: e.target.checked })}
                className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Available</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason (Optional)
            </label>
            <input
              type="text"
              value={newException.reason}
              onChange={(e) => setNewException({ ...newException, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., Doctor's appointment, Vacation"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddException}>Add Exception</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};