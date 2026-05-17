import React, { useRef, useState, memo } from 'react';

const COLOR_MAP = {
  blue:    { glow: 'rgba(20,184,212,0.30)',  border: 'rgba(20,184,212,0.22)',  text: '#14B8D4', bg: 'rgba(20,184,212,0.07)',   rgb: '20,184,212'  },
  green:   { glow: 'rgba(0,217,154,0.30)',   border: 'rgba(0,217,154,0.22)',   text: '#00D99A', bg: 'rgba(0,217,154,0.07)',    rgb: '0,217,154'   },
  purple:  { glow: 'rgba(109,86,232,0.30)',  border: 'rgba(109,86,232,0.22)',  text: '#6D56E8', bg: 'rgba(109,86,232,0.07)',   rgb: '109,86,232'  },
  orange:  { glow: 'rgba(232,125,0,0.30)',   border: 'rgba(232,125,0,0.22)',   text: '#E87D00', bg: 'rgba(232,125,0,0.07)',    rgb: '232,125,0'   },
  red:     { glow: 'rgba(220,55,55,0.30)',   border: 'rgba(220,55,55,0.22)',   text: '#DC3737', bg: 'rgba(220,55,55,0.07)',    rgb: '220,55,55'   },
  // aliases used by Dashboard
  primary: { glow: 'rgba(20,184,212,0.30)',  border: 'rgba(20,184,212,0.22)',  text: '#14B8D4', bg: 'rgba(20,184,212,0.07)',   rgb: '20,184,212'  },
  accent:  { glow: 'rgba(0,217,154,0.30)',   border: 'rgba(0,217,154,0.22)',   text: '#00D99A', bg: 'rgba(0,217,154,0.07)',    rgb: '0,217,154'   },
  success: { glow: 'rgba(0,217,154,0.30)',   border: 'rgba(0,217,154,0.22)',   text: '#00D99A', bg: 'rgba(0,217,154,0.07)',    rgb: '0,217,154'   },
  warning: { glow: 'rgba(232,125,0,0.30)',   border: 'rgba(232,125,0,0.22)',   text: '#E87D00', bg: 'rgba(232,125,0,0.07)',    rgb: '232,125,0'   },
  danger:  { glow: 'rgba(220,55,55,0.30)',   border: 'rgba(220,55,55,0.22)',   text: '#DC3737', bg: 'rgba(220,55,55,0.07)',    rgb: '220,55,55'   },
};

function KPICard({ title, value, subtitle, icon: Icon, color = 'blue', trend, trendValue }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  const [hovered, setHovered] = useState(false);
  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMouse({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div
      ref={cardRef}
      className="relative rounded-2xl p-5 overflow-hidden cursor-default fade-in-up"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMouse({ x: 50, y: 50 }); }}
      onMouseMove={handleMouseMove}
      style={{
        background: `linear-gradient(145deg, ${c.bg} 0%, rgba(8,14,28,0.96) 60%, rgba(4,8,18,0.99) 100%)`,
        border: `1px solid ${hovered ? c.border : 'rgba(255,255,255,0.07)'}`,
        boxShadow: hovered
          ? `0 20px 56px ${c.glow}, 0 0 0 1px ${c.border}, 0 4px 16px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.07)`
          : `0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`,
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        transform: hovered ? 'translateY(-5px) scale(1.012)' : 'translateY(0) scale(1)',
        transition: 'transform 0.32s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease, border-color 0.25s ease',
      }}
    >
      {/* Dynamic mouse light */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background: hovered
            ? `radial-gradient(circle at ${mouse.x}% ${mouse.y}%, rgba(${c.rgb},0.10) 0%, transparent 65%)`
            : 'none',
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* Ambient glow orb top-right */}
      <div
        className="absolute top-0 right-0 w-36 h-36 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${c.glow} 0%, transparent 68%)`,
          opacity: hovered ? 0.55 : 0.18,
          transform: 'translate(42%, -42%)',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Pulsing neon border ring on hover */}
      {hovered && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            border: `1px solid rgba(${c.rgb},0.18)`,
            boxShadow: `inset 0 0 18px rgba(${c.rgb},0.05)`,
            animation: 'neonPulse 1.8s ease-in-out infinite',
          }}
        />
      )}

      {/* Bottom shimmer line */}
      <div
        className="absolute bottom-0 left-4 right-4 h-px pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(${c.rgb},0.45), transparent)`,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Content */}
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p
            className="text-[11px] font-semibold mb-2 uppercase tracking-widest leading-tight"
            style={{ color: hovered ? '#C0CCDD' : '#A0AEC0', transition: 'color 0.2s ease' }}
          >
            {title}
          </p>
          <p
            className="text-2xl lg:text-3xl font-bold tracking-tight"
            style={{
              color: hovered ? '#FFFFFF' : '#F0F4F8',
              letterSpacing: '-0.02em',
              textShadow: hovered ? `0 0 18px rgba(${c.rgb},0.25)` : 'none',
              transition: 'text-shadow 0.3s ease, color 0.2s ease',
            }}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-xs mt-1.5 truncate font-medium" style={{ color: '#718096' }}>
              {subtitle}
            </p>
          )}
          {trend !== undefined && (
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-md"
                style={{
                  color: trend === 'up' ? '#00D99A' : trend === 'down' ? '#FC5252' : '#A0AEC0',
                  background: trend === 'up' ? 'rgba(0,217,154,0.10)' : trend === 'down' ? 'rgba(252,82,82,0.10)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${trend === 'up' ? 'rgba(0,217,154,0.22)' : trend === 'down' ? 'rgba(252,82,82,0.22)' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '●'} {trendValue}
              </span>
            </div>
          )}
        </div>

        {Icon && (
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(145deg, rgba(${c.rgb},0.12), rgba(255,255,255,0.02))`,
              border: `1px solid rgba(${c.rgb},${hovered ? '0.30' : '0.14'})`,
              boxShadow: hovered
                ? `0 0 22px rgba(${c.rgb},0.35), inset 0 1px 0 rgba(255,255,255,0.10)`
                : `0 0 8px rgba(${c.rgb},0.12)`,
              transform: hovered ? 'scale(1.08) rotate(-2deg)' : 'scale(1) rotate(0deg)',
              transition: 'all 0.32s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          >
            <Icon
              className="w-5 h-5"
              style={{
                color: c.text,
                filter: hovered ? `drop-shadow(0 0 5px rgba(${c.rgb},0.7))` : 'none',
                transition: 'filter 0.3s ease',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(KPICard);