// frontend/src/pages/admin/users.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../src/components/common/Layout';
import { StaffList } from '../../src/components/staff/StaffList/StaffList';
import { Button } from '../../src/components/common/Button';
import { Modal } from '../../src/components/common/Modal';
import { Input } from '../../src/components/common/Input';
import { Select } from '../../src/components/common/Select';
import { useAuth } from '../../src/hooks/useAuth';
import { usersService } from '../../src/services/api/users.service';
import { StaffMember } from '../../src/types/staff.types';

export default function AdminUsersPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<StaffMember | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'STAFF' as 'ADMIN' | 'MANAGER' | 'STAFF',
    isActive: true,
    desiredHours: 40,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!authLoading && user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    fetchUsers();
  }, [isAuthenticated, authLoading, user, router]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await usersService.getUsers({ limit: 100 });
      setUsers(response.data.data || []);  // fixed double-wrap
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      await usersService.createUser({
        ...formData,
        password: 'password123',
      });
      setIsCreateModalOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      await usersService.updateUser(selectedUser.id, formData);
      setIsEditModalOpen(false);
      setSelectedUser(null);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      try {
        await usersService.deleteUser(userId);
        fetchUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'STAFF',
      isActive: true,
      desiredHours: 40,
    });
  };

  const openEditModal = (user: StaffMember) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      role: user.role as 'ADMIN' | 'MANAGER' | 'STAFF',
      isActive: user.isActive,
      desiredHours: user.desiredHours || 40,
    });
    setIsEditModalOpen(true);
  };

  const roleOptions = [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'STAFF', label: 'Staff' },
  ];

  const totalUsers = Array.isArray(users) ? users.length : 0;
  const adminCount = Array.isArray(users) ? users.filter(u => u.role === 'ADMIN').length : 0;
  const managerCount = Array.isArray(users) ? users.filter(u => u.role === 'MANAGER').length : 0;
  const staffCount = Array.isArray(users) ? users.filter(u => u.role === 'STAFF').length : 0;

  if (authLoading) {
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
      <div className="p-4 sm:p-6">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">User Management</h1>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto"
          >
            + Create User
          </Button>
        </div>

        {/* Stats — 2 cols on mobile, 4 on md+ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-xs sm:text-sm text-gray-500">Total Users</p>
            <p className="text-xl sm:text-2xl font-bold">{totalUsers}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-xs sm:text-sm text-gray-500">Admins</p>
            <p className="text-xl sm:text-2xl font-bold">{adminCount}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-xs sm:text-sm text-gray-500">Managers</p>
            <p className="text-xl sm:text-2xl font-bold">{managerCount}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-xs sm:text-sm text-gray-500">Staff</p>
            <p className="text-xl sm:text-2xl font-bold">{staffCount}</p>
          </div>
        </div>

        {/* Users List */}
        <StaffList
          staff={users}
          isLoading={isLoading}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onStaffClick={openEditModal}
        />

        {/* Create User Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New User"
        >
          <div className="space-y-4">
            <Input
              label="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@example.com"
            />
            {/* Stack on mobile, side-by-side on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="John"
              />
              <Input
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
              />
            </div>
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(555) 123-4567"
            />
            <Select
              label="Role"
              value={roleOptions.find(opt => opt.value === formData.role) || roleOptions[0]}
              onChange={(opt) => setFormData({ ...formData, role: opt?.value as any || 'STAFF' })}
              options={roleOptions}
            />
            {/* Stack on mobile, row on sm+ */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateUser}
                className="w-full sm:w-auto"
              >
                Create User
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit User Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit User"
        >
          <div className="space-y-4">
            <Input
              label="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
              <Input
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Select
              label="Role"
              value={roleOptions.find(opt => opt.value === formData.role) || roleOptions[0]}
              onChange={(opt) => setFormData({ ...formData, role: opt?.value as any || 'STAFF' })}
              options={roleOptions}
            />
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-primary-500"
              />
              <label className="text-sm text-gray-700">Active</label>
            </div>
            {selectedUser && (
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto text-red-500"
                  onClick={() => handleDeleteUser(selectedUser.id)}
                >
                  Deactivate User
                </Button>
                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateUser}
                    className="w-full sm:w-auto"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </Layout>
  );
}