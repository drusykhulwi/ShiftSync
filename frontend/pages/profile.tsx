// frontend/src/pages/profile.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../src/components/common/Layout';
import { Card } from '../src/components/common/Card';
import { Input } from '../src/components/common/Input';
import { Button } from '../src/components/common/Button';
import { Badge } from '../src/components/common/Badge';
import { Avatar } from '../src/components/common/Avatar';
import { useAuth } from '../src/hooks/useAuth';
import { usersService } from '../src/services/api/users.service';
import { StaffMember } from '../src/types/staff.types';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<StaffMember | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    desiredHours: 40,
  });

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) fetchProfile();
  }, [user, authLoading, router]);

  const fetchProfile = async () => {
    try {
      const response = await usersService.getProfile();
      // Handle possible wrapping
      const data = (response as any).data?.data || (response as any).data || response;
      setProfile(data);
      setFormData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || '',
        desiredHours: data.desiredHours || 40,
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await usersService.updateProfile(formData);
      setIsEditing(false);
      setSaveMessage({ type: 'success', text: 'Profile updated successfully' });
      setTimeout(() => setSaveMessage(null), 3000);
      await fetchProfile();
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const getSkillName = (cert: any) => cert.skillName || cert.skill?.name || '—';
  const getLocationName = (cert: any) => cert.locationName || cert.location?.name || '—';

  const roleLabel = (role: string) => ({
    ADMIN: 'Administrator',
    MANAGER: 'Manager',
    STAFF: 'Staff Member',
  }[role] || role);

  const roleBadgeVariant = (role: string): any => ({
    ADMIN: 'error',
    MANAGER: 'warning',
    STAFF: 'info',
  }[role] || 'default');

  if (authLoading || !profile) {
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
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">My Profile</h1>

        {saveMessage && (
          <div className={`mb-4 p-3 rounded-lg text-sm border ${
            saveMessage.type === 'success'
              ? 'bg-green-50 text-green-800 border-green-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            {saveMessage.text}
          </div>
        )}

        {/* Profile header card */}
        <Card className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-shrink-0 flex justify-center sm:justify-start">
              <Avatar name={`${profile.firstName} ${profile.lastName}`} size="lg" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-gray-900">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-gray-500 text-sm mt-1">{profile.email}</p>
              <div className="mt-2 flex justify-center sm:justify-start">
                <Badge variant={roleBadgeVariant(profile.role)} size="sm">
                  {roleLabel(profile.role)}
                </Badge>
              </div>
            </div>
            {!isEditing && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto"
              >
                Edit Profile
              </Button>
            )}
          </div>
        </Card>

        {/* Edit / view form */}
        <Card className="mb-4">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Personal Information</h3>

          {isEditing ? (
            <div className="space-y-4">
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
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
              <Input
                label="Desired Weekly Hours"
                type="number"
                min={1}
                max={80}
                value={formData.desiredHours}
                onChange={(e) => setFormData({ ...formData, desiredHours: parseInt(e.target.value) || 40 })}
              />
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsEditing(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button onClick={handleUpdateProfile} isLoading={isSaving} className="w-full sm:w-auto">
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone</p>
                <p className="text-sm font-medium text-gray-900">{profile.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email</p>
                <p className="text-sm font-medium text-gray-900">{profile.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Desired Hours</p>
                <p className="text-sm font-medium text-gray-900">{profile.desiredHours || 40}h / week</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Member Since</p>
                <p className="text-sm font-medium text-gray-900">
                  {profile.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    : '—'}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Certifications */}
        {profile.certifications && profile.certifications.length > 0 && (
          <Card>
            <h3 className="text-base font-semibold text-gray-800 mb-4">Skills & Certifications</h3>
            <div className="space-y-3">
              {profile.certifications.map((cert: any) => (
                <div
                  key={cert.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{getSkillName(cert)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">📍 {getLocationName(cert)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {cert.expiresAt && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        new Date(cert.expiresAt) < new Date()
                          ? 'bg-red-100 text-red-700'
                          : new Date(cert.expiresAt) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-500'
                      }`}>
                        {new Date(cert.expiresAt) < new Date()
                          ? 'Expired'
                          : `Expires ${new Date(cert.expiresAt).toLocaleDateString()}`}
                      </span>
                    )}
                    <Badge variant="info" size="sm">Active</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}