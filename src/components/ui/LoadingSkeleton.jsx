import React from 'react';

export function SkeletonCard({ className = '' }) {
  return (
    <div
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(145deg, rgba(10,16,32,0.8), rgba(6,10,22,0.9))',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <SkeletonLine width="40%" height={10} />
            <SkeletonLine width="70%" height={14} />
          </div>
          <SkeletonBox size={44} rounded={12} />
        </div>
        <SkeletonLine width="55%" height={28} />
        <SkeletonLine width="35%" height={10} />
      </div>
    </div>
  );
}

export function SkeletonLine({ width = '100%', height = 12, className = '' }) {
  return (
    <div
      className={`rounded-full shimmer-line ${className}`}
      style={{ width, height, background: 'rgba(255,255,255,0.06)' }}
    />
  );
}

export function SkeletonBox({ size = 40, rounded = 8, className = '' }) {
  return (
    <div
      className={`shrink-0 shimmer-line ${className}`}
      style={{
        width: size, height: size,
        borderRadius: rounded,
        background: 'rgba(255,255,255,0.06)',
      }}
    />
  );
}

export function SkeletonKPI() {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'linear-gradient(145deg, rgba(10,16,32,0.8), rgba(6,10,22,0.9))',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <SkeletonLine width="60%" height={10} />
          <SkeletonLine width="45%" height={32} />
          <SkeletonLine width="35%" height={10} />
        </div>
        <SkeletonBox size={48} rounded={14} />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-2">
      {/* header */}
      <div className="flex gap-4 px-4 py-2">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={i} width={`${100 / cols}%`} height={10} />
        ))}
      </div>
      {/* rows */}
      {Array.from({ length: rows }).map((_, ri) => (
        <div
          key={ri}
          className="flex gap-4 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
        >
          {Array.from({ length: cols }).map((_, ci) => (
            <SkeletonLine key={ci} width={`${100 / cols}%`} height={12} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function LoadingSkeleton({ type = 'card', count = 4 }) {
  if (type === 'kpi') {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: count }).map((_, i) => <SkeletonKPI key={i} />)}
      </div>
    );
  }
  if (type === 'table') return <SkeletonTable rows={count} />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}