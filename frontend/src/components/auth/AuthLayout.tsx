// frontend/src/components/auth/AuthLayout.tsx
import React from 'react';
import { Card } from '../common/Card';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-500">ShiftSync</h1>
          <p className="text-gray-600 mt-2">Multi-Location Staff Scheduling</p>
        </div>
        <Card>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
          {subtitle && <p className="text-gray-600 mb-6">{subtitle}</p>}
          {children}
        </Card>
      </div>
    </div>
  );
};