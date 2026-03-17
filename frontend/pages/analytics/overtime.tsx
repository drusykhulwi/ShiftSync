// frontend/src/pages/analytics/overtime.tsx
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../src/components/common/Layout';
import { OvertimeDashboard } from '../../src/components/analytics/OvertimeDashboard/OvertimeDashboard';
import { useAuth } from '../../src/hooks/useAuth';

export default function OvertimePage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { locationId } = router.query;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
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
          ← Back to Analytics
        </button>
        <OvertimeDashboard locationId={locationId as string} />
      </div>
    </Layout>
  );
}