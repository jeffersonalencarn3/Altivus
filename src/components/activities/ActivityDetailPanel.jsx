/**
 * Painel lateral completo da atividade — hub operacional
 * Integra: planejamento, execução (check-in/out), progresso, alertas
 */
import React, { useState, useEffect } from 'react';
import { calcularPrevisao, gerarAlertas } from '@/lib/planningEngine';
import { useMaterials, useEmployees } from '@/lib/useAppData';
import { useOperationalExecution } from '@/lib/useOperationalExecution';
import { useAuth } from '@/lib/AuthContext';
import { usePermissions } from '@/lib/usePermissions';
import { useActivityServiceMutations } from '@/hooks/services/useActivityServiceMutations';
import { Button } from '@/components/ui/button';
import {
  X, AlertTriangle, PlayCircle, StopCircle, CheckCircle2, Camera, Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CheckinModal from '@/components/activities/CheckinModal';
import CheckoutModal from '@/components/activities/CheckoutModal';
import ExecutionTimer from '@/components/activities/ExecutionTimer';
import OperationalBar from '@/components/activities/OperationalBar';
import PlanningTab from '@/components/activities/PlanningTab';
import OperationalMapTab from '@/components/operationalmap/OperationalMapTab';
import AttendanceTab from '@/components/activities/AttendanceTab';
import ActivityHistoryTab from '@/components/activities/ActivityHistoryTab';
import GenerateReportModal from '@/components/reports/GenerateReportModal';
export default function ActivityDetailPanel({ activity, teams = [], onClose, onRefresh }) {
  const { user } = useAuth();
  const { canCheckin, canCheckout, canAddDescida, canUploadPhoto, isReadOnly } = usePermissions();
  const execution = useOperationalExecution(activity);
  const { sessions, attendanceRecords, activeSession, todaySession, today, metrics } = execution;
  const { data: materials = [] } = useMaterials();

  const [showCheckin, setShowCheckin]       = useState(false);
  const [showCheckout, setShowCheckout]     = useState(false);
  const [showGenReport, setShowGenReport]   = useState(false);
  const [loadingAction, setLoadingAction]   = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const { data: employees = [] } = useEmployees();
  const [activeTab, setActiveTab]           = useState('execucao');

  const {
    checkin,
    checkout,
    uploadDuringPhoto,
    addDescent,
  } = useActivityServiceMutations({
    activity,
    activeSession,
    materials,
    today,
    user,
    onRefresh,
  });

  // Notifica outros componentes que o painel lateral está aberto
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('altivus:side_panel', { detail: { open: true } }));
    return () => {
      window.dispatchEvent(new CustomEvent('altivus:side_panel', { detail: { open: false } }));
    };
  }, []);

  if (!activity) return null;

  const previsao = calcularPrevisao(activity, sessions);
  const alertas  = gerarAlertas(activity, previsao);
  const team     = teams.find(t => t.id === activity.team_id);

  const {
    elapsedMinutes,
    executedToday,
    plannedToday,
    executedTotal,
    plannedTotal,
    completionPct,
    presence,
    facadeProgress,
    remainingToday,
    remainingTotal,
  } = metrics;

  /* ── CHECK-IN ── */
  const handleCheckin = async ({ checklist, descidas_planejadas_hoje }) => {
    if (!canCheckin) { toast.error('Sem permissão para realizar check-in'); return; }
    setLoadingAction(true);
    try {
      await checkin.mutateAsync({ checklist, descidas_planejadas_hoje });
      toast.success('Execução iniciada!');
      setShowCheckin(false);
    } catch (e) { toast.error(e.message); }
    setLoadingAction(false);
  };

  /* ── CHECK-OUT ── */
  const handleCheckout = async ({ descidas_realizadas, observacoes, checklist_fim, materiais_utilizados, fotos_depois, executed_area, execution_status, execution_justificativa, checkout_photos }) => {
    if (!activeSession) return;
    if (!canCheckout) { toast.error('Sem permissão para realizar check-out'); return; }
    setLoadingAction(true);
    try {
      const result = await checkout.mutateAsync({
        checkoutData: {
          descidas_realizadas,
          observacoes,
          checklist_fim,
          materiais_utilizados,
          fotos_depois,
          executed_area: executed_area || null,
          execution_status: execution_status || null,
          execution_justificativa: execution_justificativa || null,
          checkout_photos: checkout_photos || [],
        },
      });
      toast.success('Atividade finalizada!');
      setShowCheckout(false);
      if (result?.progress >= 100 || result?.newStatus === 'completed') {
        setTimeout(() => setShowGenReport(true), 600);
      }
    } catch (e) { toast.error(e.message); }
    setLoadingAction(false);
  };

  /* ── FOTO DURANTE EXECUÇÃO ── */
  const addDuringPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeSession) return;
    if (!canUploadPhoto) { toast.error('Sem permissão para enviar fotos'); return; }
    setUploadingPhoto(true);
    try {
      await uploadDuringPhoto.mutateAsync({ file });
    } catch { toast.error('Erro ao enviar foto'); }
    setUploadingPhoto(false);
  };

  /* ── +1 DESCIDA EM TEMPO REAL ── */
  const addDescida = async () => {
    if (!activeSession) return;
    if (!canAddDescida) { toast.error('Sem permissão'); return; }
    await addDescent.mutateAsync();
  };



  const tabs = [
    { id: 'execucao', label: 'Execução' },
    { id: 'presenca', label: 'Presença' },
    { id: 'mapa', label: 'Mapa Operacional' },
    { id: 'planejamento', label: 'Planejamento' },
    { id: 'historico', label: 'Histórico' },
  ];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Painel */}
      <div
        className="fixed right-0 top-0 h-full z-[110] flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(480px, 100vw)',
          background: 'linear-gradient(160deg, rgba(8,14,30,0.98) 0%, rgba(5,10,22,0.99) 100%)',
          borderLeft: '1px solid rgba(20,184,212,0.2)',
          boxShadow: '-8px 0 48px rgba(0,0,0,0.8)',
        }}
      >
        {/* ── Header ── */}
        <div className="shrink-0 p-4 border-b border-white/5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                  style={{
                    background: activity.tipo_servico === 'telhado' ? 'rgba(20,184,212,0.12)' : 'rgba(109,86,232,0.12)',
                    color: activity.tipo_servico === 'telhado' ? '#14B8D4' : '#6D56E8',
                  }}>
                  {activity.tipo_servico === 'telhado' ? '🏗 Telhado' : activity.tipo_servico === 'fachada' ? '🏢 Fachada' : 'Atividade'}
                </span>
                {alertas.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(252,82,82,0.12)', color: '#FC5252', border: '1px solid rgba(252,82,82,0.3)' }}>
                    {alertas.length} alerta{alertas.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-white truncate">{activity.title}</h2>
              <p className="text-xs text-white/40 mt-0.5">{team?.name || '—'} · {activity.num_alpinistas || 1} alpinista(s)</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white ml-2 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={activeTab === t.id
                  ? { background: 'rgba(20,184,212,0.15)', color: '#14B8D4', border: '1px solid rgba(20,184,212,0.3)' }
                  : { background: 'rgba(255,255,255,0.04)', color: '#718096', border: '1px solid rgba(255,255,255,0.07)' }
                }>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Conteúdo scrollável ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* ════ ABA: EXECUÇÃO ════ */}
          {activeTab === 'execucao' && (
            <>
              {/* Timer — só quando em execução */}
              {activeSession && (
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00D99A', boxShadow: '0 0 8px #00D99A' }} />
                    <span className="text-xs font-bold" style={{ color: '#00D99A' }}>Em Execução</span>
                    <span className="text-xs" style={{ color: '#4A5568' }}>
                      · desde {format(new Date(activeSession.hora_inicio), "HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <ExecutionTimer startTime={activeSession.hora_inicio} />
                </div>
              )}

              {/* OperationalBar — barra inteligente */}
              <OperationalBar
                executedTotal={executedTotal}
                executedToday={executedToday}
                plannedTotal={plannedTotal}
                plannedToday={plannedToday}
                areaM2={activity.area_m2 || 0}
                elapsedMinutes={elapsedMinutes}
                active={!!activeSession}
                completionPct={completionPct}
                presence={presence}
                facadeProgress={facadeProgress}
                remainingToday={remainingToday}
                remainingTotal={remainingTotal}
              />

              {/* Botão +1 descida — destaque máximo durante execução */}
              {activeSession && canAddDescida && (
                <button
                  onClick={addDescida}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl py-4 transition-all active:scale-[0.97] font-black text-sm"
                  style={{
                    background: 'linear-gradient(135deg, rgba(20,184,212,0.14), rgba(0,217,154,0.10))',
                    border: '1px solid rgba(20,184,212,0.35)',
                    color: '#14B8D4',
                    boxShadow: '0 0 16px rgba(20,184,212,0.08)',
                  }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(20,184,212,0.15)', border: '1px solid rgba(20,184,212,0.3)' }}>
                    <Plus className="w-5 h-5" />
                  </div>
                  Registrar Descida
                  <span className="ml-1 px-2 py-0.5 rounded-full text-xs"
                    style={{ background: 'rgba(20,184,212,0.15)', color: '#14B8D4' }}>
                    {executedToday}
                  </span>
                </button>
              )}

              {/* Foto durante */}
              {activeSession && (
                <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer w-full justify-center"
                  style={{ background: 'rgba(109,86,232,0.07)', border: '1px solid rgba(109,86,232,0.20)', color: '#6D56E8' }}>
                  <Camera className="w-3.5 h-3.5" />
                  {uploadingPhoto ? 'Enviando foto...' : 'Adicionar foto da execução'}
                  <input type="file" accept="image/*" className="hidden" onChange={addDuringPhoto} disabled={uploadingPhoto} />
                </label>
              )}

              {/* Fotos durante */}
              {activeSession && (activeSession.fotos_durante || []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeSession.fotos_durante.map((url, i) => (
                    <img key={i} src={url} alt="" className="w-14 h-14 rounded-xl object-cover"
                      style={{ border: '1px solid rgba(255,255,255,0.08)' }} />
                  ))}
                </div>
              )}

              {/* Resumo dia finalizado */}
              {todaySession && !activeSession && (
                <div className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: 'rgba(0,217,154,0.06)', border: '1px solid rgba(0,217,154,0.20)' }}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#00D99A' }} />
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#00D99A' }}>Execução de hoje finalizada</p>
                    <p className="text-xs mt-0.5" style={{ color: '#718096' }}>
                      {todaySession.descidas_realizadas || 0} descidas · {Math.round((todaySession.tempo_total_minutos || 0) / 60 * 10) / 10}h
                    </p>
                  </div>
                </div>
              )}

              {/* Alertas do planning engine */}
              {alertas.length > 0 && (
                <div className="space-y-2">
                  {alertas.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs p-3 rounded-xl"
                      style={{
                        background: a.tipo === 'falta_equipe' ? 'rgba(20,184,212,0.08)' : 'rgba(252,82,82,0.08)',
                        color: a.tipo === 'falta_equipe' ? '#14B8D4' : '#FC5252',
                        border: `1px solid ${a.tipo === 'falta_equipe' ? 'rgba(20,184,212,0.2)' : 'rgba(252,82,82,0.2)'}`,
                      }}>
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      {a.msg}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ════ ABA: PRESENÇA E CHECK-IN ════ */}
          {activeTab === 'presenca' && (
            <AttendanceTab activity={activity} teams={teams} />
          )}

          {/* ════ ABA: MAPA OPERACIONAL ════ */}
          {activeTab === 'mapa' && (
            <OperationalMapTab activity={activity} session={activeSession} />
          )}

          {/* ════ ABA: PLANEJAMENTO ════ */}
          {activeTab === 'planejamento' && (
            <PlanningTab
              activity={activity}
              sessions={sessions}
              teams={teams}
              onRefresh={invalidate}
            />
          )}

          {/* ════ ABA: HISTÓRICO ════ */}
          {activeTab === 'historico' && (
            <ActivityHistoryTab activity={activity} />
          )}
        </div>

        {/* ── Botão inteligente fixo no rodapé ── */}
        {activity.status !== 'completed' && !isReadOnly && (
          <div className="shrink-0 p-4 border-t border-white/5" style={{ background: 'rgba(5,10,22,0.95)' }}>
            {activeSession ? (
              <div className="space-y-2">
                {canCheckout ? (
                  <Button
                    className="w-full font-bold gap-2"
                    style={{ background: 'linear-gradient(135deg,#FC5252,#E87D00)', color: '#fff' }}
                    onClick={(e) => { e.stopPropagation(); setShowCheckout(true); }}
                    disabled={loadingAction}
                  >
                    <StopCircle className="w-4 h-4" /> Finalizar Atividade do Dia
                  </Button>
                ) : (
                  <div className="text-center text-xs py-2" style={{ color: '#718096' }}>Em execução — sem permissão para finalizar</div>
                )}
              </div>
            ) : todaySession ? (
              <div className="flex items-center justify-center gap-2 py-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: '#00D99A' }} />
                <span className="text-sm font-semibold" style={{ color: '#00D99A' }}>Execução de hoje concluída</span>
              </div>
            ) : canCheckin ? (
              <Button
                className="w-full font-bold gap-2"
                style={{ background: 'linear-gradient(135deg,#00D99A,#14B8D4)', color: '#020B14' }}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('START_ACTIVITY_CLICK', activity?.id);
                  setShowCheckin(true);
                }}
                disabled={loadingAction}
              >
                <PlayCircle className="w-4 h-4" /> Iniciar Atividade do Dia
              </Button>
            ) : null}
          </div>
        )}
        {activity.status !== 'completed' && isReadOnly && (
          <div className="shrink-0 p-4 border-t border-white/5 flex items-center justify-center gap-2">
            <span className="text-xs" style={{ color: '#4A5568' }}>🔒 Modo somente leitura</span>
          </div>
        )}
        {activity.status === 'completed' && (
          <div className="shrink-0 p-4 border-t border-white/5 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" style={{ color: '#00D99A' }} />
            <span className="text-sm font-bold" style={{ color: '#00D99A' }}>Atividade Concluída</span>
          </div>
        )}
      </div>

      {/* Modais */}
      <CheckinModal
        open={showCheckin}
        onClose={() => setShowCheckin(false)}
        onConfirm={handleCheckin}
        activity={activity}
        team={team}
        alreadyStarted={!!todaySession}
        loading={loadingAction}
      />
      <CheckoutModal
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        onConfirm={handleCheckout}
        session={activeSession}
        activity={activity}
        materials={materials}
        loading={loadingAction}
      />

      <GenerateReportModal
        open={showGenReport}
        onClose={() => setShowGenReport(false)}
        activity={activity}
        sessions={sessions}
        attendanceRecords={attendanceRecords}
        team={team}
        employees={employees}
      />
    </>
  );
}
