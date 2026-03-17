// frontend/src/components/analytics/RiskDashboard/RiskDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '../../common/Card';
import { Select } from '../../common/Select';
import { Button } from '../../common/Button';
import { analyticsService } from '../../../services/api/analytics.service';
import { locationsService } from '../../../services/api/locations.service';
import { OvertimeRisk } from '../../../types/analytics.types';

export const RiskDashboard: React.FC = () => {
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [risks, setRisks] = useState<OvertimeRisk[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalShifts: 0,
    totalStaff: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      fetchRisks();
    }
  }, [selectedLocation]);

  const fetchLocations = async () => {
    try {
      const response = await locationsService.getLocations();
      setLocations(response.data || []);
      if (response.data?.length > 0) {
        setSelectedLocation(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const fetchRisks = async () => {
    setIsLoading(true);
    try {
      const data = await analyticsService.getOvertimeRisks(selectedLocation);
      setRisks(data.risks);
      setRecommendations(data.recommendations);
      setStats({
        totalShifts: data.totalShifts,
        totalStaff: data.totalStaff,
      });
    } catch (error) {
      console.error('Failed to fetch risks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const locationOptions = locations.map(loc => ({
    value: loc.id,
    label: loc.name,
  }));

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Overtime Risk Assessment</h2>
            <p className="text-sm text-gray-500 mt-1">
              Identify employees at risk of overtime violations
            </p>
          </div>
          <div className="w-64">
            <Select
              value={locationOptions.find(opt => opt.value === selectedLocation) || null}
              onChange={(opt) => setSelectedLocation(opt?.value || '')}
              options={locationOptions}
              placeholder="Select location"
            />
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-gray-500">Upcoming Shifts</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalShifts}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Staff Scheduled</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalStaff}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">At Risk Employees</p>
          <p className="text-2xl font-bold text-red-500">{risks.length}</p>
        </Card>
      </div>

      {/* Risk List */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Employees at Risk</h3>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : risks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-4xl mb-2">✅</p>
            <p>No employees at risk</p>
          </div>
        ) : (
          <div className="space-y-3">
            {risks.map((risk) => (
              <div
                key={risk.userId}
                className={`p-4 rounded-lg border ${getRiskColor(risk.riskLevel)}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{risk.name}</h4>
                    <p className="text-sm mt-1">
                      Projected: {risk.projectedHours.toFixed(1)} hours
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      risk.riskLevel === 'HIGH' ? 'bg-red-200' :
                      risk.riskLevel === 'MEDIUM' ? 'bg-yellow-200' :
                      'bg-green-200'
                    }`}>
                      {risk.riskLevel}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex space-x-3">
                  {risk.warningThreshold && (
                    <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                      ⚠️ Approaching 40h
                    </span>
                  )}
                  {risk.overtimeThreshold && (
                    <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">
                      🚫 Will exceed 40h
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recommendations</h3>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-primary-500 text-lg">💡</span>
                <p className="text-sm text-gray-700">{rec}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};