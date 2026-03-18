// frontend/src/pages/manager/schedule.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../src/components/common/Layout';
import { useAuth } from '../../src/hooks/useAuth';
import SchedulePage from '../schedule/index';

export default function ManagerSchedulePage() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'MANAGER')) {
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

  return (
    <Layout>
      <SchedulePage />
    </Layout>
  );
}