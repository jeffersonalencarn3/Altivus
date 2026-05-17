import React, { memo } from 'react';

function PageHeader({ title, subtitle, children, accent = '#14B8D4' }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 fade-in-up">
      <div className="relative pb-2">
        <h1
          className="text-xl lg:text-2xl font-black tracking-tight"
          style={{
            background: `linear-gradient(135deg, #FFFFFF 15%, ${accent} 70%, #6D56E8 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs mt-1 font-medium" style={{ color: '#718096' }}>
            {subtitle}
          </p>
        )}
        <div
          className="absolute bottom-0 left-0 h-0.5 w-14 rounded-full"
          style={{ background: `linear-gradient(90deg, ${accent}, rgba(109,86,232,0.4), transparent)` }}
        />
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-wrap">{children}</div>
      )}
    </div>
  );
}

export default memo(PageHeader);