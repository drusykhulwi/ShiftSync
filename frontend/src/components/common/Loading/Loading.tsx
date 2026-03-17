import React from 'react';
import { Spinner } from './Spinner';

interface LoadingProps {
  fullScreen?: boolean;
  text?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  fullScreen = false,
  text = 'Loading...',
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <Spinner size="lg" />
      {text && <p className="text-gray-500">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};