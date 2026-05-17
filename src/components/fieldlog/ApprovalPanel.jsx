import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { useWorkspace } from '@/lib/useWorkspace';
import { useAuth } from '@/lib/AuthContext';
import { usePermissions } from '@/lib/usePermissions';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Lock, Clock, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFieldLogServiceMutations } from '@/hooks/services/useFieldLogServiceMutations';
import { buildGoLiveSelect } from '@/lib/goLive';

const APPROVAL_CONFIG = {
  pending:  { label: 'Pendente',  color: '#E87D00', bg: 'rgba(232,125,0,0.10)',   icon: Clock },
  approved: { label: 'Aprovado',  color: '#00D99A', bg: 'rgba(0,217,154,0.10)',   icon: CheckCircle2 },
  rejected: { label: 'Reprovado', color: '#DC3737', bg: 'rgba(220,55,55,0.10)',   icon: XCircle },
};

export default function ApprovalPanel() {
  const db = useWorkspaceEntities();
  const { workspaceId, currentWorkspace } = useWorkspace();
  const goLiveDate = currentWorkspace?.go_live_date;
  const { user } = useAuth();
  const { canApproveReport } = usePermissions();
  const { approveFieldLog } = useFieldLogServiceMutations({ user });
  const [expanded, setExpanded] = useState(null);
  const [notes, setNotes] = useState({});

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['fieldlogs', workspaceId, goLiveDate || 'all'],
    queryFn: () => db.FieldLog.list('-date', 100),
    enabled: !!workspaceId,
    select: buildGoLiveSelect(goLiveDate, 'FieldLog'),
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', workspaceId],
    queryFn: () => db.Contract.list(),
    enabled: !!workspaceId,
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['material_movements', workspaceId, goLiveDate || 'all'],
    queryFn: () => db.MaterialMovement.list('-created_date', 200),
    enabled: !!workspaceId,
    select: buildGoLiveSelect(goLiveDate, 'MaterialMovement'),
  });

  const contractMap = Object.fromEntries(contracts.map(c => [c.id, c.name]));

  // Show closed logs pending approval (or already reviewed)
  const relevant = logs.filter(l => l.status === 'closed' || l.status === 'approved');

  if (isLoading) return (
    <div className="flex items-center justify-center h-32">
      <div className="w-7 h-7 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!canApproveReport) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.09)' }}>
        <Lock className="w-8 h-8 mx-auto mb-3" style={{ color: '#4A5568' }} />
        <p className="text-white/50 text-sm">Painel de aprovação disponível apenas para supervisores e administradores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="w-5 h-5" style={{ color: '#00D99A' }} />
        <h3 className="text-white font-bold text-base">Aprovação de Diários</h3>
        <span className="text-xs px-2 py-0.5 rounded-md font-semibold" style={{ background: 'rgba(232,125,0,0.12)', color: '#E87D00', border: '1px solid rgba(232,125,0,0.25)' }}>
          {relevant.filter(l => l.approval_status === 'pending').length} pendentes
        </span>
      </div>

      {relevant.length === 0 && (
        <div className="py-12 text-center" style={{ color: '#4A5568' }}>
          <p className="text-sm">Nenhum diário encerrado para revisar.</p>
        </div>
      )}

      {relevant.map(log => {
        const cfg = APPROVAL_CONFIG[log.approval_status] || APPROVAL_CONFIG.pending;
        const Icon = cfg.icon;
        const isOpen = expanded === log.id;
        const logMovements = movements.filter(m => m.field_log_id === log.id);

        return (
          <div
            key={log.id}
            className="rounded-2xl overflow-hidden transition-all duration-200"
            style={{
              background: 'linear-gradient(145deg, rgba(12,18,36,0.90) 0%, rgba(6,10,22,0.96) 100%)',
              border: `1px solid ${isOpen ? 'rgba(20,184,212,0.20)' : 'rgba(255,255,255,0.07)'}`,
            }}
          >
            {/* Header row */}
            <div
              className="flex items-center gap-3 p-4 cursor-pointer"
              onClick={() => setExpanded(isOpen ? null : log.id)}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: cfg.bg, border: `1px solid ${cfg.color}35` }}
              >
                <Icon className="w-4 h-4" style={{ color: cfg.color }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-semibold text-sm">{contractMap[log.contract_id] || 'Contrato'}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: '#718096' }}>
                  {log.date ? format(new Date(log.date), "dd 'de' MMMM yyyy", { locale: ptBR }) : '—'}
                  {log.descidas_realizadas > 0 && ` • ${log.descidas_realizadas} descidas`}
                  {logMovements.length > 0 && ` • ${logMovements.length} mat.`}
                </p>
              </div>

              {isOpen ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: '#718096' }} /> : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: '#718096' }} />}
            </div>

            {/* Expanded detail */}
            {isOpen && (
              <div className="border-t px-4 pb-4 pt-3 space-y-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {/* Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Horas Equipe', value: `${log.total_hours_team || 0}h` },
                    { label: 'Descidas', value: log.descidas_realizadas || 0 },
                    { label: 'Materiais', value: logMovements.length },
                    { label: 'Colaboradores', value: (log.workers_present || []).length },
                  ].map(m => (
                    <div key={m.label} className="text-center rounded-xl py-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="text-lg font-black text-white">{m.value}</div>
                      <div className="text-[10px]" style={{ color: '#718096' }}>{m.label}</div>
                    </div>
                  ))}
                </div>

                {/* Movements list */}
                {logMovements.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#A0AEC0' }}>Movimentações de Material</p>
                    <div className="space-y-1.5">
                      {logMovements.map(m => (
                        <div key={m.id} className="flex items-center justify-between rounded-lg px-3 py-2 text-xs" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <span className="text-white font-medium">{m.material_name}</span>
                          <div className="flex items-center gap-2">
                            <span style={{ color: '#E87D00' }}>− {m.quantity}</span>
                            {m.confirmed
                              ? <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background: 'rgba(0,217,154,0.12)', color: '#00D99A' }}>Confirmado</span>
                              : <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background: 'rgba(232,125,0,0.12)', color: '#E87D00' }}>Pendente</span>
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Incidents */}
                {(log.incident_occurred || log.delay_occurred) && (
                  <div className="flex gap-2 flex-wrap">
                    {log.delay_occurred && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(232,125,0,0.10)', color: '#E87D00', border: '1px solid rgba(232,125,0,0.25)' }}>
                        <AlertTriangle className="w-3.5 h-3.5" /> Atraso: {log.delay_reason || 'sem descrição'}
                      </div>
                    )}
                    {log.incident_occurred && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(220,55,55,0.10)', color: '#DC3737', border: '1px solid rgba(220,55,55,0.25)' }}>
                        <AlertTriangle className="w-3.5 h-3.5" /> Incidente registrado
                      </div>
                    )}
                  </div>
                )}

                {/* Approval action */}
                {log.approval_status === 'pending' && (
                  <div className="space-y-2">
                    <textarea
                      className="w-full rounded-xl px-3 py-2 text-sm resize-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff', minHeight: 52 }}
                      placeholder="Observações (opcional)..."
                      value={notes[log.id] || ''}
                      onChange={e => setNotes(n => ({ ...n, [log.id]: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 gap-1.5"
                        style={{ background: 'linear-gradient(135deg, #00D99A, #14B8D4)', color: '#020B0F', fontWeight: 700 }}
                        onClick={() => approveFieldLog.mutate({ log, decision: 'approved', notes: notes[log.id] || '', movements })}
                        disabled={approveFieldLog.isPending}
                      >
                        <CheckCircle2 className="w-4 h-4" /> Aprovar
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1 gap-1.5"
                        onClick={() => approveFieldLog.mutate({ log, decision: 'rejected', notes: notes[log.id] || '', movements })}
                        disabled={approveFieldLog.isPending}
                      >
                        <XCircle className="w-4 h-4" /> Reprovar
                      </Button>
                    </div>
                  </div>
                )}

                {log.approval_status !== 'pending' && (
                  <div className="rounded-xl px-4 py-3 text-xs" style={{ background: `${cfg.bg}`, border: `1px solid ${cfg.color}30` }}>
                    <p className="font-semibold" style={{ color: cfg.color }}>
                      {cfg.label} por {log.approval_by || 'supervisor'} em {log.approval_at ? format(new Date(log.approval_at), "dd/MM/yyyy HH:mm") : '—'}
                    </p>
                    {log.approval_notes && <p className="mt-1" style={{ color: '#A0AEC0' }}>{log.approval_notes}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
