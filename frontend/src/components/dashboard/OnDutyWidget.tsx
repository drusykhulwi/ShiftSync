import React from 'react';
import { Card } from '../common/Card';

export const OnDutyWidget: React.FC = () => {
  // Mock data - replace with real data from API
  const onDuty = [
    { name: 'John Doe', role: 'Bartender', timeLeft: '2h' },
    { name: 'Jane Smith', role: 'Server', timeLeft: '4h' },
    { name: 'Mike Johnson', role: 'Line Cook', timeLeft: '1h' },
  ];

  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Currently On Duty</h2>
      <div className="space-y-4">
        {onDuty.map((staff, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-secondary-500 flex items-center justify-center text-white font-bold">
                {staff.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{staff.name}</p>
                <p className="text-xs text-gray-500">{staff.role}</p>
              </div>
            </div>
            <span className="text-sm text-gray-500">{staff.timeLeft} left</span>
          </div>
        ))}
      </div>
    </Card>
  );
};