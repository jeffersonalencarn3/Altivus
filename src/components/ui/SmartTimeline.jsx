import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PlayCircle, StopCircle, Camera, Package, Users, AlertTriangle, TrendingUp } from 'lucide-react';

const EVENT_CONFIG = {
  checkin:    { icon: PlayCircle,  color: '#00D99A', label: 'Check-in' },
  checkout:   { icon: StopCircle, color: '#14B8D4', label: 'Check-out' },
  photo:      { icon: Camera,     color: '#6D56E8', label: 'Foto' },
  material:   { icon: Package,    color: '#E87D00', label: 'Material' },
  team:       { icon: Users,      color: '#14B8D4', label: 'Equipe' },
  alert:      { icon: AlertTriangle, color: '#FC5252', label: 'Alerta' },
  progress:   { icon: TrendingUp, color: '#00D99A', label: 'Progresso' },
};

/**
 * SmartTimeline — timeline operacional premium
 * Props: events: Array<{ type, title, description, timestamp, meta }>
 */
export default function SmartTimeline({ events = [], emptyMessage = 'Nenhum evento registrado.' }) {
  if (events.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-xs font-medium" style={{ color: '#4A5568' }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[18px] top-2 bottom-2 w-px"
        style={{ background: 'linear-gradient(180deg, rgba(20,184,212,0.3), rgba(20,184,212,0.05))' }} />

      <div className="space-y-4">
        {events.map((event, i) => {
          const cfg = EVENT_CONFIG[event.type] || EVENT_CONFIG.progress;
          const Icon = cfg.icon;

          return (
            <div key={i} className="flex items-start gap-3 relative">
              {/* Icon node */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 relative z-10"
                style={{
                  background: `rgba(${hexToRgb(cfg.color)},0.12)`,
                  border: `1px solid rgba(${hexToRgb(cfg.color)},0.28)`,
                  boxShadow: `0 0 10px rgba(${hexToRgb(cfg.color)},0.12)`,
                }}
              >
                <Icon className="w-4 h-4" style={{ color: cfg.color }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-bold text-white">{event.title || cfg.label}</p>
                  {event.timestamp && (
                    <span className="text-[10px] font-medium" style={{ color: '#4A5568' }}>
                      {format(new Date(event.timestamp), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </span>
                  )}
                </div>
                {event.description && (
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{event.description}</p>
                )}
                {event.meta && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {Object.entries(event.meta).map(([k, v]) => (
                      <span key={k} className="text-[10px] font-medium px-2 py-0.5 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#A0AEC0' }}>
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` : '20,184,212';
}