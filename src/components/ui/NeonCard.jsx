import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * NeonCard — glassmorphism card com spotlight effect
 * Props:
 *  - glow: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'none'
 *  - hover: boolean (enable hover lift)
 *  - onClick: handler
 *  - className, style
 */

const GLOW_MAP = {
  blue:   { rgb: '20,184,212',   hex: '#14B8D4' },
  purple: { rgb: '109,86,232',   hex: '#6D56E8' },
  green:  { rgb: '0,217,154',    hex: '#00D99A' },
  orange: { rgb: '232,125,0',    hex: '#E87D00' },
  red:    { rgb: '252,82,82',    hex: '#FC5252' },
  none:   { rgb: '255,255,255',  hex: 'rgba(255,255,255,0.05)' },
};

export default function NeonCard({ children, glow = 'none', hover = true, onClick, className = '', style = {}, padding = true }) {
  const g = GLOW_MAP[glow] || GLOW_MAP.none;
  const [hovered, setHovered] = useState(false);
  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  const ref = useRef(null);

  const handleMouseMove = (e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setMouse({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  };

  const isInteractive = hover || !!onClick;

  return (
    <div
      ref={ref}
      onClick={onClick}
      onMouseEnter={() => isInteractive && setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMouse({ x: 50, y: 50 }); }}
      onMouseMove={isInteractive ? handleMouseMove : undefined}
      className={cn('relative rounded-2xl overflow-hidden', className)}
      style={{
        background: 'linear-gradient(145deg, rgba(10,16,32,0.92), rgba(6,10,22,0.96))',
        border: `1px solid ${hovered && glow !== 'none' ? `rgba(${g.rgb},0.25)` : 'rgba(255,255,255,0.07)'}`,
        boxShadow: hovered && glow !== 'none'
          ? `0 12px 40px rgba(${g.rgb},0.12), 0 4px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(${g.rgb},0.08)`
          : '0 4px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.03)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        transform: hovered && hover ? 'translateY(-3px) scale(1.004)' : 'translateY(0) scale(1)',
        transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease, border-color 0.2s ease',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {/* Mouse spotlight */}
      {hovered && glow !== 'none' && (
        <div className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{
            background: `radial-gradient(circle at ${mouse.x}% ${mouse.y}%, rgba(${g.rgb},0.08) 0%, transparent 60%)`,
          }} />
      )}
      {/* Top edge glow */}
      {glow !== 'none' && (
        <div className="absolute top-0 left-4 right-4 h-px pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent, rgba(${g.rgb},${hovered ? '0.5' : '0.2'}), transparent)`, transition: 'opacity 0.3s ease' }} />
      )}
      <div className={padding ? 'p-4 lg:p-5' : ''}>
        {children}
      </div>
    </div>
  );
}