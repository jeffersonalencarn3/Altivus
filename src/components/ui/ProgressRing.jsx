import React from 'react';

/**
 * ProgressRing — circular progress indicator
 * Props: value (0-100), size, strokeWidth, color, label, sublabel, animate
 */

const COLOR_MAP = {
  blue:   '#14B8D4',
  green:  '#00D99A',
  purple: '#6D56E8',
  orange: '#E87D00',
  red:    '#FC5252',
};

export default function ProgressRing({
  value = 0,
  size = 80,
  strokeWidth = 6,
  color = 'blue',
  label,
  sublabel,
  animate = true,
}) {
  const hex = COLOR_MAP[color] || color;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, value)) / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={hex}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{
              filter: `drop-shadow(0 0 4px ${hex}80)`,
              transition: animate ? 'stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)' : 'none',
            }}
          />
        </svg>
        {/* Center label */}
        <div className="absolute flex flex-col items-center">
          <span className="text-sm font-black text-white leading-none">{value}%</span>
        </div>
      </div>
      {label && <p className="text-[10px] font-bold text-white/60 text-center">{label}</p>}
      {sublabel && <p className="text-[9px] text-white/35 text-center">{sublabel}</p>}
    </div>
  );
}