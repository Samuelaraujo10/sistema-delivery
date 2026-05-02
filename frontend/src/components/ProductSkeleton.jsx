import React from 'react';
import Skeleton from './Skeleton';

const ProductSkeleton = () => {
  return (
    <div className="product-card skeleton-card">
      <Skeleton height="160px" borderRadius="var(--radius-lg) var(--radius-lg) 0 0" />
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Skeleton height="20px" width="70%" />
        <Skeleton height="14px" width="100%" />
        <Skeleton height="14px" width="90%" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
          <Skeleton height="24px" width="60px" />
          <Skeleton height="32px" width="32px" borderRadius="var(--radius)" />
        </div>
      </div>
    </div>
  );
};

export default ProductSkeleton;
