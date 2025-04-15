import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Loading...' 
}) => {
  return (
    <div className="loading-spinner">
      <div className={`spinner spinner-${size}`}></div>
      {text && <div className="spinner-text">{text}</div>}
    </div>
  );
};

export default LoadingSpinner; 