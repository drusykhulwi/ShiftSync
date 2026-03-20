import React from 'react';
import { Card } from '../common/Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  subtitle?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  subtitle,
}) => {
  const isPositive = change?.startsWith('+');
  const isNegative = change?.startsWith('-');

  return (
    <Card>
      <div className="min-w-0">
        <h3 className="text-sm font-medium text-gray-500 mb-1 truncate">{title}</h3>
        <div className="flex items-end justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{value}</p>
            {subtitle && (
              <p className="text-sm sm:text-sm text-gray-500 mt-1 truncate">{subtitle}</p>
            )}
          </div>
          {change && (
            <span
              className={`text-sm sm:text-sm font-medium flex-shrink-0 ml-2 ${
                isPositive
                  ? 'text-green-600'
                  : isNegative
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}
            >
              {change}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};