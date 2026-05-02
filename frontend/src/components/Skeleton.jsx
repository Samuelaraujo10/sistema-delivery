import React from 'react';

const Skeleton = ({ width, height, borderRadius = 'var(--radius)', className = '' }) => {
  return (
    <div 
      className={`skeleton ${className}`} 
      style={{ 
        width: width || '100%', 
        height: height || '20px', 
        borderRadius 
      }} 
    />
  );
};

export default Skeleton;
