/**
 * Card de bloco com métricas de planejamento, previsão e alertas
 */
import React from 'react';
import { calcularPrevisao, gerarAlertas } from '@/lib/planningEngine';
import { AlertTriangle, Users, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import ActivityActionMenu from '@/components/activities/ActivityActionMenu';

const STATUS_LABELS = {
  not_started: { label: 'Não iniciado', color: '#718096' },
  in_progress:  { label: 'Em andamento', color: '#14B8D4' },
  delayed:      { label: 'Atrasado',     color: '#FC5252' },
  completed:    { label: 'Concluído',    color: '#00D99A' },
};

const PRIORITY_COLORS = {
  low: '#718096', medium: '#14B8D4', high: '#E87D00', critical: '#FC5252',
};

export default function ActivityBlockCard({ activity, sessions = [], teams = [], onOpen, onEdit, onDuplicate, onReschedule, onArchive, onDelete, onRestore }) {
  const previsao = calcularPrevisao(activity, sessions);
  const alertas  = gerarAlertas(activity, previsao);
  const st       = STATUS_LABELS[activity.status] || STATUS_LABELS.not_started;
  const team     = teams.find(t => t.id === activity.team_id);

  const statusColor = previsao.atrasado && activity.status !== 'completed'
    ? '#FC5252'
    : st.color;

  return (
    <div
      className="rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:-translate-y-1 active:scale-[0.98]"
      style={{
        background: 'linear-gradient(145deg, rgba(10,16,32,0.92), rgba(6,10,22,0.96))',
        border: `1px solid ${statusColor}22`,
        boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onClick={onOpen}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <StatusBadge
              status={previsao.atrasado && activity.status !== 'completed' ? 'delayed' : activity.status}
              size="xs"
            />
            {activity.status === 'archived' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                style={{ background: 'rgba(113,128,150,0.15)', color: '#718096', border: '1px solid rgba(113,128,150,0.3)' }}>
                Arquivada
              </span>
            )}
            {activity.tipo_servico && (
              <span className="text-[9px] text-white/35 font-medium">
                {activity.tipo_servico === 'telhado' ? '🏗 Telhado' : '🏢 Fachada'}
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-white truncate">{activity.title}</h3>
          {team && <p className="text-[11px] text-white/40 mt-0.5">{team.name}</p>}
        </div>
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          <div className="text-xs font-black" style={{ color: PRIORITY_COLORS[activity.priority] }}>
            {activity.priority?.toUpperCase()}
          </div>
          <ActivityActionMenu
            activity={activity}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onReschedule={onReschedule}
            onArchive={onArchive}
            onDelete={onDelete}
            onRestore={onRestore}
          />
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Metric label="Área" value={activity.area_m2 ? `${activity.area_m2} m²` : '—'} />
        <Metric label="Descidas" value={`${activity.descents_completed || 0}/${activity.descents_planned || 0}`} />
        <Metric label="Dias plan." value={activity.dias_planejados || '—'} />
      </div>

      {/* Barra de progresso */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] mb-1">
          <span style={{ color: '#718096' }}>Progresso</span>
          <span style={{ color: statusColor }} className="font-bold">{previsao.progresso_pct}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${previsao.progresso_pct}%`,
              background: `linear-gradient(90deg, ${statusColor}, ${statusColor}80)`,
            }}
          />
        </div>
      </div>

      {/* Previsão inteligente (só se tiver execução) */}
      {previsao.produtividade_real !== null && (
        <div className="grid grid-cols-2 gap-2 mb-3 p-2 rounded-lg" style={{ background: 'rgba(20,184,212,0.06)' }}>
          <div>
            <span className="text-[9px] text-white/40">Prod. Real</span>
            <p className="text-xs font-bold text-primary">{previsao.produtividade_real.toFixed(2)} desc/h</p>
          </div>
          <div>
            <span className="text-[9px] text-white/40">Dias Restantes</span>
            <p className="text-xs font-bold" style={{ color: previsao.atrasado ? '#FC5252' : '#00D99A' }}>
              ~{previsao.dias_restantes_calc} dias
            </p>
          </div>
        </div>
      )}

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="space-y-1 mb-3">
          {alertas.map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-lg"
              style={{
                background: a.tipo === 'falta_equipe' ? 'rgba(20,184,212,0.08)' : 'rgba(252,82,82,0.08)',
                color: a.tipo === 'falta_equipe' ? '#14B8D4' : '#FC5252',
                border: `1px solid ${a.tipo === 'falta_equipe' ? 'rgba(20,184,212,0.2)' : 'rgba(252,82,82,0.2)'}`,
              }}
            >
              {a.tipo === 'falta_equipe'
                ? <Users className="w-3 h-3 shrink-0" />
                : <AlertTriangle className="w-3 h-3 shrink-0" />
              }
              {a.msg}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-[10px]" style={{ color: '#4A5568' }}>
          <Users className="w-3 h-3" />
          {activity.num_alpinistas || 1} alpinista(s)
        </div>
        <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 py-0 text-primary hover:bg-primary/10">
          <Play className="w-3 h-3 mr-1" /> Abrir
        </Button>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <p className="text-[9px] text-white/40 mb-0.5">{label}</p>
      <p className="text-xs font-bold text-white">{value}</p>
    </div>
  );
}