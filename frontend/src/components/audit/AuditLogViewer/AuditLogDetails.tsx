// frontend/src/components/audit/AuditLogViewer/AuditLogDetails.tsx
import React from 'react';
import { format } from 'date-fns';
import { Modal } from '../../common/Modal';
import { Badge } from '../../common/Badge';
import { AuditLog } from '../../../types/audit.types';

interface AuditLogDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  log: AuditLog;
}

export const AuditLogDetails: React.FC<AuditLogDetailsProps> = ({
  isOpen,
  onClose,
  log,
}) => {
  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'info';
      case 'DELETE':
        return 'error';
      case 'ASSIGN':
      case 'APPROVE':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (value instanceof Date) return format(value, 'yyyy-MM-dd HH:mm:ss');
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Audit Log Details" size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Timestamp</p>
            <p className="font-medium">{format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Action</p>
            <Badge variant={getActionColor(log.action)}>{log.action}</Badge>
          </div>
          <div>
            <p className="text-xs text-gray-500">Actor</p>
            <p className="font-medium">
              {log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : 'System'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Entity</p>
            <p className="font-medium">{log.entityType}</p>
            <p className="text-xs text-gray-500">{log.entityId}</p>
          </div>
        </div>

        {(log.ipAddress || log.userAgent) && (
          <div className="bg-gray-50 p-3 rounded">
            <h4 className="font-medium text-gray-700 mb-2">Request Info</h4>
            {log.ipAddress && <p className="text-sm text-gray-600">IP: {log.ipAddress}</p>}
            {log.userAgent && <p className="text-sm text-gray-600">User Agent: {log.userAgent}</p>}
          </div>
        )}

        <div>
          <h4 className="font-medium text-gray-700 mb-3">State Changes</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50 p-3 rounded">
              <p className="text-xs font-medium text-red-700 mb-1">Before State</p>
              <pre className="text-xs text-red-600 overflow-auto max-h-64">
                {formatValue(log.beforeState)}
              </pre>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <p className="text-xs font-medium text-green-700 mb-1">After State</p>
              <pre className="text-xs text-green-600 overflow-auto max-h-64">
                {formatValue(log.afterState)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};