import React, { useState, useCallback, useEffect } from 'react';
import { useActivities } from '@/lib/useAppData';
import { Clock, CheckCircle2, AlertCircle, Loader2, ChevronRight, ChevronLeft, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PANEL_WIDTH = 280;
const LS_KEY = 'altivus_panel_open';

const STATUS_CONFIG = {
  completed:   { label: 'Concluída',    color: '#00D99A', icon: CheckCircle2,  glow: 'rgba(0,217,154,0.5)'   },
  in_progress: { label: 'Em Andamento', color: '#14B8D4', icon: Clock,         glow: 'rgba(20,184,212,0.5)'  },
  delayed:     { label: 'Atrasada',     color: '#FC5252', icon: AlertCircle,   glow: 'rgba(252,82,82,0.5)'   },
  not_started: { label: 'Não Iniciada', color: '#718096', icon: Clock,         glow: 'rgba(113,128,150,0.4)' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ptBR }); }
  catch { return ''; }
}

export default function RecentActivitiesPanel() {
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(LS_KEY) === 'true'; }
    catch { return false; }
  });
  const [panelOpen, setPanelOpen] = useState(false);

  // Oculta o toggle quando qualquer painel lateral está aberto (ex: ActivityDetailPanel)
  useEffect(() => {
    const handle = (e) => setPanelOpen(e.detail?.open ?? false);
    window.addEventListener('altivus:side_panel', handle);
    return () => window.removeEventListener('altivus:side_panel', handle);
  }, []);

  // Usa o hook compartilhado — dados já em cache, sem polling separado
  const { data: allActivities = [], isLoading: loading, refetch } = useActivities();
  // Últimas 10 por updated_date
  const activities = allActivities.slice().sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date)).slice(0, 10);

  const toggle = useCallback(() => {
    setOpen(prev => {
      const next = !prev;
      try { localStorage.setItem(LS_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  return (
    <>
      {/* ── Floating toggle tab — hidden when side panel is open ── */}
      <button
        onClick={toggle}
        className="fixed z-[45] flex flex-col items-center justify-center gap-1 transition-all duration-300"
        style={{
          display: panelOpen ? 'none' : undefined,
          right: open ? PANEL_WIDTH : 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 22,
          height: 72,
          borderRadius: '10px 0 0 10px',
          background: 'linear-gradient(180deg, rgba(8,14,30,0.95) 0%, rgba(5,10,22,0.98) 100%)',
          border: '1px solid rgba(20,184,212,0.25)',
          borderRight: 'none',
          boxShadow: open
            ? '-3px 0 16px rgba(20,184,212,0.18), inset 1px 0 0 rgba(20,184,212,0.10)'
            : '-3px 0 20px rgba(20,184,212,0.22), 0 0 12px rgba(20,184,212,0.10)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          cursor: 'pointer',
          transition: 'right 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '-4px 0 24px rgba(20,184,212,0.40), 0 0 18px rgba(20,184,212,0.16)';
          e.currentTarget.style.borderColor = 'rgba(20,184,212,0.55)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = open
            ? '-3px 0 16px rgba(20,184,212,0.18), inset 1px 0 0 rgba(20,184,212,0.10)'
            : '-3px 0 20px rgba(20,184,212,0.22), 0 0 12px rgba(20,184,212,0.10)';
          e.currentTarget.style.borderColor = 'rgba(20,184,212,0.25)';
        }}
        title={open ? 'Fechar painel' : 'Atividades recentes'}
      >
        <Activity className="w-3 h-3" style={{ color: '#14B8D4', filter: 'drop-shadow(0 0 4px rgba(20,184,212,0.7))' }} />
        {open
          ? <ChevronRight className="w-3 h-3" style={{ color: '#14B8D4' }} />
          : <ChevronLeft className="w-3 h-3" style={{ color: '#14B8D4' }} />
        }
      </button>

      {/* ── Slide panel ─────────────────────────────────────────── */}
      <aside
        className="fixed right-0 top-0 h-full z-[35] flex flex-col"
        style={{
          width: PANEL_WIDTH,
          transform: open ? 'translateX(0)' : `translateX(${PANEL_WIDTH}px)`,
          transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
          /* Glassmorphism */
          background: 'linear-gradient(160deg, rgba(8,14,30,0.78) 0%, rgba(5,10,22,0.88) 100%)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          /* Neon border */
          borderLeft: '1px solid rgba(20,184,212,0.22)',
          boxShadow: '-6px 0 40px rgba(0,0,0,0.7), -1px 0 0 rgba(20,184,212,0.08), inset 1px 0 0 rgba(255,255,255,0.04)',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        {/* Neon top edge */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(20,184,212,0.45), rgba(109,86,232,0.30), transparent)' }}
        />

        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid rgba(20,184,212,0.10)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: '#14B8D4', boxShadow: '0 0 8px #14B8D4' }}
            />
            <p className="text-xs font-bold tracking-wide uppercase" style={{ color: '#E2E8F0' }}>
              Atividades Recentes
            </p>
          </div>
          <button
            onClick={refetch}
            className="p-1.5 rounded-lg transition-all duration-200"
            style={{ color: '#718096' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#14B8D4'; e.currentTarget.style.background = 'rgba(20,184,212,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#718096'; e.currentTarget.style.background = 'transparent'; }}
            title="Atualizar"
          >
            <Loader2 className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto py-4 px-4">
          {loading && activities.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#14B8D4' }} />
            </div>
          ) : activities.length === 0 ? (
            <p className="text-xs text-center mt-8" style={{ color: '#4A5568' }}>Nenhuma atividade encontrada</p>
          ) : (
            <div className="relative">
              {/* Vertical neon line */}
              <div
                className="absolute left-3 top-2 bottom-2 w-px"
                style={{ background: 'linear-gradient(180deg, rgba(20,184,212,0.40), rgba(109,86,232,0.20), transparent)' }}
              />

              <div className="space-y-4">
                {activities.map((activity, idx) => {
                  const cfg = STATUS_CONFIG[activity.status] || STATUS_CONFIG.not_started;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={activity.id}
                      className="flex gap-3 items-start relative group"
                      style={{
                        animation: open ? `fadeInUp 0.3s cubic-bezier(0.16,1,0.3,1) ${idx * 0.045}s both` : 'none',
                      }}
                    >
                      {/* Icon dot */}
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-200"
                        style={{
                          background: `${cfg.color}14`,
                          border: `1px solid ${cfg.color}40`,
                          boxShadow: `0 0 8px ${cfg.glow}`,
                        }}
                      >
                        <Icon className="w-3 h-3" style={{ color: cfg.color }} />
                      </div>

                      {/* Content */}
                      <div
                        className="flex-1 min-w-0 pt-0.5 rounded-xl px-2.5 py-2 transition-all duration-200"
                        style={{ background: 'rgba(255,255,255,0)' }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = `${cfg.color}08`;
                          e.currentTarget.style.border = `1px solid ${cfg.color}20`;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0)';
                          e.currentTarget.style.border = '1px solid transparent';
                        }}
                      >
                        <p className="text-[11px] font-semibold leading-tight truncate" style={{ color: '#E2E8F0' }}>
                          {activity.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                            style={{ color: cfg.color, background: `${cfg.color}14`, border: `1px solid ${cfg.color}30` }}
                          >
                            {cfg.label}
                          </span>
                          <span className="text-[9px]" style={{ color: '#4A5568' }}>
                            {timeAgo(activity.updated_date)}
                          </span>
                        </div>
                        {activity.progress > 0 && (
                          <div className="mt-1.5 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${activity.progress}%`,
                                background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}80)`,
                                boxShadow: `0 0 5px ${cfg.glow}`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 shrink-0 relative" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Neon bottom edge */}
          <div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(109,86,232,0.30), rgba(20,184,212,0.20), transparent)' }}
          />
          <p className="text-[9px] text-center uppercase tracking-widest" style={{ color: '#2D3748' }}>
            Atualiza a cada 30s
          </p>
        </div>
      </aside>
    </>
  );
}