// frontend/src/pages/staff/availability.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../src/components/common/Layout';
import { useAuth } from '../../src/hooks/useAuth';
import { AvailabilityManager } from '../../src/components/staff/AvailabilityManager/AvailabilityManager';

export default function StaffAvailabilityPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'STAFF')) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
        </div>
      </Layout>
    );
  }

  // AvailabilityManager expects a StaffMember — pass minimal shape from auth user
  const staffShape = user ? {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    isActive: true,
  } : null;

  return (
    <Layout>
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">My Availability</h1>
        {staffShape && (
          <AvailabilityManager staff={staffShape as any} />
        )}
      </div>
    </Layout>
  );
}