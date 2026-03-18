// frontend/src/pages/staff/[id].tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../src/components/common/Layout';
import { StaffProfile } from '../../src/components/staff/StaffProfile/StaffProfile';
import { useAuth } from '../../src/hooks/useAuth';
import { staffService } from '../../src/services/api/staff.service';
import { StaffMember } from '../../src/types/staff.types';

export default function StaffDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (id && isAuthenticated) fetchStaff();
  }, [id, isAuthenticated, authLoading, router]);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const response = await staffService.getStaffById(id as string);
      // Unwrap double-wrapped response
      setStaff((response as any).data?.data || (response as any).data);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
        </div>
      </Layout>
    );
  }

  if (!staff) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Staff member not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6">
        <button
          onClick={() => router.back()}
          className="mb-4 text-primary-500 hover:text-primary-600 text-sm"
        >
          ← Back to Staff List
        </button>
        <StaffProfile staff={staff} />
      </div>
    </Layout>
  );
}