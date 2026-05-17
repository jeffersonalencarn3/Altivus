import React, { useMemo, useState } from 'react';
import { useActivities, useTeams, useMaterials } from '@/lib/useAppData';
import { AlertTriangle, Package, Users, Pause, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

const TODAY = new Date().toISOString().split('T')[0];

function daysDiff(dateStr) {
  if (!dateStr) return null;
  return Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
}

const PRIORITY_CONFIG = {
  critical: { label: 'Crítico', color: '#FC5252', bg: 'rgba(252,82,82,0.07)', border: 'rgba(252,82,82,0.22)', order: 0 },
  high:     { label: 'Alto',    color: '#E87D00', bg: 'rgba(232,125,0,0.07)', border: 'rgba(232,125,0,0.22)',  order: 1 },
  medium:   { label: 'Médio',   color: '#E8C200', bg: 'rgba(232,194,0,0.07)', border: 'rgba(232,194,0,0.22)', order: 2 },
};

function buildAlerts(activities = [], teams = [], materials = []) {
  const alerts = [];

  activities.forEach(a => {
    if (a.end_date && a.end_date < TODAY && a.status !== 'completed') {
      const days = daysDiff(a.end_date);
      alerts.push({
        id: `late-${a.id}`, type: 'late',
        priority: days > 14 ? 'critical' : days > 5 ? 'high' : 'medium',
        icon: AlertTriangle,
        title: 'Atividade Atrasada',
        description: `"${a.title}" está ${days}d além do prazo`,
      });
    }
  });

  materials.forEach(m => {
    if (m.quantity_available <= 0) {
      alerts.push({ id: `mat-zero-${m.id}`, priority: 'critical', icon: Package, title: 'Material Esgotado', description: `"${m.name}" com estoque zero` });
    } else if (m.quantity_available <= (m.low_stock_threshold || 5)) {
      alerts.push({ id: `mat-low-${m.id}`, priority: 'high', icon: Package, title: 'Estoque Baixo', description: `"${m.name}" com apenas ${m.quantity_available} ${m.unit || 'un'}` });
    }
  });

  const activeTeamIds = new Set(activities.filter(a => a.status === 'in_progress').map(a => a.team_id));
  teams.filter(t => t.status === 'active').forEach(t => {
    if (!activeTeamIds.has(t.id)) {
      alerts.push({ id: `team-idle-${t.id}`, priority: 'medium', icon: Users, title: 'Equipe Sem Alocação', description: `"${t.name}" sem atividade em andamento` });
    }
  });

  activities.forEach(a => {
    if (a.status === 'in_progress') {
      const stale = daysDiff(a.updated_date || a.created_date);
      if (stale !== null && stale >= 7) {
        alerts.push({ id: `stale-${a.id}`, priority: stale >= 14 ? 'critical' : 'high', icon: Pause, title: 'Atividade Parada', description: `"${a.title}" sem atualização há ${stale} dias` });
      }
    }
  });

  return alerts.sort((a, b) => PRIORITY_CONFIG[a.priority].order - PRIORITY_CONFIG[b.priority].order);
}

export default function AlertsPanel() {
  const { data: activities = [] } = useActivities();
  const { data: teams = [] } = useTeams();
  const { data: materials = [] } = useMaterials();
  const [collapsed, setCollapsed] = useState(false);
  const [filter, setFilter] = useState('all');

  const alerts = useMemo(() => buildAlerts(activities, teams, materials), [activities, teams, materials]);
  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.priority === filter);
  const counts = { critical: alerts.filter(a => a.priority === 'critical').length, high: alerts.filter(a => a.priority === 'high').length, medium: alerts.filter(a => a.priority === 'medium').length };

  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
        style={{ background: 'rgba(0,217,154,0.06)', border: '1px solid rgba(0,217,154,0.18)' }}>
        <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(0,217,154,0.12)', border: '1px solid rgba(0,217,154,0.25)' }}>
          <ShieldCheck className="w-4 h-4" style={{ color: '#00D99A' }} />
        </div>
        <p className="text-sm font-semibold" style={{ color: '#00D99A' }}>
          Operação dentro do normal — nenhum alerta ativo
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'linear-gradient(145deg, rgba(10,16,32,0.92), rgba(6,10,22,0.96))', border: '1px solid rgba(252,82,82,0.18)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(252,82,82,0.14)', border: '1px solid rgba(252,82,82,0.28)' }}>
            <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#FC5252' }} />
          </div>
          <span className="text-sm font-bold text-white">Alertas Operacionais</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(252,82,82,0.12)', color: '#FC5252', border: '1px solid rgba(252,82,82,0.22)' }}>
            {alerts.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {(['all', 'critical', 'high', 'medium']).map(p => {
            const cfg = p === 'all' ? { label: `Todos`, color: '#A0AEC0' } : { label: PRIORITY_CONFIG[p].label, color: PRIORITY_CONFIG[p].color };
            const count = p === 'all' ? alerts.length : counts[p];
            const isActive = filter === p;
            return (
              <button key={p} onClick={() => setFilter(p)}
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all duration-150"
                style={{
                  background: isActive ? `${cfg.color}18` : 'transparent',
                  border: `1px solid ${isActive ? `${cfg.color}35` : 'rgba(255,255,255,0.08)'}`,
                  color: isActive ? cfg.color : '#4A5568',
                }}>
                {cfg.label} {count > 0 && `(${count})`}
              </button>
            );
          })}
          <button onClick={() => setCollapsed(v => !v)}
            className="ml-1 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#718096' }}>
            {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
          {filtered.length === 0
            ? <p className="text-center text-xs py-4" style={{ color: '#4A5568' }}>Nenhum alerta nesta prioridade.</p>
            : filtered.map(alert => {
                const cfg = PRIORITY_CONFIG[alert.priority];
                const Icon = alert.icon;
                return (
                  <div key={alert.id}
                    className="flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}>
                      <Icon className="w-3 h-3" style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold" style={{ color: cfg.color }}>{alert.title}</p>
                      <p className="text-[11px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>{alert.description}</p>
                    </div>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md shrink-0"
                      style={{ background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}28` }}>
                      {cfg.label.toUpperCase()}
                    </span>
                  </div>
                );
              })
          }
        </div>
      )}
    </div>
  );
}