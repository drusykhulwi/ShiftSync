// frontend/src/components/audit/AuditLogViewer/AuditLogTable.tsx
import React, { useState } from 'react';
import { format } from 'date-fns';
import { AuditLog } from '../../../types/audit.types';
import { Table } from '../../common/Table';
import { Badge } from '../../common/Badge';
import { AuditLogDetails } from './AuditLogDetails';

interface AuditLogTableProps {
  data: AuditLog[];
  onRowClick?: (log: AuditLog) => void;
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({ data, onRowClick }) => {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleRowClick = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailsOpen(true);
    onRowClick?.(log);
  };

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

  const columns = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (item: AuditLog) => (
        <span className="text-sm text-gray-600">
          {format(new Date(item.createdAt), 'MMM d, yyyy HH:mm:ss')}
        </span>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (item: AuditLog) => (
        <div>
          <div className="font-medium text-gray-900">
            {item.actor ? `${item.actor.firstName} ${item.actor.lastName}` : 'System'}
          </div>
          {item.actor && (
            <div className="text-xs text-gray-500">{item.actor.email}</div>
          )}
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (item: AuditLog) => (
        <Badge variant={getActionColor(item.action)}>
          {item.action}
        </Badge>
      ),
    },
    {
      key: 'entity',
      header: 'Entity',
      render: (item: AuditLog) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{item.entityType}</div>
          <div className="text-xs text-gray-500">{item.entityId}</div>
        </div>
      ),
    },
    {
      key: 'ipAddress',
      header: 'IP Address',
      render: (item: AuditLog) => (
        <span className="text-sm text-gray-600">{item.ipAddress || '—'}</span>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        data={data}
        onRowClick={handleRowClick}
        emptyMessage="No audit logs found"
      />

      {selectedLog && (
        <AuditLogDetails
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          log={selectedLog}
        />
      )}
    </>
  );
};