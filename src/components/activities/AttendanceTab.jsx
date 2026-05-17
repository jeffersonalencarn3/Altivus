/**
 * Aba "Presença e Check-in" — registro de presença por colaborador dentro da atividade
 * Regras:
 *   - Líder/Supervisor: pode marcar status, hora de chegada (1ª vez), falta, justificativa, checkout (1ª vez)
 *   - Líder/Supervisor: NÃO pode editar campos já salvos (arrival, checkout, delay, scheduled_start)
 *   - Admin: pode editar qualquer campo, mas exige motivo + observação → gera audit_log com antes/depois
 */
import React, { useState, useMemo, useEffect } from 'react';
import { useWorkspace } from '@/lib/useWorkspace';
import { useAttendanceRecords, useEmployees } from '@/lib/useAppData';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserCheck, UserX, Plus, Pencil, Shield, AlertTriangle, UserPlus } from 'lucide-react';
import AddCollaboratorSheet from '@/components/activities/AddCollaboratorSheet';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useActivityServiceMutations } from '@/hooks/services/useActivityServiceMutations';

/* ─── constantes ─── */
const STATUS_CONFIG = {
  previsto:              { label: 'Previsto',            color: '#718096', bg: 'rgba(113,128,150,0.12)' },
  presente:              { label: 'Presente',            color: '#00D99A', bg: 'rgba(0,217,154,0.12)'   },
  atrasado:              { label: 'Atrasado',            color: '#E87D00', bg: 'rgba(232,125,0,0.12)'   },
  ausente:               { label: 'Ausente',             color: '#FC5252', bg: 'rgba(252,82,82,0.12)'   },
  falta_justificada:     { label: 'Falta Justificada',   color: '#6D56E8', bg: 'rgba(109,86,232,0.12)'  },
  falta_nao_justificada: { label: 'Falta Não Justif.',   color: '#FC5252', bg: 'rgba(252,82,82,0.15)'   },
  substituido:           { label: 'Substituído',         color: '#14B8D4', bg: 'rgba(20,184,212,0.12)'  },
  dispensado:            { label: 'Dispensado',          color: '#EAB308', bg: 'rgba(234,179,8,0.12)'   },
  finalizado:            { label: 'Finalizado',          color: '#00D99A', bg: 'rgba(0,217,154,0.08)'   },
};

const ABSENCE_TYPES = [
  { value: 'atestado',    label: 'Atestado médico' },
  { value: 'pessoal',     label: 'Pessoal'         },
  { value: 'servico',     label: 'A serviço'        },
  { value: 'nao_informado', label: 'Não informado'  },
];

/** Calcula minutos de atraso (sistema — não editável pelo líder) */
function calcDelay(scheduledHHmm, arrivalISO) {
  if (!scheduledHHmm || !arrivalISO) return 0;
  const [h, m] = scheduledHHmm.split(':').map(Number);
  const arr = new Date(arrivalISO);
  const sched = new Date(arr); sched.setHours(h, m, 0, 0);
  return Math.max(0, Math.round((arr - sched) / 60000));
}

function toISO(hhMm) {
  if (!hhMm || typeof hhMm !== 'string' || !hhMm.includes(':')) return null;
  const parts = hhMm.split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  const [h, m] = parts;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function fmtTime(iso) {
  if (!iso) return '—';
  try { return format(new Date(iso), 'HH:mm'); } catch { return '—'; }
}

/* ─── badge ─── */
function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.previsto;
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.color}33` }}>
      {c.label}
    </span>
  );
}

/* ─── Modal de ação ─── */
function ActionModal({ open, onClose, record, activity, onSave, currentUser, isAdmin }) {
  const alreadySaved = !!record?.registered_at;
  const hasArrival   = !!record?.arrival_time;
  const hasCheckout  = !!record?.checkout_time;

  const [status,       setStatus]       = useState(record?.status || 'presente');
  const [arrivalTime,  setArrivalTime]  = useState(hasArrival ? fmtTime(record.arrival_time) : format(new Date(), 'HH:mm'));
  const [lateTime,     setLateTime]     = useState(fmtTime(record?.late_arrival_time));
  const [checkoutTime, setCheckoutTime] = useState(fmtTime(record?.checkout_time));
  const [absenceType,  setAbsenceType]  = useState(record?.absence_type || '');
  const [justification,setJustification]= useState(record?.justification || '');
  const [adminReason,  setAdminReason]  = useState('');
  const [adminObs,     setAdminObs]     = useState('');
  const [saving,       setSaving]       = useState(false);

  // Reset ao abrir
  useEffect(() => {
    if (!open) return;
    setStatus(record?.status || 'presente');
    setArrivalTime(hasArrival ? fmtTime(record.arrival_time) : format(new Date(), 'HH:mm'));
    setLateTime(fmtTime(record?.late_arrival_time));
    setCheckoutTime(fmtTime(record?.checkout_time));
    setAbsenceType(record?.absence_type || '');
    setJustification(record?.justification || '');
    setAdminReason('');
    setAdminObs('');
  }, [open, record]);

  const isAbsence    = ['ausente','falta_justificada','falta_nao_justificada'].includes(status);
  const needsArrival = ['presente','atrasado','finalizado'].includes(status);

  // Lider não pode editar campos já gravados
  const arrivalReadOnly  = !isAdmin && hasArrival;
  const checkoutReadOnly = !isAdmin && hasCheckout;

  // Admin: motivo obrigatório se o registro já existe
  const adminRequiresReason = isAdmin && alreadySaved;
  const canSave = !saving
    && (!adminRequiresReason || (adminReason.trim() && adminObs.trim()));

  const handleSave = async () => {
    setSaving(true);
    const now = new Date().toISOString();

    const arrISO      = needsArrival && !arrivalReadOnly ? toISO(arrivalTime) : (record?.arrival_time || null);
    const lateISO     = lateTime ? toISO(lateTime) : (record?.late_arrival_time || null);
    const checkISO    = !checkoutReadOnly && checkoutTime ? toISO(checkoutTime) : (record?.checkout_time || null);
    const delayMins   = calcDelay(record?.scheduled_start || activity?.scheduled_start, arrISO);
    const finalStatus = delayMins > 0 && status === 'presente' ? 'atrasado' : status;

    // Horas trabalhadas
    let totalHours = record?.total_hours || 0;
    const checkinRef = record?.checkin_time || arrISO;
    if (checkinRef && checkISO) {
      totalHours = Math.round(((new Date(checkISO) - new Date(checkinRef)) / 3600000) * 100) / 100;
    }

    // Audit log entry (para qualquer mudança de admin em registro já existente)
    const auditEntry = isAdmin && alreadySaved ? {
      action:           'admin_edit',
      previous_status:  record.status,
      new_status:       finalStatus,
      previous_time:    record.arrival_time || null,
      new_time:         arrISO,
      field:            'multiple',
      before:           JSON.stringify({ status: record.status, arrival_time: record.arrival_time, checkout_time: record.checkout_time }),
      after:            JSON.stringify({ status: finalStatus, arrival_time: arrISO, checkout_time: checkISO }),
      reason:           adminReason,
      observation:      adminObs,
      user:             currentUser?.email || 'admin',
      user_role:        currentUser?.role  || 'admin',
      timestamp:        now,
    } : null;

    const payload = {
      status:          finalStatus,
      previous_status: record?.status || null,
      arrival_time:    arrISO,
      late_arrival_time: lateISO,
      checkout_time:   checkISO,
      delay_minutes:   delayMins,
      total_hours:     totalHours,
      absence_type:    isAbsence ? absenceType : '',
      justification:   isAbsence ? justification : '',
      registered_by:   currentUser?.email || 'sistema',
      registered_by_role: currentUser?.role || '',
      registered_at:   now,
      ...(record?.checkin_time ? {} : (needsArrival && arrISO ? { checkin_time: arrISO } : {})),
      ...(auditEntry ? { audit_log: [...(record?.audit_log || []), auditEntry] } : {}),
    };

    await onSave(record?.id, payload, record, finalStatus);
    setSaving(false);
    onClose();
  };

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <UserCheck className="w-4 h-4" style={{ color: '#14B8D4' }} />
            {record.employee_name} — Registrar Presença
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Status */}
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="presente">✅ Presente</SelectItem>
                <SelectItem value="atrasado">⏰ Atrasado (atraso calculado pelo sistema)</SelectItem>
                <SelectItem value="ausente">❌ Ausente</SelectItem>
                <SelectItem value="falta_justificada">📋 Falta Justificada</SelectItem>
                <SelectItem value="falta_nao_justificada">⚠️ Falta Não Justificada</SelectItem>
                <SelectItem value="substituido">🔄 Substituído</SelectItem>
                <SelectItem value="dispensado">🏠 Dispensado</SelectItem>
                <SelectItem value="finalizado">🏁 Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Horário previsto — sempre readonly */}
          {record?.scheduled_start && (
            <div>
              <Label className="text-xs">Horário Previsto</Label>
              <Input value={record.scheduled_start} readOnly className="mt-1.5 opacity-60 cursor-not-allowed" />
            </div>
          )}

          {/* Hora de chegada */}
          {needsArrival && (
            <div>
              <Label className="text-xs flex items-center gap-1.5">
                Hora de Chegada
                {arrivalReadOnly && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(252,82,82,0.12)', color: '#FC5252' }}>bloqueado</span>}
                {isAdmin && hasArrival && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(109,86,232,0.12)', color: '#6D56E8' }}>admin pode editar</span>}
              </Label>
              <Input
                type="time" value={arrivalTime}
                onChange={e => setArrivalTime(e.target.value)}
                readOnly={arrivalReadOnly}
                className={`mt-1.5 ${arrivalReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {!arrivalReadOnly && record?.scheduled_start && (
                <p className="text-[10px] mt-1" style={{ color: '#718096' }}>
                  Atraso calculado automaticamente pelo sistema com base no horário previsto ({record.scheduled_start})
                </p>
              )}
            </div>
          )}

          {/* Chegada posterior */}
          {needsArrival && (
            <div>
              <Label className="text-xs">Chegada Posterior (opcional)</Label>
              <Input type="time" value={lateTime} onChange={e => setLateTime(e.target.value)} className="mt-1.5" />
              <p className="text-[10px] mt-1" style={{ color: '#4A5568' }}>Registre se o colaborador saiu e retornou</p>
            </div>
          )}

          {/* Check-out */}
          {needsArrival && (
            <div>
              <Label className="text-xs flex items-center gap-1.5">
                Horário de Check-out
                {checkoutReadOnly && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(252,82,82,0.12)', color: '#FC5252' }}>bloqueado</span>}
              </Label>
              <Input
                type="time" value={checkoutTime}
                onChange={e => setCheckoutTime(e.target.value)}
                readOnly={checkoutReadOnly}
                className={`mt-1.5 ${checkoutReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
          )}

          {/* Ausência */}
          {isAbsence && (
            <>
              <div>
                <Label className="text-xs">Tipo de Falta</Label>
                <Select value={absenceType} onValueChange={setAbsenceType}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {ABSENCE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Justificativa</Label>
                <textarea
                  className="mt-1.5 w-full rounded-xl px-3 py-2 text-sm resize-none"
                  rows={3} placeholder="Descreva o motivo da ausência..."
                  value={justification} onChange={e => setJustification(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff' }}
                />
              </div>
            </>
          )}

          {/* Bloco admin — obrigatório quando edita registro já existente */}
          {isAdmin && (
            <div className="p-3 rounded-xl space-y-3"
              style={{ background: 'rgba(109,86,232,0.08)', border: '1px solid rgba(109,86,232,0.22)' }}>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" style={{ color: '#6D56E8' }} />
                <span className="text-[11px] font-bold" style={{ color: '#6D56E8' }}>Ajuste Administrativo</span>
              </div>
              <div>
                <Label className="text-xs">Motivo {adminRequiresReason && <span style={{ color: '#FC5252' }}>*</span>}</Label>
                <Input className="mt-1" placeholder="Ex: Correção retroativa solicitada pelo gestor..."
                  value={adminReason} onChange={e => setAdminReason(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Observação {adminRequiresReason && <span style={{ color: '#FC5252' }}>*</span>}</Label>
                <textarea
                  className="mt-1 w-full rounded-xl px-3 py-2 text-sm resize-none"
                  rows={2} placeholder="Detalhe a alteração realizada..."
                  value={adminObs} onChange={e => setAdminObs(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff' }}
                />
              </div>
              {adminRequiresReason && (!adminReason.trim() || !adminObs.trim()) && (
                <p className="text-[11px] flex items-center gap-1" style={{ color: '#FC5252' }}>
                  <AlertTriangle className="w-3 h-3" /> Motivo e observação obrigatórios para ajuste administrativo
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} disabled={!canSave} className="flex-1 font-bold">
              {saving ? 'Salvando...' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── componente principal ─── */
export default function AttendanceTab({ activity, teams = [] }) {
  const { workspaceId } = useWorkspace();
  const { loadTeamAttendance, saveAttendance } = useActivityServiceMutations({ activity });
  const { data: employees = [] } = useEmployees();
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  const isAdmin = currentUser?.role === 'admin';
  const today   = new Date().toISOString().slice(0, 10);

  const { data: records = [], isLoading } = useAttendanceRecords(activity?.id);

  const teamEmployees = useMemo(() =>
    employees.filter(e => e.team_id === activity?.team_id && e.status !== 'inactive'),
  [employees, activity?.team_id]);

  const team = teams.find(t => t.id === activity?.team_id);

  /* Cria registros "previsto" para os colaboradores da equipe que ainda não têm registro hoje */
  const loadTeamToday = async () => {
    const todayRecs = records.filter(r => r.date === today);
    const existing  = new Set(todayRecs.map(r => r.employee_id));
    const missing   = teamEmployees.filter(e => !existing.has(e.id));
    if (!missing.length) { toast.info('Equipe já carregada para hoje'); return; }
    await loadTeamAttendance.mutateAsync({ workspaceId, team, employees: missing, records, today });
    toast.success(`${missing.length} colaborador(es) carregado(s)`);
  };

  /* Salva registro e grava evento no audit_trail da atividade */
  const handleSave = async (recordId, payload, oldRecord, finalStatus) => {
    await saveAttendance.mutateAsync({
      workspaceId,
      recordId,
      payload,
      oldRecord,
      finalStatus,
      currentUser,
    });
    toast.success('Presença registrada!');
  };

  /* Agrupa por data */
  const byDate = useMemo(() => {
    const map = {};
    records.forEach(r => { if (!map[r.date]) map[r.date] = []; map[r.date].push(r); });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [records]);

  const todayRecs     = records.filter(r => r.date === today);
  const presentCount  = todayRecs.filter(r => ['presente','atrasado','finalizado'].includes(r.status)).length;
  const absentCount   = todayRecs.filter(r => ['ausente','falta_justificada','falta_nao_justificada'].includes(r.status)).length;
  const pendingCount  = todayRecs.filter(r => r.status === 'previsto').length;

  if (isLoading) return (
    <div className="py-8 text-center text-sm" style={{ color: '#718096' }}>Carregando presenças...</div>
  );

  return (
    <div className="space-y-4">
      {/* KPIs do dia */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Presentes',  value: presentCount, color: '#00D99A', bg: 'rgba(0,217,154,0.08)'   },
          { label: 'Ausentes',   value: absentCount,  color: '#FC5252', bg: 'rgba(252,82,82,0.08)'   },
          { label: 'Pendentes',  value: pendingCount,  color: '#718096', bg: 'rgba(113,128,150,0.08)' },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-3 text-center"
            style={{ background: k.bg, border: `1px solid ${k.color}22` }}>
            <p className="text-xl font-black" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[11px]" style={{ color: '#718096' }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Botões de ação */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={loadTeamToday} className="gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> Carregar Equipe de Hoje
        </Button>
        <button
          onClick={() => setShowAddSheet(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
          style={{
            background: 'rgba(0,217,154,0.10)',
            border: '1px solid rgba(0,217,154,0.28)',
            color: '#00D99A',
          }}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Adicionar Colaborador
        </button>
      </div>

      {/* Tabelas por data */}
      {byDate.length === 0 ? (
        <div className="py-10 text-center">
          <UserX className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm" style={{ color: '#718096' }}>Nenhuma presença registrada</p>
          <p className="text-xs mt-1" style={{ color: '#4A5568' }}>Clique em "Carregar Equipe de Hoje" para iniciar</p>
        </div>
      ) : byDate.map(([date, dateRecs]) => (
        <div key={date} className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>

          {/* cabeçalho data */}
          <div className="px-4 py-2.5 flex items-center justify-between"
            style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-xs font-bold text-white">
              {date === today ? '📅 Hoje — ' : ''}
              {format(new Date(date + 'T12:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </span>
            <span className="text-[11px]" style={{ color: '#718096' }}>{dateRecs.length} colaborador(es)</span>
          </div>

          {/* linhas */}
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {dateRecs.map(rec => (
              <div key={rec.id} className="px-4 py-3 flex items-start gap-3 hover:bg-white/[0.02] transition-colors">

                {/* avatar */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5"
                  style={{ background: 'rgba(20,184,212,0.15)', color: '#14B8D4' }}>
                  {(rec.employee_name || '?')[0].toUpperCase()}
                </div>

                {/* info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">{rec.employee_name}</span>
                    <StatusBadge status={rec.status} />
                    {rec.delay_minutes > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(232,125,0,0.15)', color: '#E87D00' }}>
                        +{rec.delay_minutes}min
                      </span>
                    )}
                    {rec.audit_log?.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(109,86,232,0.15)', color: '#6D56E8' }}>
                        {rec.audit_log.length} ajuste(s)
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                    {rec.employee_role && <span className="text-[11px]" style={{ color: '#4A5568' }}>{rec.employee_role}</span>}
                    {rec.scheduled_start && <span className="text-[11px]" style={{ color: '#4A5568' }}>Previsto: {rec.scheduled_start}</span>}
                    {rec.checkin_time && <span className="text-[11px]" style={{ color: '#A0AEC0' }}>Check-in: {fmtTime(rec.checkin_time)}</span>}
                    {rec.arrival_time && <span className="text-[11px]" style={{ color: '#A0AEC0' }}>Chegada: {fmtTime(rec.arrival_time)}</span>}
                    {rec.late_arrival_time && <span className="text-[11px]" style={{ color: '#E87D00' }}>Retorno: {fmtTime(rec.late_arrival_time)}</span>}
                    {rec.checkout_time && <span className="text-[11px]" style={{ color: '#A0AEC0' }}>Saída: {fmtTime(rec.checkout_time)}</span>}
                    {rec.total_hours > 0 && <span className="text-[11px] font-semibold" style={{ color: '#14B8D4' }}>{rec.total_hours}h trabalhadas</span>}
                    {rec.absence_type && <span className="text-[11px]" style={{ color: '#718096' }}>Falta: {rec.absence_type}</span>}
                    {rec.justification && <span className="text-[11px] italic" style={{ color: '#718096' }}>"{rec.justification}"</span>}
                    {rec.registered_by && <span className="text-[10px]" style={{ color: '#4A5568' }}>por {rec.registered_by} · {fmtTime(rec.registered_at)}</span>}
                  </div>
                </div>

                {/* ação */}
                {(date === today || isAdmin) && (
                  <button
                    onClick={() => { setSelectedRecord(rec); setShowModal(true); }}
                    className="shrink-0 p-1.5 rounded-lg transition-all hover:bg-white/5 mt-0.5"
                    style={{ color: isAdmin && date !== today ? '#6D56E8' : '#718096' }}
                    title={isAdmin && date !== today ? 'Ajuste administrativo' : 'Registrar presença'}
                  >
                    {isAdmin && date !== today
                      ? <Shield className="w-3.5 h-3.5" />
                      : <Pencil className="w-3.5 h-3.5" />
                    }
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <ActionModal
        open={showModal}
        onClose={() => { setShowModal(false); setSelectedRecord(null); }}
        record={selectedRecord}
        activity={activity}
        onSave={handleSave}
        currentUser={currentUser}
        isAdmin={isAdmin}
      />

      <AddCollaboratorSheet
        open={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        activity={activity}
        teams={teams}
      />
    </div>
  );
}
