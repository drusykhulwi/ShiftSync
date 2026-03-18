// frontend/src/pages/profile.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../src/components/common/Layout';
import { Card } from '../src/components/common/Card';
import { Input } from '../src/components/common/Input';
import { Button } from '../src/components/common/Button';
import { Avatar } from '../src/components/common/Avatar';
import { useAuth } from '../src/hooks/useAuth';
import { usersService } from '../src/services/api/users.service';
import { StaffMember } from '../src/types/staff.types';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<StaffMember | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    desiredHours: 40,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchProfile();
    }
  }, [user, authLoading, router]);

  const fetchProfile = async () => {
    try {
      const response = await usersService.getProfile();
      setProfile(response.data);
      setFormData({
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        phone: response.data.phone || '',
        desiredHours: response.data.desiredHours || 40,
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await usersService.updateProfile(formData);
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (authLoading || !profile) {
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
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Profile</h1>
        
        <Card>
          <div className="flex items-start space-x-6 mb-6">
            <Avatar name={`${profile.firstName} ${profile.lastName}`} size="lg" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-gray-500">{profile.email}</p>
              <p className="text-sm text-gray-400 mt-1">Role: {profile.role}</p>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
              <Input
                label="Desired Weekly Hours"
                type="number"
                value={formData.desiredHours}
                onChange={(e) => setFormData({ ...formData, desiredHours: parseInt(e.target.value) })}
              />
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button onClick={handleUpdateProfile}>Save Changes</Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{profile.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Desired Hours</p>
                  <p className="font-medium">{profile.desiredHours || 40}h/week</p>
                </div>
              </div>
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            </div>
          )}
        </Card>

        {/* Certifications Section */}
        {profile.certifications && profile.certifications.length > 0 && (
          <Card className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">My Certifications</h3>
            <div className="space-y-3">
              {profile.certifications.map((cert) => (
                <div key={cert.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{cert.skillName}</p>
                    <p className="text-sm text-gray-500">{cert.locationName}</p>
                  </div>
                  {cert.expiresAt && (
                    <span className="text-xs text-gray-400">
                      Expires {new Date(cert.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}