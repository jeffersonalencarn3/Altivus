import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { useWorkspace } from '@/lib/useWorkspace';
import { useAuth } from '@/lib/AuthContext';
import { usePermissions } from '@/lib/usePermissions';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Lock, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointmentServiceMutations } from '@/hooks/services/useAppointmentServiceMutations';
import { buildGoLiveSelect } from '@/lib/goLive';

const APPROVAL_CFG = {
  pending:  { label: 'Pendente',  color: '#E87D00', bg: 'rgba(232,125,0,0.10)',  icon: Clock },
  approved: { label: 'Aprovado',  color: '#00D99A', bg: 'rgba(0,217,154,0.10)', icon: CheckCircle2 },
  rejected: { label: 'Reprovado', color: '#DC3737', bg: 'rgba(220,55,55,0.10)', icon: XCircle },
};

export default function AppointmentApproval() {
  const db = useWorkspaceEntities();
  const { workspaceId, currentWorkspace } = useWorkspace();
  const goLiveDate = currentWorkspace?.go_live_date;
  const { user } = useAuth();
  const { canApproveReport } = usePermissions();
  const { approveAppointment } = useAppointmentServiceMutations({ user });
  const [expanded, setExpanded] = useState(null);
  const [notes, setNotes] = useState({});

  const { data: appts = [], isLoading } = useQuery({
    queryKey: ['appointments', workspaceId, goLiveDate || 'all'],
    queryFn: () => db.Appointment.list('-date', 100),
    enabled: !!workspaceId,
    select: buildGoLiveSelect(goLiveDate, 'Appointment'),
  });

  const relevant = appts.filter(a => a.status === 'awaiting_approval' || a.approval_status === 'approved' || a.approval_status === 'rejected');

  if (!canApproveReport) return (
    <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.09)' }}>
      <Lock className="w-8 h-8 mx-auto mb-3" style={{ color: '#4A5568' }} />
      <p className="text-white/50 text-sm">Painel de aprovação disponível apenas para supervisores e administradores.</p>
    </div>
  );

  if (isLoading) return <div className="flex items-center justify-center h-32"><div className="w-7 h-7 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <CheckCircle2 className="w-5 h-5" style={{ color: '#00D99A' }} />
        <h3 className="text-white font-bold text-base">Aprovação de Apontamentos</h3>
        <span className="text-xs px-2 py-0.5 rounded-md font-semibold" style={{ background: 'rgba(232,125,0,0.12)', color: '#E87D00', border: '1px solid rgba(232,125,0,0.25)' }}>
          {relevant.filter(a => a.approval_status === 'pending').length} pendentes
        </span>
      </div>

      {relevant.length === 0 && <div className="py-12 text-center" style={{ color: '#4A5568' }}><p className="text-sm">Nenhum apontamento aguardando revisão.</p></div>}

      {relevant.map(a => {
        const cfg = APPROVAL_CFG[a.approval_status] || APPROVAL_CFG.pending;
        const Icon = cfg.icon;
        const isOpen = expanded === a.id;

        return (
          <div key={a.id} className="rounded-2xl overflow-hidden transition-all"
            style={{ background: 'linear-gradient(145deg,rgba(12,18,36,0.90),rgba(6,10,22,0.96))', border: `1px solid ${isOpen ? 'rgba(20,184,212,0.20)' : 'rgba(255,255,255,0.07)'}` }}>

            <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(isOpen ? null : a.id)}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: cfg.bg, border: `1px solid ${cfg.color}35` }}>
                <Icon className="w-4 h-4" style={{ color: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-semibold text-sm">{a.employee_name || '—'}</span>
                  <span className="text-xs" style={{ color: '#718096' }}>{a.employee_role || ''}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>{cfg.label}</span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: '#718096' }}>
                  {a.date ? format(new Date(a.date), "dd 'de' MMMM yyyy", { locale: ptBR }) : '—'}
                  {a.total_hours ? ` · ${a.total_hours}h` : ''}
                  {(a.photos_before || []).length > 0 ? ' · 📷 Fotos' : ''}
                  {a.report_status === 'filled' ? ' · 📝 Reporte' : ''}
                </p>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: '#718096' }} /> : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: '#718096' }} />}
            </div>

            {isOpen && (
              <div className="border-t px-4 pb-4 pt-3 space-y-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Horas', value: `${a.total_hours || 0}h` },
                    { label: 'Progresso', value: `${a.progress || 0}%` },
                    { label: 'Fotos Antes', value: (a.photos_before || []).length },
                    { label: 'Fotos Depois', value: (a.photos_after || []).length },
                  ].map(m => (
                    <div key={m.label} className="text-center rounded-xl py-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="text-lg font-black text-white">{m.value}</div>
                      <div className="text-[10px]" style={{ color: '#718096' }}>{m.label}</div>
                    </div>
                  ))}
                </div>

                {a.report_what_was_done && (
                  <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#718096' }}>Reporte — O que foi feito</p>
                    <p className="text-xs text-white">{a.report_what_was_done}</p>
                  </div>
                )}

                {/* Photos preview */}
                {(a.photos_before || []).length > 0 && (a.photos_after || []).length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] font-bold mb-1" style={{ color: '#E87D00' }}>ANTES</p>
                      <img src={a.photos_before[0].url} className="w-full h-24 object-cover rounded-xl" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold mb-1" style={{ color: '#00D99A' }}>DEPOIS</p>
                      <img src={a.photos_after[0].url} className="w-full h-24 object-cover rounded-xl" />
                    </div>
                  </div>
                )}

                {a.approval_status === 'pending' && (
                  <div className="space-y-2">
                    <textarea className="w-full rounded-xl px-3 py-2 text-sm resize-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff', minHeight: 52 }}
                      placeholder="Observações (opcional)..."
                      value={notes[a.id] || ''} onChange={e => setNotes(n => ({ ...n, [a.id]: e.target.value }))} />
                    <div className="flex gap-2">
                      <Button className="flex-1 gap-1.5" style={{ background: 'linear-gradient(135deg,#00D99A,#14B8D4)', color: '#020B0F', fontWeight: 700 }}
                        onClick={() => approveAppointment.mutate({ appointment: a, decision: 'approved', notes: notes[a.id] || '' })} disabled={approveAppointment.isPending}>
                        <CheckCircle2 className="w-4 h-4" /> Aprovar
                      </Button>
                      <Button variant="destructive" className="flex-1 gap-1.5"
                        onClick={() => approveAppointment.mutate({ appointment: a, decision: 'rejected', notes: notes[a.id] || '' })} disabled={approveAppointment.isPending}>
                        <XCircle className="w-4 h-4" /> Reprovar
                      </Button>
                    </div>
                  </div>
                )}

                {a.approval_status !== 'pending' && (
                  <div className="rounded-xl px-4 py-3 text-xs" style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
                    <p className="font-semibold" style={{ color: cfg.color }}>
                      {cfg.label} por {a.approval_by || 'supervisor'} em {a.approval_at ? format(new Date(a.approval_at), "dd/MM/yyyy HH:mm") : '—'}
                    </p>
                    {a.approval_notes && <p className="mt-1" style={{ color: '#A0AEC0' }}>{a.approval_notes}</p>}
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
