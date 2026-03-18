// frontend/src/pages/staff/index.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../src/components/common/Layout';
import { StaffList } from '../../src/components/staff/StaffList/StaffList';
import { StaffProfile } from '../../src/components/staff/StaffProfile/StaffProfile';
import { Modal } from '../../src/components/common/Modal';
import { useAuth } from '../../src/hooks/useAuth';
import { staffService } from '../../src/services/api/staff.service';
import { StaffMember } from '../../src/types/staff.types';

export default function StaffPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isAuthenticated) fetchStaff();
  }, [isAuthenticated, authLoading, router]);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const response = await staffService.getStaff();
      // Unwrap double-wrapped response
      setStaff(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStaffClick = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setIsProfileOpen(true);
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Staff Management</h1>
        </div>

        <StaffList
          staff={staff}
          isLoading={isLoading}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onStaffClick={handleStaffClick}
        />

        <Modal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          title="Staff Profile"
          size="lg"
        >
          {selectedStaff && (
            <StaffProfile
              staff={selectedStaff}
              onUpdate={(updated) => {
                setStaff(prev => prev.map(s => s.id === updated.id ? updated : s));
              }}
            />
          )}
        </Modal>
      </div>
    </Layout>
  );
}