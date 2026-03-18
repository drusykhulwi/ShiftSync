// frontend/src/pages/admin/reports.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../src/components/common/Layout';
import { useAuth } from '../../src/hooks/useAuth';
import AnalyticsPage from '../analytics/index';

export default function AdminReportsPage() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    );
  }

  return <AnalyticsPage />;
}