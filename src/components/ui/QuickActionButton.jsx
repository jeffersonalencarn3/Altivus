import React from 'react';

/**
 * QuickActionButton — botão de ação rápida com ícone e label
 * Props: icon, label, onClick, color, disabled, loading, variant ('solid'|'ghost'|'outline')
 */
export default function QuickActionButton({ icon: Icon, label, onClick, color = '#14B8D4', disabled = false, loading = false, variant = 'outline', className = '' }) {
  const rgb = color.replace('#', '');
  
  const styles = {
    solid: {
      background: `linear-gradient(135deg, ${color}CC, ${color}88)`,
      border: `1px solid ${color}60`,
      color: '#020B14',
      boxShadow: `0 0 14px ${color}30`,
    },
    ghost: {
      background: 'transparent',
      border: '1px solid transparent',
      color,
    },
    outline: {
      background: `${color}0D`,
      border: `1px solid ${color}28`,
      color,
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={styles[variant] || styles.outline}
      onMouseEnter={e => {
        if (disabled || loading) return;
        e.currentTarget.style.background = `${color}18`;
        e.currentTarget.style.borderColor = `${color}40`;
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = `0 4px 16px ${color}20`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = styles[variant]?.background || `${color}0D`;
        e.currentTarget.style.borderColor = styles[variant]?.border?.replace('1px solid ', '') || `${color}28`;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = styles[variant]?.boxShadow || 'none';
      }}
    >
      {loading ? (
        <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : Icon ? (
        <Icon className="w-3.5 h-3.5 shrink-0" />
      ) : null}
      {label && <span>{label}</span>}
    </button>
  );
}