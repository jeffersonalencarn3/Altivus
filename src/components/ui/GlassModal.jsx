import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * GlassModal — modal glassmorphism premium
 * Props: open, onClose, title, subtitle, icon, width, children
 */
export default function GlassModal({ open, onClose, title, subtitle, icon: Icon, width = 520, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(1,3,12,0.82)', backdropFilter: 'blur(18px) saturate(180%)', WebkitBackdropFilter: 'blur(18px) saturate(180%)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div
        className="relative w-full flex flex-col max-h-[92vh] rounded-2xl overflow-hidden"
        style={{
          maxWidth: width,
          background: 'linear-gradient(145deg, rgba(10,16,32,0.98) 0%, rgba(6,10,22,0.99) 100%)',
          border: '1px solid rgba(20,184,212,0.2)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 60px rgba(20,184,212,0.08), 0 32px 80px rgba(0,0,0,0.85)',
        }}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(20,184,212,0.5), rgba(109,86,232,0.3), transparent)' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(20,184,212,0.10)', border: '1px solid rgba(20,184,212,0.22)' }}>
                <Icon className="w-4.5 h-4.5" style={{ color: '#14B8D4' }} />
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
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(5,10,22,0.8)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}