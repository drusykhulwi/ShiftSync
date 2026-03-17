// frontend/src/pages/locations/[id].tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../src/components/common/Layout';
import { LocationDetails } from '../../src/components/location/LocationDetails/LocationDetails';
import { LocationForm } from '../../src/components/location/LocationForm/LocationForm';
import { useAuth } from '../../src/hooks/useAuth';
import { locationsService } from '../../src/services/api/locations.service';
import { Location } from '../../src/types/location.types';

export default function LocationDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [location, setLocation] = useState<Location | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (id && isAuthenticated) {
      fetchLocation();
    }
  }, [id, isAuthenticated, authLoading, router]);

  const fetchLocation = async () => {
    setIsLoading(true);
    try {
      const response = await locationsService.getLocationById(id as string);
      setLocation(response.data);
      
      try {
        const statsData = await locationsService.getLocationStats(id as string);
        setStats(statsData);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    } catch (error) {
      console.error('Failed to fetch location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLocation = async (data: any) => {
    if (!location) return;
    await locationsService.updateLocation(location.id, data);
    await fetchLocation();
    setIsEditOpen(false);
  };

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    );
  }

  if (!location) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Location not found</p>
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
          ← Back to Locations
        </button>

        <LocationDetails
          location={location}
          stats={stats}
          onEdit={() => setIsEditOpen(true)}
          onViewStaff={() => router.push(`/staff?location=${location.id}`)}
          onViewShifts={() => router.push(`/schedule?location=${location.id}`)}
        />

        <LocationForm
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSubmit={handleUpdateLocation}
          initialData={location}
          title="Edit Location"
        />
      </div>
    </Layout>
  );
}