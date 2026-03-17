// frontend/src/components/common/Card/Card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-lg p-6 ${className} ${onClick ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};