import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { useWorkspace } from '@/lib/useWorkspace';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Lock, CheckCircle2, Clock, AlertTriangle, CloudRain, Sun, Wind, Cloud } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFieldLogServiceMutations } from '@/hooks/services/useFieldLogServiceMutations';
import { buildGoLiveSelect } from '@/lib/goLive';

const STATUS_CONFIG = {
  draft:    { label: 'Rascunho',  color: '#718096', bg: 'rgba(113,128,150,0.12)', border: 'rgba(113,128,150,0.25)' },
  open:     { label: 'Em Aberto', color: '#E87D00', bg: 'rgba(232,125,0,0.10)',   border: 'rgba(232,125,0,0.25)'   },
  closed:   { label: 'Encerrado', color: '#14B8D4', bg: 'rgba(20,184,212,0.10)',  border: 'rgba(20,184,212,0.25)'  },
  approved: { label: 'Aprovado',  color: '#00D99A', bg: 'rgba(0,217,154,0.10)',   border: 'rgba(0,217,154,0.25)'   },
};

const WEATHER_ICON = {
  sunny:     <Sun className="w-4 h-4 text-yellow-400" />,
  cloudy:    <Cloud className="w-4 h-4 text-gray-400" />,
  windy:     <Wind className="w-4 h-4 text-blue-300" />,
  rain:      <CloudRain className="w-4 h-4 text-blue-400" />,
  high_risk: <AlertTriangle className="w-4 h-4 text-red-400" />,
};

const WEATHER_LABEL = { sunny: 'Ensolarado', cloudy: 'Nublado', windy: 'Ventoso', rain: 'Chuva', high_risk: 'Alto Risco' };

export default function FieldLogList({ onEdit, onNew }) {
  const db = useWorkspaceEntities();
  const { workspaceId, currentWorkspace } = useWorkspace();
  const goLiveDate = currentWorkspace?.go_live_date;
  const { deleteFieldLog } = useFieldLogServiceMutations();
  const [filter, setFilter] = useState('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['fieldlogs', workspaceId, goLiveDate || 'all'],
    queryFn: () => db.FieldLog.list('-date', 50),
    enabled: !!workspaceId,
    select: buildGoLiveSelect(goLiveDate, 'FieldLog'),
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', workspaceId],
    queryFn: () => db.Contract.list(),
    enabled: !!workspaceId,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams', workspaceId],
    queryFn: () => db.Team.list(),
    enabled: !!workspaceId,
  });

  const contractMap = Object.fromEntries(contracts.map(c => [c.id, c.name]));
  const teamMap = Object.fromEntries(teams.map(t => [t.id, t.name]));

  const filtered = filter === 'all' ? logs : logs.filter(l => l.status === filter);

  if (isLoading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['all', 'draft', 'open', 'closed', 'approved'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
            style={filter === s ? {
              background: 'rgba(20,184,212,0.15)',
              border: '1px solid rgba(20,184,212,0.35)',
              color: '#14B8D4',
            } : {
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#718096',
            }}
          >
            {s === 'all' ? 'Todos' : STATUS_CONFIG[s]?.label}
            <span className="ml-1.5 opacity-60">
              ({s === 'all' ? logs.length : logs.filter(l => l.status === s).length})
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.09)' }}
        >
          <div className="text-5xl mb-4">📋</div>
          <p className="text-white/50 text-sm">Nenhum diário encontrado</p>
          <Button size="sm" className="mt-4" onClick={onNew}>Criar Primeiro Diário</Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(log => {
            const st = STATUS_CONFIG[log.status] || STATUS_CONFIG.draft;
            const safetyOk = log.nr35_completed && log.anchor_verified && log.ppe_inspected;
            return (
              <div
                key={log.id}
                className="rounded-2xl p-4 transition-all duration-200"
                style={{
                  background: 'linear-gradient(145deg, rgba(12,18,36,0.90) 0%, rgba(6,10,22,0.96) 100%)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                }}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3">
                    {/* Date block */}
                    <div
                      className="w-12 h-14 rounded-xl flex flex-col items-center justify-center shrink-0"
                      style={{ background: 'rgba(20,184,212,0.08)', border: '1px solid rgba(20,184,212,0.18)' }}
                    >
                      <span className="text-[10px] font-bold uppercase" style={{ color: '#14B8D4' }}>
                        {log.date ? format(new Date(log.date), 'MMM', { locale: ptBR }) : '—'}
                      </span>
                      <span className="text-xl font-black text-white leading-tight">
                        {log.date ? format(new Date(log.date), 'dd') : '—'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white font-semibold text-sm">
                          {contractMap[log.contract_id] || 'Contrato'}
                        </span>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-md"
                          style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.color }}
                        >
                          {st.label}
                        </span>
                        {log.locked && <Lock className="w-3.5 h-3.5 text-yellow-400" />}
                        {log.incident_occurred && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                      </div>
                      <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: '#718096' }}>
                        <span>🏗️ {teamMap[log.team_id] || 'Equipe'}</span>
                        {log.location && <span>📍 {log.location}</span>}
                        {log.start_time && log.end_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {log.start_time} – {log.end_time}
                          </span>
                        )}
                        {log.weather && (
                          <span className="flex items-center gap-1">
                            {WEATHER_ICON[log.weather]} {WEATHER_LABEL[log.weather]}
                          </span>
                        )}
                      </div>
                      {/* Safety indicators */}
                      <div className="flex items-center gap-2 mt-2">
                        <div
                          className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded"
                          style={{
                            background: safetyOk ? 'rgba(0,217,154,0.10)' : 'rgba(232,125,0,0.10)',
                            color: safetyOk ? '#00D99A' : '#E87D00',
                            border: `1px solid ${safetyOk ? 'rgba(0,217,154,0.25)' : 'rgba(232,125,0,0.25)'}`,
                          }}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {safetyOk ? 'Segurança OK' : 'Check. Pendente'}
                        </div>
                        {log.total_hours_team > 0 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: 'rgba(109,86,232,0.10)', color: '#6D56E8', border: '1px solid rgba(109,86,232,0.22)' }}>
                            ⏱ {log.total_hours_team}h equipe
                          </span>
                        )}
                        {log.delay_occurred && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: 'rgba(220,55,55,0.10)', color: '#DC3737', border: '1px solid rgba(220,55,55,0.22)' }}>
                            ⚠ Atraso
                          </span>
                        )}
                        {(log.descidas_realizadas || 0) > 0 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: 'rgba(20,184,212,0.10)', color: '#14B8D4', border: '1px solid rgba(20,184,212,0.22)' }}>
                            ↓ {log.descidas_realizadas} descidas
                          </span>
                        )}
                        {log.approval_status === 'pending' && log.status === 'closed' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: 'rgba(232,125,0,0.10)', color: '#E87D00', border: '1px solid rgba(232,125,0,0.22)' }}>
                            ⏳ Aguardando aprovação
                          </span>
                        )}
                        {log.approval_status === 'approved' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: 'rgba(0,217,154,0.10)', color: '#00D99A', border: '1px solid rgba(0,217,154,0.22)' }}>
                            ✓ Aprovado
                          </span>
                        )}
                        {log.approval_status === 'rejected' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: 'rgba(220,55,55,0.10)', color: '#DC3737', border: '1px solid rgba(220,55,55,0.22)' }}>
                            ✗ Reprovado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Actions */}
                  {!log.locked && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="icon" variant="ghost" onClick={() => onEdit(log)} className="w-8 h-8">
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => { if (confirm('Excluir diário?')) deleteFieldLog.mutate({ id: log.id }); }}
                        className="w-8 h-8 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
