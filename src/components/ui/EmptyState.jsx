import React from 'react';
import { Button } from '@/components/ui/button';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  size = 'md',
}) {
  const sizes = {
    sm: { py: 'py-10', iconW: 'w-8 h-8', title: 'text-sm', desc: 'text-xs', iconBox: 'w-14 h-14' },
    md: { py: 'py-16', iconW: 'w-10 h-10', title: 'text-base', desc: 'text-sm', iconBox: 'w-18 h-18' },
    lg: { py: 'py-24', iconW: 'w-12 h-12', title: 'text-lg', desc: 'text-sm', iconBox: 'w-20 h-20' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex flex-col items-center justify-center ${s.py} text-center`}>
      {Icon && (
        <div
          className={`flex items-center justify-center rounded-2xl mb-5 ${s.iconBox}`}
          style={{
            width: size === 'lg' ? 80 : size === 'sm' ? 56 : 68,
            height: size === 'lg' ? 80 : size === 'sm' ? 56 : 68,
            background: 'linear-gradient(145deg, rgba(20,184,212,0.06), rgba(109,86,232,0.06))',
            border: '1px solid rgba(20,184,212,0.12)',
            boxShadow: '0 0 24px rgba(20,184,212,0.06)',
          }}
        >
          <Icon className={`${s.iconW} opacity-30`} style={{ color: '#14B8D4' }} />
        </div>
      )}
      <p className={`font-semibold text-white/60 mb-2 ${s.title}`}>{title}</p>
      {description && (
        <p className={`text-white/30 max-w-xs leading-relaxed ${s.desc}`}>{description}</p>
      )}
      {actionLabel && onAction && (
        <Button className="mt-5 gap-2" onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}