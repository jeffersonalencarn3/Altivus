import React from 'react';

/**
 * MetricCard — card de métrica compacta com trend indicator
 * Props: label, value, subtitle, icon, color, trend ('up'|'down'|'neutral'), trendValue, onClick
 */

const COLOR_MAP = {
  blue:    { hex: '#14B8D4', rgb: '20,184,212' },
  green:   { hex: '#00D99A', rgb: '0,217,154' },
  purple:  { hex: '#6D56E8', rgb: '109,86,232' },
  orange:  { hex: '#E87D00', rgb: '232,125,0' },
  red:     { hex: '#FC5252', rgb: '252,82,82' },
  primary: { hex: '#14B8D4', rgb: '20,184,212' },
  accent:  { hex: '#00D99A', rgb: '0,217,154' },
  success: { hex: '#00D99A', rgb: '0,217,154' },
  warning: { hex: '#E87D00', rgb: '232,125,0' },
  danger:  { hex: '#FC5252', rgb: '252,82,82' },
};

export default function MetricCard({ label, value, subtitle, icon: Icon, color = 'blue', trend, trendValue, onClick }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;

  return (
    <div
      className="relative rounded-2xl p-4 overflow-hidden transition-all duration-250 group"
      style={{
        background: `linear-gradient(145deg, rgba(${c.rgb},0.07) 0%, rgba(8,14,28,0.96) 60%)`,
        border: `1px solid rgba(${c.rgb},0.18)`,
        boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(${c.rgb},0.04)`,
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
      onMouseEnter={e => {
        if (!onClick) return;
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = `0 12px 36px rgba(${c.rgb},0.14), 0 4px 16px rgba(0,0,0,0.5)`;
        e.currentTarget.style.borderColor = `rgba(${c.rgb},0.30)`;
      }}
      onMouseLeave={e => {
        if (!onClick) return;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(${c.rgb},0.04)`;
        e.currentTarget.style.borderColor = `rgba(${c.rgb},0.18)`;
      }}
    >
      {/* Ambient orb */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, rgba(${c.rgb},0.18) 0%, transparent 70%)`,
          transform: 'translate(30%, -30%)',
        }} />
      {/* Top edge */}
      <div className="absolute top-0 left-4 right-4 h-px pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, rgba(${c.rgb},0.35), transparent)` }} />

      <div className="relative flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
          <p className="text-2xl font-black tracking-tight text-white leading-none">{value}</p>
          {subtitle && <p className="text-[11px] mt-1.5 truncate font-medium" style={{ color: '#718096' }}>{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                style={{
                  color: trend === 'up' ? '#00D99A' : trend === 'down' ? '#FC5252' : '#718096',
                  background: trend === 'up' ? 'rgba(0,217,154,0.10)' : trend === 'down' ? 'rgba(252,82,82,0.10)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${trend === 'up' ? 'rgba(0,217,154,0.22)' : trend === 'down' ? 'rgba(252,82,82,0.22)' : 'rgba(255,255,255,0.08)'}`,
                }}>
                {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '●'} {trendValue}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: `rgba(${c.rgb},0.12)`,
              border: `1px solid rgba(${c.rgb},0.25)`,
              boxShadow: `0 0 16px rgba(${c.rgb},0.15)`,
            }}>
            <Icon className="w-5 h-5" style={{ color: c.hex }} />
          </div>
        )}
      </div>
    </div>
  );
}