import React from 'react';
import Skeleton from './Skeleton';

const EstablishmentSkeleton = () => {
  return (
    <div className="card establishment-card skeleton-card">
      <Skeleton height="140px" borderRadius="var(--radius-lg) var(--radius-lg) 0 0" />
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton height="22px" width="60%" />
          <Skeleton height="18px" width="40px" borderRadius="var(--radius-full)" />
        </div>
        <Skeleton height="14px" width="100%" />
        <Skeleton height="14px" width="80%" />
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <Skeleton height="16px" width="50px" />
          <Skeleton height="16px" width="50px" />
          <Skeleton height="16px" width="50px" />
        </div>
      </div>
    </div>
  );
};

export default EstablishmentSkeleton;
