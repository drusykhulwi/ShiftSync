// frontend/src/pages/staff/index.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../src/components/common/Layout';
import { Badge } from '../../src/components/common/Badge';
import { Avatar } from '../../src/components/common/Avatar';
import { Select } from '../../src/components/common/Select';
import { useAuth } from '../../src/hooks/useAuth';
import { staffService } from '../../src/services/api/staff.service';
import { StaffMember } from '../../src/types/staff.types';

export default function StaffPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { router.push('/login'); return; }
    if (isAuthenticated) fetchStaff();
  }, [isAuthenticated, authLoading, router]);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const response = await staffService.getStaff();
      setStaff((response as any).data?.data || (response as any).data || []);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSkillName = (cert: any) => cert.skillName || cert.skill?.name || '—';
  const getLocationName = (cert: any) => cert.locationName || cert.location?.name;

  const getLocations = (member: StaffMember): string => {
    const names: string[] = [];
    (member.certifications || []).forEach((c: any) => {
      const name = getLocationName(c);
      if (name && !names.includes(name)) names.push(name);
    });
    return names.join(', ') || '—';
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const filtered = staff.filter(s => {
    const name = `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase();
    const matchSearch = !searchTerm || name.includes(searchTerm.toLowerCase());
    const matchStatus = !statusFilter ||
      (statusFilter === 'active' ? s.isActive : !s.isActive);
    return matchSearch && matchStatus;
  });

  const uniqueLocations = new Set(
    staff.flatMap(s => (s.certifications || [])
      .map((c: any) => c.locationId || c.location?.id)
      .filter(Boolean))
  ).size;

  if (authLoading) {
    return <Layout><div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Staff Management</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Staff', value: staff.length },
            { label: 'Active', value: staff.filter(s => s.isActive).length },
            { label: 'Inactive', value: staff.filter(s => !s.isActive).length },
            { label: 'Locations', value: uniqueLocations },
          ].map(stat => (
            <div key={stat.label} className="bg-white p-4 rounded-lg shadow">
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
          <Select
            value={statusOptions.find(o => o.value === statusFilter) || statusOptions[0]}
            onChange={(opt) => setStatusFilter(opt?.value?.toString() || '')}
            options={statusOptions}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
          </div>
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="sm:hidden space-y-3">
              {filtered.map(member => (
                <div
                  key={member.id}
                  className="bg-white rounded-lg shadow p-4 active:bg-gray-50"
                  onClick={() => router.push(`/staff/${member.id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3 min-w-0">
                      <Avatar name={`${member.firstName} ${member.lastName}`} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{member.email}</p>
                      </div>
                    </div>
                    <Badge variant={member.isActive ? 'success' : 'error'} size="sm">
                      {member.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(member.certifications || []).slice(0, 3).map((cert: any) => (
                      <Badge key={cert.id} variant="info" size="sm">{getSkillName(cert)}</Badge>
                    ))}
                    {(member.certifications?.length || 0) > 3 && (
                      <Badge variant="default" size="sm">+{(member.certifications?.length || 0) - 3}</Badge>
                    )}
                  </div>
                  {getLocations(member) !== '—' && (
                    <p className="text-xs text-gray-500 mt-2">📍 {getLocations(member)}</p>
                  )}
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-gray-400 py-8 text-sm">No staff found</p>
              )}
            </div>

            {/* Desktop: table */}
            <div className="hidden sm:block bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Staff Member', 'Skills', 'Location(s)', 'Status', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(member => (
                    <tr key={member.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/staff/${member.id}`)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <Avatar name={`${member.firstName} ${member.lastName}`} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{member.firstName} {member.lastName}</p>
                            <p className="text-xs text-gray-500">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(member.certifications || []).slice(0, 2).map((cert: any) => (
                            <Badge key={cert.id} variant="info" size="sm">{getSkillName(cert)}</Badge>
                          ))}
                          {(member.certifications?.length || 0) > 2 && (
                            <Badge variant="default" size="sm">+{(member.certifications?.length || 0) - 2}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{getLocations(member)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={member.isActive ? 'success' : 'error'} size="sm">
                          {member.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-primary-500">View →</span>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No staff found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}