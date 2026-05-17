import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * FloatingPanel — painel lateral deslizante
 * Props: open, onClose, title, subtitle, icon, side ('right'|'left'), width, children, footer
 */
export default function FloatingPanel({ open, onClose, title, subtitle, icon: Icon, side = 'right', width = 480, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[100]"
          style={{ background: 'rgba(1,3,12,0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className="fixed top-0 bottom-0 z-[110] flex flex-col"
        style={{
          [side]: 0,
          width: `min(${width}px, 100vw)`,
          background: 'linear-gradient(160deg, rgba(8,14,30,0.99) 0%, rgba(5,10,22,0.99) 100%)',
          borderLeft: side === 'right' ? '1px solid rgba(20,184,212,0.18)' : 'none',
          borderRight: side === 'left' ? '1px solid rgba(20,184,212,0.18)' : 'none',
          boxShadow: side === 'right' ? '-8px 0 48px rgba(0,0,0,0.8)' : '8px 0 48px rgba(0,0,0,0.8)',
          transform: open ? 'translateX(0)' : `translateX(${side === 'right' ? '100%' : '-100%'})`,
          transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(20,184,212,0.45), rgba(109,86,232,0.25), transparent)' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(20,184,212,0.10)', border: '1px solid rgba(20,184,212,0.22)' }}>
                <Icon className="w-4 h-4" style={{ color: '#14B8D4' }} />
              </div>
            )}
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">{title}</h2>
              {subtitle && <p className="text-[11px] mt-0.5 font-medium" style={{ color: '#718096' }}>{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#718096' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(252,82,82,0.10)'; e.currentTarget.style.color = '#FC5252'; e.currentTarget.style.borderColor = 'rgba(252,82,82,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#718096'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 px-5 py-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(5,10,22,0.8)' }}>
            {footer}
          </div>
        )}
      </div>
    </>
  );
}