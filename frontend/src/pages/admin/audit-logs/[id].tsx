// frontend/src/pages/admin/audit-logs/[id].tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../../components/common/Layout';
import { AuditLogDetails } from '../../../components/audit/AuditLogViewer/AuditLogDetails';
import { auditService } from '../../../services/api/audit.service';
import { AuditLog } from '../../../types/audit.types';
import { useAuth } from '../../../hooks/useAuth';

export default function AuditLogDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [log, setLog] = useState<AuditLog | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (id && isAuthenticated) {
      fetchLog();
    }
  }, [id, isAuthenticated, authLoading, router]);

  const fetchLog = async () => {
    setIsLoading(true);
    try {
      const response = await auditService.getAuditLogById(id as string);
      setLog(response.data);
    } catch (error) {
      console.error('Failed to fetch audit log:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    );
  }

  if (!log) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Audit log not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <button
          onClick={() => router.back()}
          className="mb-4 text-primary-500 hover:text-primary-600"
        >
          ← Back to Audit Logs
        </button>

        <AuditLogDetails
          isOpen={true}
          onClose={() => router.back()}
          log={log}
        />
      </div>
    </Layout>
  );
}