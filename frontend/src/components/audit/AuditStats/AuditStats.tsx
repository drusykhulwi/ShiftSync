// frontend/src/components/audit/AuditStats/AuditStats.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { auditService } from '../../../services/api/audit.service';
import { AuditStats as IAuditStats } from '../../../types/audit.types';
import { BarChart } from '../../analytics/charts/BarChart';
import { LineChart } from '../../analytics/charts/LineChart';
import { format, subDays } from 'date-fns';

export const AuditStats: React.FC = () => {
  const [stats, setStats] = useState<IAuditStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await auditService.getAuditStats(dateRange.startDate, dateRange.endDate);
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch audit stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = (days: number) => {
    setDateRange({
      startDate: format(subDays(new Date(), days), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  return (
    <div className="space-y-6">
      {/* Date Range Quick Select */}
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Date Range</h3>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => handleDateRangeChange(7)}>
              7 Days
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleDateRangeChange(30)}>
              30 Days
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleDateRangeChange(90)}>
              90 Days
            </Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : stats && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <p className="text-sm text-gray-500">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLogs}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500">Average Per Day</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averagePerDay.toFixed(1)}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500">Unique Actors</p>
              <p className="text-2xl font-bold text-gray-900">{stats.topActors.length}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500">Date Range</p>
              <p className="text-sm font-medium text-gray-900">
                {format(new Date(stats.dateRange.startDate), 'MMM d')} - {format(new Date(stats.dateRange.endDate), 'MMM d, yyyy')}
              </p>
            </Card>
          </div>

          {/* Daily Activity Chart */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Activity</h3>
            <LineChart
              labels={Object.keys(stats.dailyCounts)}
              datasets={[
                {
                  label: 'Number of Actions',
                  data: Object.values(stats.dailyCounts),
                  borderColor: 'rgb(46, 107, 62)',
                  backgroundColor: 'rgba(46, 107, 62, 0.1)',
                  fill: true,
                },
              ]}
              height={300}
            />
          </Card>

          {/* Action Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Actions by Type</h3>
              <BarChart
                labels={Object.keys(stats.actionCounts)}
                datasets={[
                  {
                    label: 'Count',
                    data: Object.values(stats.actionCounts),
                    backgroundColor: 'rgba(46, 107, 62, 0.7)',
                  },
                ]}
                height={300}
              />
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Actions by Entity</h3>
              <BarChart
                labels={Object.keys(stats.entityCounts)}
                datasets={[
                  {
                    label: 'Count',
                    data: Object.values(stats.entityCounts),
                    backgroundColor: 'rgba(10, 35, 81, 0.7)',
                  },
                ]}
                height={300}
              />
            </Card>
          </div>

          {/* Top Actors */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Actors</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actor ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action Count</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.topActors.map((actor) => (
                    <tr key={actor.actorId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {actor.actorId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {actor.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};