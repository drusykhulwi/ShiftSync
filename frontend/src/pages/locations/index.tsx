// frontend/src/pages/locations/index.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../components/common/Layout';
import { LocationList } from '../../components/location/LocationList/LocationList';
import { LocationForm } from '../../components/location/LocationForm/LocationForm';
import { LocationDetails } from '../../components/location/LocationDetails/LocationDetails';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../hooks/useAuth';
import { locationsService } from '../../services/api/locations.service';
import { Location } from '../../types/location.types';

export default function LocationsPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationStats, setLocationStats] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchLocations();
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      const response = await locationsService.getLocations({ includeInactive: true });
      setLocations(response.data || []);
      
      // Fetch stats for each location
      const statsPromises = (response.data || []).map(async (loc: Location) => {
        try {
          const stats = await locationsService.getLocationStats(loc.id);
          return { id: loc.id, stats };
        } catch (error) {
          console.error(`Failed to fetch stats for ${loc.id}:`, error);
          return null;
        }
      });

      const statsResults = await Promise.all(statsPromises);
      const statsMap = statsResults.reduce((acc, item) => {
        if (item) acc[item.id] = item.stats;
        return acc;
      }, {} as Record<string, any>);
      
      setLocationStats(statsMap);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLocation = async (data: any) => {
    await locationsService.createLocation(data);
    await fetchLocations();
  };

  const handleUpdateLocation = async (data: any) => {
    if (!selectedLocation) return;
    await locationsService.updateLocation(selectedLocation.id, data);
    await fetchLocations();
    setSelectedLocation(null);
  };

  const handleLocationClick = (location: Location) => {
    setSelectedLocation(location);
    setIsDetailsOpen(true);
  };

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Locations</h1>
        </div>

        <LocationList
          locations={locations}
          locationStats={locationStats}
          isLoading={isLoading}
          onLocationClick={handleLocationClick}
          onAddClick={() => setIsFormOpen(true)}
        />

        <LocationForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleCreateLocation}
          title="Add New Location"
        />

        <Modal
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedLocation(null);
          }}
          title="Location Details"
          size="lg"
        >
          {selectedLocation && (
            <LocationDetails
              location={selectedLocation}
              stats={locationStats[selectedLocation.id]}
              onEdit={() => {
                setIsDetailsOpen(false);
                setTimeout(() => {
                  setIsFormOpen(true);
                }, 100);
              }}
              onViewStaff={() => router.push(`/staff?location=${selectedLocation.id}`)}
              onViewShifts={() => router.push(`/schedule?location=${selectedLocation.id}`)}
              onAssignManager={() => {
                // Implement manager assignment
                console.log('Assign manager to:', selectedLocation.id);
              }}
            />
          )}
        </Modal>
      </div>
    </Layout>
  );
}