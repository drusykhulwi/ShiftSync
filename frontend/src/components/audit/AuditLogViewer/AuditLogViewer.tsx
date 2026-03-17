// frontend/src/components/audit/AuditLogViewer/AuditLogViewer.tsx
import React, { useState, useEffect } from 'react';
import { AuditLogTable } from './AuditLogTable';
import { AuditLogFilters } from './AuditLogFilters';
import { Button } from '../../common/Button';
import { auditService } from '../../../services/api/audit.service';
import { AuditLog, AuditLogFilters as IAuditLogFilters } from '../../../types/audit.types';

export const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<IAuditLogFilters>({
    page: 1,
    limit: 50,
  });

  useEffect(() => {
    fetchLogs();
  }, [filters.page, filters.limit]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await auditService.getAuditLogs(filters);
      setLogs(response.data);
      setMeta(response.meta);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilters: IAuditLogFilters) => {
    setFilters({ ...newFilters, page: 1 });
    setShowFilters(false);
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const blob = await auditService.exportAuditLogs(filters, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString()}.${format}`;
      a.click();
    } catch (error) {
      console.error('Failed to export audit logs:', error);
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            🔍 Filters
          </Button>
          <span className="text-sm text-gray-500">
            Total: {meta.total} logs
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExport('json')}
          >
            Export JSON
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExport('csv')}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <AuditLogFilters
          onFilterChange={handleFilterChange}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Logs Table */}
      <AuditLogTable data={logs} />

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-4">
          <Button
            size="sm"
            variant="outline"
            disabled={meta.page === 1}
            onClick={() => handlePageChange(meta.page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {meta.page} of {meta.totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={meta.page === meta.totalPages}
            onClick={() => handlePageChange(meta.page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      )}
    </div>
  );
};