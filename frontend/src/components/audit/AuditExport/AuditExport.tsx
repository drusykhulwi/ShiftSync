// frontend/src/components/audit/AuditExport/AuditExport.tsx
import React, { useState } from 'react';
import { Modal } from '../../common/Modal';
import { Select } from '../../common/Select';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { auditService } from '../../../services/api/audit.service';

interface AuditExportProps {
  isOpen: boolean;
  onClose: () => void;
}

const EXPORT_FORMATS = [
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
];

const DATE_RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'last90', label: 'Last 90 Days' },
  { value: 'custom', label: 'Custom Range' },
];

export const AuditExport: React.FC<AuditExportProps> = ({ isOpen, onClose }) => {
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [dateRange, setDateRange] = useState('last30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getDateRange = () => {
    const now = new Date();
    const end = now.toISOString().split('T')[0];
    let start = '';

    switch (dateRange) {
      case 'today':
        start = end;
        break;
      case 'yesterday':
        const yesterday = new Date(now.setDate(now.getDate() - 1));
        start = yesterday.toISOString().split('T')[0];
        break;
      case 'last7':
        const last7 = new Date(now.setDate(now.getDate() - 7));
        start = last7.toISOString().split('T')[0];
        break;
      case 'last30':
        const last30 = new Date(now.setDate(now.getDate() - 30));
        start = last30.toISOString().split('T')[0];
        break;
      case 'last90':
        const last90 = new Date(now.setDate(now.getDate() - 90));
        start = last90.toISOString().split('T')[0];
        break;
      case 'custom':
        return { start: customStart, end: customEnd };
    }

    return { start, end };
  };

  const handleExport = async () => {
    const { start, end } = getDateRange();
    if (!start || !end) return;

    setIsLoading(true);
    try {
      const blob = await auditService.exportAuditLogs({
        startDate: start,
        endDate: end,
      }, format);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-export-${start}-to-${end}.${format}`;
      a.click();
      onClose();
    } catch (error) {
      console.error('Failed to export audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Audit Logs">
      <div className="space-y-4">
        <Select
        label="Export Format"
        value={EXPORT_FORMATS.find(f => f.value === format) || EXPORT_FORMATS[0]}
        onChange={(opt) => setFormat(opt?.value as 'json' | 'csv')}
        options={EXPORT_FORMATS}
        />

       <Select
        label="Date Range"
        value={DATE_RANGE_OPTIONS.find(opt => opt.value === dateRange) || DATE_RANGE_OPTIONS[0]}
        onChange={(opt) => setDateRange(opt?.value as string || 'last30')}
        options={DATE_RANGE_OPTIONS}
        />

        {dateRange === 'custom' && (
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
            <Input
              label="End Date"
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </div>
        )}

        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">
            This will export all audit logs for the selected date range.
            Large exports may take a few moments to generate.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport} isLoading={isLoading}>
            Export
          </Button>
        </div>
      </div>
    </Modal>
  );
};