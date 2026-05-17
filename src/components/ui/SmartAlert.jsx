import React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle, Loader2, X } from 'lucide-react';

const TYPES = {
  success: { icon: CheckCircle2, color: '#00D99A', rgb: '0,217,154',   label: 'Sucesso' },
  warning: { icon: AlertTriangle, color: '#E87D00', rgb: '232,125,0',  label: 'Atenção' },
  error:   { icon: XCircle,      color: '#FC5252', rgb: '252,82,82',   label: 'Erro' },
  info:    { icon: Info,         color: '#14B8D4', rgb: '20,184,212',  label: 'Info' },
  loading: { icon: Loader2,      color: '#6D56E8', rgb: '109,86,232',  label: 'Carregando' },
};

export default function SmartAlert({ type = 'info', title, description, onClose, compact = false }) {
  const cfg = TYPES[type] || TYPES.info;
  const Icon = cfg.icon;

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl transition-all duration-300 ${compact ? 'px-3 py-2.5' : 'px-4 py-3.5'}`}
      style={{
        background: `rgba(${cfg.rgb},0.07)`,
        border: `1px solid rgba(${cfg.rgb},0.22)`,
        boxShadow: `0 4px 16px rgba(${cfg.rgb},0.06)`,
      }}
    >
      <div className={`flex items-center justify-center shrink-0 rounded-xl ${compact ? 'w-6 h-6' : 'w-7 h-7'}`}
        style={{ background: `rgba(${cfg.rgb},0.14)`, border: `1px solid rgba(${cfg.rgb},0.28)` }}>
        <Icon className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}
          style={{ color: cfg.color, animation: type === 'loading' ? 'spin 1s linear infinite' : 'none' }} />
      </div>
      <div className="flex-1 min-w-0">
        {title && <p className={`font-bold ${compact ? 'text-[11px]' : 'text-xs'}`} style={{ color: cfg.color }}>{title}</p>}
        {description && <p className={`mt-0.5 ${compact ? 'text-[10px]' : 'text-[11px]'}`} style={{ color: 'rgba(255,255,255,0.5)' }}>{description}</p>}
      </div>
      {onClose && (
        <button onClick={onClose} className="shrink-0 p-0.5 rounded-lg transition-all"
          style={{ color: 'rgba(255,255,255,0.3)' }}
          onMouseEnter={e => e.currentTarget.style.color = cfg.color}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}