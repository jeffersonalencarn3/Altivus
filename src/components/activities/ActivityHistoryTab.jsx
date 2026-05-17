/**
 * Aba "Histórico da Atividade" — linha do tempo completa de todos os eventos
 * Fontes: sessões de execução, registros de presença (AttendanceRecord), audit_trail da atividade
 */
import React, { useMemo } from 'react';
import { useActivitySessions, useAttendanceRecords } from '@/lib/useAppData';
import {
  PlayCircle, StopCircle, UserCheck, UserX, Clock,
  Shield, FileText, AlertTriangle, UserPlus, UserMinus,
  RotateCcw, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ACTION_CONFIG = {
  // Execução
  checkin:               { icon: PlayCircle,    color: '#00D99A', label: 'Check-in Inicial'         },
  checkout:              { icon: StopCircle,    color: '#14B8D4', label: 'Check-out'                },
  // Presença
  presente:              { icon: UserCheck,     color: '#00D99A', label: 'Colaborador Presente'     },
  atrasado:              { icon: Clock,         color: '#E87D00', label: 'Chegada Atrasada'         },
  ausente:               { icon: UserX,         color: '#FC5252', label: 'Falta Confirmada'         },
  falta_justificada:     { icon: FileText,      color: '#6D56E8', label: 'Falta Justificada'        },
  falta_nao_justificada: { icon: AlertTriangle, color: '#FC5252', label: 'Falta Não Justificada'    },
  substituido:           { icon: ArrowRight,    color: '#14B8D4', label: 'Substituição Registrada'  },
  dispensado:            { icon: UserMinus,     color: '#EAB308', label: 'Colaborador Dispensado'   },
  finalizado:            { icon: StopCircle,    color: '#00D99A', label: 'Encerramento de Particip.'},
  // Admin
  admin_edit:            { icon: Shield,        color: '#6D56E8', label: 'Ajuste Administrativo'    },
  // Genéricos
  colaborador_adicionado:{ icon: UserPlus,      color: '#00D99A', label: 'Colaborador Adicionado'   },
  colaborador_removido:  { icon: UserMinus,     color: '#FC5252', label: 'Colaborador Removido'     },
  reabertura:            { icon: RotateCcw,     color: '#E87D00', label: 'Reabertura de Registro'   },
  chegada_posterior:     { icon: Clock,         color: '#14B8D4', label: 'Chegada Posterior'        },
  default:               { icon: Clock,         color: '#718096', label: 'Evento'                   },
};

const ROLE_LABELS = {
  admin:       'Administrador',
  supervisor:  'Supervisor',
  operacional: 'Operacional',
  viewer:      'Visualizador',
};

function HistoryEntry({ entry, isLast }) {
  const cfg  = ACTION_CONFIG[entry.action] || ACTION_CONFIG.default;
  const Icon = cfg.icon;

  return (
    <div className="flex gap-3">
      {/* linha do tempo */}
      <div className="flex flex-col items-center">
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}40` }}>
          <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
        </div>
        {!isLast && (
          <div className="w-px flex-1 mt-1" style={{ background: 'rgba(255,255,255,0.06)', minHeight: 20 }} />
        )}
      </div>

      {/* conteúdo */}
      <div className="flex-1 pb-5">
        {/* cabeçalho */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <span className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
            {entry.employee && (
              <span className="text-xs ml-1.5" style={{ color: '#A0AEC0' }}>— {entry.employee}</span>
            )}
          </div>
          <span className="text-[10px] shrink-0" style={{ color: '#4A5568' }}>
            {entry.timestamp
              ? format(new Date(entry.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
              : '—'}
          </span>
        </div>

        {/* status anterior → novo */}
        {(entry.previous_status || entry.new_status) && entry.previous_status !== entry.new_status && (
          <div className="flex items-center gap-1.5 mt-1 text-[11px]">
            {entry.previous_status && (
              <span className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(252,82,82,0.12)', color: '#FC5252' }}>
                {entry.previous_status}
              </span>
            )}
            <ArrowRight className="w-3 h-3" style={{ color: '#4A5568' }} />
            {entry.new_status && (
              <span className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,217,154,0.12)', color: '#00D99A' }}>
                {entry.new_status}
              </span>
            )}
          </div>
        )}

        {/* detalhe / justificativa */}
        {entry.details && (
          <p className="text-[11px] mt-0.5 italic" style={{ color: '#718096' }}>{entry.details}</p>
        )}

        {/* usuário */}
        {entry.user && (
          <p className="text-[10px] mt-0.5" style={{ color: '#4A5568' }}>
            por <span style={{ color: '#A0AEC0' }}>{entry.user}</span>
            {entry.user_role && (
              <span className="ml-1 px-1 py-0.5 rounded text-[9px]"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#718096' }}>
                {ROLE_LABELS[entry.user_role] || entry.user_role}
              </span>
            )}
          </p>
        )}

        {/* motivo + observação (admin) */}
        {entry.reason && (
          <div className="mt-1.5 px-2 py-1.5 rounded-lg space-y-0.5"
            style={{ background: 'rgba(109,86,232,0.08)', border: '1px solid rgba(109,86,232,0.15)' }}>
            <p className="text-[10px] font-semibold" style={{ color: '#6D56E8' }}>Motivo: {entry.reason}</p>
            {entry.observation && <p className="text-[10px]" style={{ color: '#A0AEC0' }}>Obs.: {entry.observation}</p>}
          </div>
        )}

        {/* antes / depois */}
        {(entry.before || entry.after) && (
          <div className="mt-1 flex flex-wrap gap-2 text-[10px]">
            {entry.before && (
              <span className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(252,82,82,0.10)', color: '#FC5252' }}>
                Antes: {entry.before}
              </span>
            )}
            {entry.after && (
              <span className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,217,154,0.10)', color: '#00D99A' }}>
                Depois: {entry.after}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ActivityHistoryTab({ activity }) {
  const { data: sessions = [] } = useActivitySessions(activity?.id);
  const { data: attendanceRecords = [] } = useAttendanceRecords(activity?.id);

  const allEntries = useMemo(() => {
    const entries = [];

    /* ── Sessões de execução ── */
    sessions.forEach(s => {
      if (s.hora_inicio) entries.push({
        action:    'checkin',
        timestamp: s.hora_inicio,
        user:      s.created_by || 'sistema',
        details:   `Sessão de execução iniciada`,
      });
      if (s.hora_fim) entries.push({
        action:    'checkout',
        timestamp: s.hora_fim,
        user:      s.created_by || 'sistema',
        details:   `${s.descidas_realizadas || 0} descidas · ${Math.round((s.tempo_total_minutos || 0) / 60 * 10) / 10}h · ${s.execution_status || 'finalizado'}`,
      });
    });

    /* ── Registros de presença ── */
    attendanceRecords.forEach(rec => {
      // Evento principal de registro
      if (rec.registered_at && rec.status !== 'previsto') {
        entries.push({
          action:          rec.status,
          timestamp:       rec.registered_at,
          employee:        rec.employee_name,
          employee_id:     rec.employee_id,
          previous_status: rec.previous_status || null,
          new_status:      rec.status,
          user:            rec.registered_by || 'sistema',
          user_role:       rec.registered_by_role || '',
          details:         rec.justification || (rec.delay_minutes > 0 ? `+${rec.delay_minutes}min de atraso` : ''),
        });
      }
      // Chegada posterior
      if (rec.late_arrival_time) {
        entries.push({
          action:    'chegada_posterior',
          timestamp: rec.late_arrival_time,
          employee:  rec.employee_name,
          user:      rec.registered_by || 'sistema',
          user_role: rec.registered_by_role || '',
          details:   `Retorno às ${format(new Date(rec.late_arrival_time), 'HH:mm')}`,
        });
      }
      // Entradas do audit_log (ajustes admin)
      (rec.audit_log || []).forEach(log => {
        entries.push({
          action:          log.action || 'admin_edit',
          timestamp:       log.timestamp,
          employee:        rec.employee_name,
          employee_id:     rec.employee_id,
          previous_status: log.previous_status || null,
          new_status:      log.new_status || null,
          before:          log.before,
          after:           log.after,
          reason:          log.reason,
          observation:     log.observation,
          user:            log.user,
          user_role:       log.user_role || 'admin',
        });
      });
    });

    /* ── Audit trail da atividade ── */
    (activity?.audit_trail || []).forEach(log => {
      // evitar duplicatas (registros de presença já aparecem acima)
      const isDuplicate = attendanceRecords.some(r =>
        r.registered_at === log.timestamp && r.employee_name === log.employee
      );
      if (!isDuplicate) {
        entries.push({
          action:          log.action || 'default',
          timestamp:       log.timestamp,
          employee:        log.employee,
          employee_id:     log.employee_id,
          previous_status: log.previous_status || null,
          new_status:      log.new_status || null,
          user:            log.user,
          user_role:       log.user_role || '',
          details:         log.details || '',
          reason:          log.reason || '',
          observation:     log.observation || '',
        });
      }
    });

    return entries
      .filter(e => !!e.timestamp)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [sessions, attendanceRecords, activity]);

  if (allEntries.length === 0) {
    return (
      <div className="py-12 text-center">
        <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
        <p className="text-sm" style={{ color: '#718096' }}>Nenhum evento registrado ainda</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider mb-4" style={{ color: '#718096' }}>
        {allEntries.length} evento(s) · mais recentes primeiro
      </p>
      <div>
        {allEntries.map((entry, i) => (
          <HistoryEntry key={i} entry={entry} isLast={i === allEntries.length - 1} />
        ))}
      </div>
    </div>
  );
}
