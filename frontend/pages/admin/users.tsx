// frontend/src/pages/admin/users.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../src/components/common/Layout';
import { Button } from '../../src/components/common/Button';
import { Modal } from '../../src/components/common/Modal';
import { Input } from '../../src/components/common/Input';
import { Select } from '../../src/components/common/Select';
import { Badge } from '../../src/components/common/Badge';
import { Avatar } from '../../src/components/common/Avatar';
import { useAuth } from '../../src/hooks/useAuth';
import { usersService } from '../../src/services/api/users.service';
import { locationsService } from '../../src/services/api/locations.service';
import { skillsService } from '../../src/services/api/skills.service';
import { StaffMember } from '../../src/types/staff.types';

export default function AdminUsersPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<StaffMember | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'STAFF' as 'ADMIN' | 'MANAGER' | 'STAFF',
    isActive: true,
    desiredHours: 40,
    locationIds: [] as string[],
    skillId: '',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { router.push('/login'); return; }
    if (!authLoading && user?.role !== 'ADMIN') { router.push('/dashboard'); return; }
    fetchAll();
  }, [isAuthenticated, authLoading, user, router]);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [usersRes, locationsRes, skillsRes] = await Promise.all([
        usersService.getUsers({ limit: 100 }),
        locationsService.getLocations({ limit: 100 }),
        skillsService.getSkills(),
      ]);
      setUsers((usersRes as any).data?.data || (usersRes as any).data || []);
      setLocations((locationsRes as any).data?.data || (locationsRes as any).data || []);
      setSkills((skillsRes as any).data?.data || (skillsRes as any).data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (u: StaffMember) => {
    setSelectedUser(u);
    setSaveError('');
    const managedLocationIds = (u as any).managedLocations?.map((l: any) => l.id) || [];
    const certLocationIds: string[] = [];
    ((u as any).certifications || []).forEach((c: any) => {
      const locId = c.locationId || c.location?.id;
      if (locId && !certLocationIds.includes(locId)) certLocationIds.push(locId);
    });
    const firstSkillId = (u as any).certifications?.[0]?.skillId ||
                         (u as any).certifications?.[0]?.skill?.id || '';
    setFormData({
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone || '',
      role: u.role as any,
      isActive: u.isActive,
      desiredHours: u.desiredHours || 40,
      locationIds: u.role === 'MANAGER' ? managedLocationIds : certLocationIds,
      skillId: firstSkillId,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    setSaveError('');
    try {
      await usersService.updateUser(selectedUser.id, {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: formData.role,
        isActive: formData.isActive,
        desiredHours: formData.desiredHours,
      });

      if (formData.role === 'MANAGER') {
        const existingIds = (selectedUser as any).managedLocations?.map((l: any) => l.id) || [];
        const toAdd = formData.locationIds.filter((id: string) => !existingIds.includes(id));
        const toRemove = existingIds.filter((id: string) => !formData.locationIds.includes(id));
        for (const locationId of toAdd) {
          try { await locationsService.assignManager(locationId, selectedUser.id); } catch {}
        }
        for (const locationId of toRemove) {
          try { await locationsService.removeManager(locationId, selectedUser.id); } catch {}
        }
      }

      if (formData.role === 'STAFF') {
        // Get existing cert location IDs
        const existingCerts = ((selectedUser as any).certifications || []);
        const existingCertLocIds: string[] = existingCerts
          .map((c: any) => c.locationId || c.location?.id)
          .filter(Boolean);

        // Always add certifications for all checked locations (with the selected skill)
        // If no skill selected, still add without skill (backend may handle this)
        const toAdd = formData.locationIds.filter((id: string) => !existingCertLocIds.includes(id));
        for (const locationId of toAdd) {
          if (formData.skillId) {
            try {
              await usersService.addCertification(selectedUser.id, formData.skillId, locationId);
            } catch (e) {
              console.error('Failed to add cert:', e);
            }
          }
        }

        // Remove certs for unchecked locations
        const toRemove = existingCertLocIds.filter((id: string) => !formData.locationIds.includes(id));
        for (const locationId of toRemove) {
          // Find all certs for this location and remove them
          const certsToRemove = existingCerts.filter(
            (c: any) => (c.locationId || c.location?.id) === locationId
          );
          for (const cert of certsToRemove) {
            try {
              await usersService.removeCertification(selectedUser.id, cert.id);
            } catch {}
          }
        }
      }

      setIsEditModalOpen(false);
      setSelectedUser(null);
      await fetchAll();
    } catch (error: any) {
      setSaveError(error.response?.data?.error?.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateUser = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      await usersService.createUser({
        ...formData,
        password: 'password123',
        locationIds: formData.role === 'MANAGER' ? formData.locationIds : undefined,
      });
      setIsCreateModalOpen(false);
      resetForm();
      await fetchAll();
    } catch (error: any) {
      setSaveError(error.response?.data?.error?.message || 'Failed to create user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Deactivate this user?')) {
      try { await usersService.deleteUser(userId); await fetchAll(); } catch {}
    }
  };

  const resetForm = () => {
    setFormData({ email: '', firstName: '', lastName: '', phone: '', role: 'STAFF', isActive: true, desiredHours: 40, locationIds: [], skillId: '' });
    setSaveError('');
  };

  const getUserLocations = (u: StaffMember): string => {
    if (u.role === 'MANAGER') {
      const managed = (u as any).managedLocations || [];
      return managed.map((l: any) => l.name).join(', ') || '—';
    }
    if (u.role === 'STAFF') {
      const names: string[] = [];
      ((u as any).certifications || []).forEach((c: any) => {
        const name = c.locationName || c.location?.name;
        if (name && !names.includes(name)) names.push(name);
      });
      return names.join(', ') || '—';
    }
    return '—';
  };

  const roleOptions = [{ value: 'ADMIN', label: 'Admin' }, { value: 'MANAGER', label: 'Manager' }, { value: 'STAFF', label: 'Staff' }];
  const skillOptions = skills.map(s => ({ value: s.id, label: s.name }));
  const roleFilterOptions = [{ value: '', label: 'All Roles' }, ...roleOptions];

  const filtered = users.filter(u => {
    const name = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase();
    return (!searchTerm || name.includes(searchTerm.toLowerCase())) &&
           (!roleFilter || u.role === roleFilter);
  });

  const LocationCheckboxes = ({ ids, onChange, label }: { ids: string[]; onChange: (ids: string[]) => void; label: string }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
        {locations.length === 0
          ? <p className="text-sm text-gray-400">No locations available</p>
          : locations.map((loc: any) => (
            <label key={loc.id} className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={ids.includes(loc.id)}
                onChange={(e) => {
                  const updated = e.target.checked ? [...ids, loc.id] : ids.filter(id => id !== loc.id);
                  onChange(updated);
                }}
                className="w-4 h-4 text-primary-500 border-gray-300 rounded" />
              <span className="text-sm text-gray-700">{loc.name}</span>
            </label>
          ))
        }
      </div>
    </div>
  );

  const FormFields = () => (
    <>
      {saveError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{saveError}</div>}
      <Input label="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="user@example.com" />
      <div className="grid grid-cols-2 gap-4">
        <Input label="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
        <Input label="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
      </div>
      <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
      <Select label="Role" value={roleOptions.find(o => o.value === formData.role) || roleOptions[2]}
        onChange={(opt) => setFormData({ ...formData, role: opt?.value as any || 'STAFF', locationIds: [], skillId: '' })}
        options={roleOptions} />
      {formData.role === 'MANAGER' && (
        <LocationCheckboxes ids={formData.locationIds} onChange={(ids) => setFormData({ ...formData, locationIds: ids })} label="Managed Locations" />
      )}
      {formData.role === 'STAFF' && (
        <>
          <Select label="Skill for Location Certification"
            value={skillOptions.find(s => s.value === formData.skillId) || null}
            onChange={(opt) => setFormData({ ...formData, skillId: opt?.value as string || '' })}
            options={skillOptions} placeholder="Select skill (required to add locations)" />
          <LocationCheckboxes ids={formData.locationIds} onChange={(ids) => setFormData({ ...formData, locationIds: ids })} label="Certified Locations" />
          {!formData.skillId && formData.locationIds.length === 0 && (
            <p className="text-xs text-amber-600">Select a skill first, then check locations to certify.</p>
          )}
        </>
      )}
    </>
  );

  if (authLoading) {
    return <Layout><div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">User Management</h1>
          <Button onClick={() => { resetForm(); setIsCreateModalOpen(true); }} className="w-full sm:w-auto">+ Create User</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: users.length },
            { label: 'Admins', value: users.filter(u => u.role === 'ADMIN').length },
            { label: 'Managers', value: users.filter(u => u.role === 'MANAGER').length },
            { label: 'Staff', value: users.filter(u => u.role === 'STAFF').length },
          ].map(s => (
            <div key={s.label} className="bg-white p-4 rounded-lg shadow">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input type="text" placeholder="Search by name or email..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
          <Select value={roleFilterOptions.find(o => o.value === roleFilter) || roleFilterOptions[0]}
            onChange={(opt) => setRoleFilter(opt?.value?.toString() || '')}
            options={roleFilterOptions} />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" /></div>
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="sm:hidden space-y-3">
              {filtered.map(u => (
                <div key={u.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <Avatar name={`${u.firstName} ${u.lastName}`} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                    <button onClick={() => openEditModal(u)} className="text-primary-500 text-sm font-medium">Edit</button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant={u.role === 'ADMIN' ? 'error' : u.role === 'MANAGER' ? 'warning' : 'info'} size="sm">{u.role}</Badge>
                    <Badge variant={u.isActive ? 'success' : 'error'} size="sm">{u.isActive ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  {getUserLocations(u) !== '—' && (
                    <p className="text-xs text-gray-500 mt-2">📍 {getUserLocations(u)}</p>
                  )}
                </div>
              ))}
              {filtered.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No users found</p>}
            </div>

            {/* Desktop: table */}
            <div className="hidden sm:block bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Staff Member', 'Role', 'Location(s)', 'Status', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <Avatar name={`${u.firstName} ${u.lastName}`} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.role === 'ADMIN' ? 'error' : u.role === 'MANAGER' ? 'warning' : 'info'} size="sm">{u.role}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{getUserLocations(u)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={u.isActive ? 'success' : 'error'} size="sm">{u.isActive ? 'Active' : 'Inactive'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openEditModal(u)} className="text-sm text-primary-500 hover:text-primary-600">Edit</button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New User">
          <div className="space-y-4">
            <FormFields />
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button onClick={handleCreateUser} isLoading={isSaving} className="w-full sm:w-auto">Create User</Button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedUser(null); }} title="Edit User">
          <div className="space-y-4">
            <FormFields />
            <div className="flex items-center space-x-2">
              <input type="checkbox" checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-primary-500" />
              <label className="text-sm text-gray-700">Active</label>
            </div>
            {selectedUser && (
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center pt-4 border-t">
                <Button variant="outline" className="w-full sm:w-auto text-red-500" onClick={() => handleDeleteUser(selectedUser.id)}>Deactivate</Button>
                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="w-full sm:w-auto">Cancel</Button>
                  <Button onClick={handleUpdateUser} isLoading={isSaving} className="w-full sm:w-auto">Save Changes</Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </Layout>
  );
}