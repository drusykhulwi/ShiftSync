// frontend/src/components/analytics/charts/PieChart.tsx
import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
  labels: string[];
  data: number[];
  backgroundColor?: string[];
  title?: string;
  height?: number;
}

export const PieChart: React.FC<PieChartProps> = ({
  labels,
  data,
  backgroundColor,
  title,
  height = 300
}) => {
  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: !!title,
        text: title,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw as number;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: backgroundColor || [
          'rgba(46, 107, 62, 0.8)',
          'rgba(10, 35, 81, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 99, 132, 0.8)',
        ],
        borderColor: 'white',
        borderWidth: 2,
      },
    ],
  };

  return (
    <div style={{ height }}>
      <Pie options={options} data={chartData} />
    </div>
  );
};