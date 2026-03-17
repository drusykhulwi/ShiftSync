// frontend/src/components/analytics/FairnessDashboard/FairnessDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '../../common/Card';
import { BarChart } from '../charts/BarChart';
import { PieChart } from '../charts/PieChart';
import { Select } from '../../common/Select';
import { Button } from '../../common/Button';
import { analyticsService } from '../../../services/api/analytics.service';
import { locationsService } from '../../../services/api/locations.service';
import { FairnessReport } from '../../../types/analytics.types';

interface FairnessDashboardProps {
  locationId?: string;
}

export const FairnessDashboard: React.FC<FairnessDashboardProps> = ({ locationId }) => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [threshold, setThreshold] = useState(35);
  const [report, setReport] = useState<FairnessReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState(locationId || '');

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      fetchReport();
    }
  }, [selectedLocation, dateRange, threshold]);

  const fetchLocations = async () => {
    try {
      const response = await locationsService.getLocations();
      setLocations(response.data || []);
      if (!selectedLocation && response.data?.length > 0) {
        setSelectedLocation(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const fetchReport = async () => {
    if (!selectedLocation) return;
    
    setIsLoading(true);
    try {
      const data = await analyticsService.getFairnessReport({
        locationId: selectedLocation,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        threshold,
      });
      setReport(data);
    } catch (error) {
      console.error('Failed to fetch fairness report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const blob = await analyticsService.exportReport('fairness', {
        locationId: selectedLocation,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        threshold,
      }, format);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fairness-report-${dateRange.startDate}-to-${dateRange.endDate}.${format}`;
      a.click();
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const locationOptions = locations.map(loc => ({
    value: loc.id,
    label: loc.name,
  }));

  const getGiniDescription = (gini: number) => {
    if (gini < 0.2) return 'Very Equal';
    if (gini < 0.3) return 'Fairly Equal';
    if (gini < 0.4) return 'Moderate Inequality';
    if (gini < 0.5) return 'High Inequality';
    return 'Severe Inequality';
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Location"
            value={locationOptions.find(opt => opt.value === selectedLocation) || null}
            onChange={(opt) => setSelectedLocation(opt?.value || '')}
            options={locationOptions}
            placeholder="Select location"
          />
          
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-gray-500 self-center">to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Overtime Threshold
            </label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value))}
              min="1"
              max="168"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <p className="text-sm text-gray-500">Total Staff</p>
              <p className="text-2xl font-bold text-gray-900">{report.summary.totalStaff}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500">Average Hours</p>
              <p className="text-2xl font-bold text-gray-900">{report.summary.averageHours.toFixed(1)}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500">Median Hours</p>
              <p className="text-2xl font-bold text-gray-900">{report.summary.medianHours.toFixed(1)}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500">Std Deviation</p>
              <p className="text-2xl font-bold text-gray-900">{report.summary.stdDevHours.toFixed(1)}</p>
            </Card>
          </div>

          {/* Gini Coefficient */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Fairness Score</h3>
                <p className="text-sm text-gray-500">Gini Coefficient</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary-500">
                  {report.summary.giniCoefficient.toFixed(3)}
                </p>
                <p className="text-sm text-gray-500">{getGiniDescription(report.summary.giniCoefficient)}</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-primary-500 h-2.5 rounded-full"
                style={{ width: `${report.summary.giniCoefficient * 100}%` }}
              ></div>
            </div>
          </Card>

          {/* Distribution Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Hours Distribution</h3>
              <BarChart
                labels={report.distribution.labels}
                datasets={[
                  {
                    label: 'Number of Employees',
                    data: report.distribution.data,
                    backgroundColor: 'rgba(46, 107, 62, 0.7)',
                  },
                ]}
                height={300}
              />
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Premium Shift Distribution</h3>
              <PieChart
                labels={report.premiumShiftDistribution.slice(0, 5).map(p => p.staffName)}
                data={report.premiumShiftDistribution.slice(0, 5).map(p => p.premiumShifts)}
                title="Top 5 Premium Shift Recipients"
                height={300}
              />
            </Card>
          </div>

          {/* Under/Over Scheduled */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Most Under-Scheduled</h3>
              <div className="space-y-3">
                {report.summary.mostUnderScheduled.map((staff) => (
                  <div key={staff.userId} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">{staff.userName}</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-500">{staff.totalHours.toFixed(1)} hrs</span>
                      <span className="text-sm text-red-500">
                        {staff.hoursVariance > 0 ? '+' : ''}{staff.hoursVariance.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Most Over-Scheduled</h3>
              <div className="space-y-3">
                {report.summary.mostOverScheduled.map((staff) => (
                  <div key={staff.userId} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">{staff.userName}</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-500">{staff.totalHours.toFixed(1)} hrs</span>
                      <span className="text-sm text-green-500">
                        +{staff.hoursVariance.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Recommendations</h3>
              <div className="space-x-2">
                <Button size="sm" variant="outline" onClick={() => handleExport('json')}>
                  Export JSON
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExport('csv')}>
                  Export CSV
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {report.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-primary-500 text-lg">•</span>
                  <p className="text-sm text-gray-700">{rec}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      )}
    </div>
  );
};