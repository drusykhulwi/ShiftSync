// frontend/src/pages/manager/staff.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../src/components/common/Layout';
import { StaffList } from '../../src/components/staff/StaffList/StaffList';
import { useAuth } from '../../src/hooks/useAuth';
import { staffService } from '../../src/services/api/staff.service';
import { StaffMember } from '../../src/types/staff.types';

export default function ManagerStaffPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!authLoading && user?.role !== 'MANAGER') {
      router.push('/dashboard');
      return;
    }
    if (!authLoading && isAuthenticated) {
      fetchStaff();
    }
  }, [isAuthenticated, authLoading, user, router]);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const locationId = (user as any)?.locations?.[0];
      // Use location-specific fetch if available, otherwise fall back to all staff
      const response = locationId
        ? await staffService.getStaffByLocation(locationId)
        : await staffService.getStaff();
      setStaff((response as any).data?.data || (response as any).data || []);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Staff Management</h1>
        <StaffList
          staff={staff}
          isLoading={isLoading}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onStaffClick={(member) => router.push(`/staff/${member.id}`)}
        />
      </div>
    </Layout>
  );
}