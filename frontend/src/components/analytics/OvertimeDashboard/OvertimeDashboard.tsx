// frontend/src/components/analytics/OvertimeDashboard/OvertimeDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '../../common/Card';
import { BarChart } from '../charts/BarChart';
import { LineChart } from '../charts/LineChart';
import { DatePicker } from '../../common/DatePicker/DatePicker';
import { Select } from '../../common/Select';
import { Button } from '../../common/Button';
import { analyticsService } from '../../../services/api/analytics.service';
import { locationsService } from '../../../services/api/locations.service';
import { OvertimeReport } from '../../../types/analytics.types';

interface OvertimeDashboardProps {
  locationId?: string;
}

export const OvertimeDashboard: React.FC<OvertimeDashboardProps> = ({ locationId }) => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
  });
  const [groupBy, setGroupBy] = useState<'DAY' | 'WEEK' | 'MONTH'>('WEEK');
  const [report, setReport] = useState<OvertimeReport | null>(null);
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
  }, [selectedLocation, dateRange, groupBy]);

  const fetchLocations = async () => {
    try {
      const response = await locationsService.getLocations();
      const locationList = (response as any).data?.data || (response as any).data || [];
      setLocations(locationList);
      if (!selectedLocation && locationList.length > 0) {
        const firstId = locationList[0].id;
        setSelectedLocation(firstId);
        // Fetch report immediately with the known ID
        await fetchReportForLocation(firstId);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  // Rename fetchReport to accept locationId param:
  const fetchReportForLocation = async (locId: string) => {
    console.log('Fetching report for locationId:', locId);
    if (!locId) return;
    setIsLoading(true);
    try {
      const data = await analyticsService.getOvertimeReport({
      ...(locId ? { locationId: locId } : {}),
        startDate: new Date(dateRange.startDate).toISOString(),
        endDate: new Date(dateRange.endDate).toISOString(),
        groupBy,
      });
      setReport((data as any).data?.data || (data as any).data || data);
    } catch (error) {
      console.error('Failed to fetch overtime report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Keep fetchReport for manual refetch triggered by filter changes:
  const fetchReport = async () => {
    if (!selectedLocation) return;
    await fetchReportForLocation(selectedLocation);
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const blob = await analyticsService.exportReport('overtime', {
        locationId: selectedLocation,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        groupBy,
      }, format);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `overtime-report-${dateRange.startDate}-to-${dateRange.endDate}.${format}`;
      a.click();
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const locationOptions = locations.map(loc => ({
    value: loc.id,
    label: loc.name,
  }));

  const groupByOptions = [
    { value: 'DAY', label: 'Daily' },
    { value: 'WEEK', label: 'Weekly' },
    { value: 'MONTH', label: 'Monthly' },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Location"
            value={locationOptions.find(opt => opt.value === selectedLocation) || locationOptions[0]}
            onChange={(opt) => setSelectedLocation(opt?.value as string || '')}
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
                value={dateRange.startDate.split('T')[0]}
                onChange={(e) => setDateRange(prev => ({
                  ...prev,
                  startDate: new Date(e.target.value).toISOString()
                }))}
              />
              <span className="text-gray-500 self-center">to</span>
              <input
                type="date"
                value={dateRange.endDate.split('T')[0]}
                onChange={(e) => setDateRange(prev => ({
                  ...prev,
                  endDate: new Date(e.target.value).toISOString()
                }))}
              />
            </div>
          </div>

          <Select
            label="Group By"
            value={groupByOptions.find(opt => opt.value === groupBy) || groupByOptions[0]}
            onChange={(opt) => setGroupBy(opt?.value as 'DAY' | 'WEEK' | 'MONTH')}
            options={groupByOptions}
          />
        </div>
      </Card>

      {/* Summary Cards */}
      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <p className="text-sm text-gray-500">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{report.summary.totalEmployees}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500">Employees with Overtime</p>
              <p className="text-2xl font-bold text-gray-900">{report.summary.employeesWithOvertime}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500">Total Overtime Hours</p>
              <p className="text-2xl font-bold text-gray-900">{report.summary.totalOvertimeHours.toFixed(1)}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500">Overtime Cost</p>
              <p className="text-2xl font-bold text-gray-900">${report.summary.totalOvertimeCost.toLocaleString()}</p>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Hours Distribution</h3>
              <BarChart
                labels={report.chartData.labels}
                datasets={[
                  {
                    label: 'Regular Hours',
                    data: report.chartData.datasets.regular,
                    backgroundColor: 'rgba(46, 107, 62, 0.7)',
                  },
                  {
                    label: 'Overtime Hours',
                    data: report.chartData.datasets.overtime,
                    backgroundColor: 'rgba(10, 35, 81, 0.7)',
                  },
                ]}
                height={300}
              />
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Overtime Trend</h3>
              <LineChart
                labels={report.chartData.labels}
                datasets={[
                  {
                    label: 'Overtime Hours',
                    data: report.chartData.datasets.overtime,
                    borderColor: 'rgb(10, 35, 81)',
                    backgroundColor: 'rgba(10, 35, 81, 0.1)',
                    fill: true,
                  },
                ]}
                height={300}
              />
            </Card>
          </div>

          {/* Projections */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Cost Projections</h3>
              <div className="space-x-2">
                <Button size="sm" variant="outline" onClick={() => handleExport('json')}>
                  Export JSON
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExport('csv')}>
                  Export CSV
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Current Cost</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${report.summary.totalOvertimeCost.toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Projected Cost</p>
                <p className="text-2xl font-bold text-primary-500">
                  ${report.summary.projectedOvertimeCost.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          {/* Top Employees */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Overtime Employees</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Regular</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overtime</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {report.details
                    .sort((a, b) => b.overtimeHours - a.overtimeHours)
                    .slice(0, 5)
                    .map((employee) => (
                      <tr key={employee.userId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {employee.userName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {employee.totalHours.toFixed(1)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {employee.regularHours.toFixed(1)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {employee.overtimeHours.toFixed(1)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${employee.overtimeCost.toFixed(0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            employee.riskLevel === 'HIGH' ? 'bg-red-100 text-red-800' :
                            employee.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {employee.riskLevel}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
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