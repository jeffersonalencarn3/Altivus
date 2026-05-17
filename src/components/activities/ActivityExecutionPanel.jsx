import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { useWorkspace } from '@/lib/useWorkspace';
import { useAuth } from '@/lib/AuthContext';
import { useActivitySessions } from '@/lib/useAppData';
import { useMaterials } from '@/lib/useAppData';
import { base44 } from '@/api/base44Client';
import CheckinModal from './CheckinModal';
import CheckoutModal from './CheckoutModal';
import ExecutionTimer from './ExecutionTimer';
import VisualHistoryTimeline from '@/components/operationalmap/VisualHistoryTimeline';
import { Button } from '@/components/ui/button';
import { Camera, PlayCircle, StopCircle, CheckCircle2, Plus, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { activityService } from '@/services/activityService';
import { invalidateGroup } from '@/services/serviceUtils';
import { mergeEntityRecord } from '@/services/realtimeService';

export default function ActivityExecutionPanel({ activity, team }) {
  const db = useWorkspaceEntities();
  const { workspaceId } = useWorkspace();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: sessions = [] } = useActivitySessions(activity?.id);
  const { data: materials = [] } = useMaterials();
  const [showCheckin, setShowCheckin] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [uploadingDuring, setUploadingDuring] = useState(false);
  const [showVisualHistory, setShowVisualHistory] = useState(false);
  const duringRef = useRef();

  const today = new Date().toISOString().split('T')[0];
  const activeSession = sessions.find(s => s.status === 'em_execucao');
  const todaySession = sessions.find(s => s.date === today && s.team_id === activity?.team_id);

  const invalidate = () => {
    invalidateGroup(qc, workspaceId, 'activities');
    invalidateGroup(qc, workspaceId, 'materials');
  };

  const mergeSessionCache = (session) => {
    mergeEntityRecord(qc, workspaceId, 'ActivitySession', session, ['activitySessions']);
  };

  const mergeActivityCache = (nextActivity) => {
    mergeEntityRecord(qc, workspaceId, 'Activity', nextActivity, ['activities']);
  };

  const checkinMut = useMutation({
    mutationFn: ({ checklist, visual_checkin_map }) => activityService.checkin(db, {
      activity,
      today,
      checklist,
      visual_checkin_map: visual_checkin_map || null,
      user,
    }),
    onSuccess: (session) => {
      mergeSessionCache(session);
      if (activity.status === 'not_started') {
        mergeActivityCache({ ...activity, status: 'in_progress' });
      }
      invalidate();
      setShowCheckin(false);
    },
  });

  const checkoutMut = useMutation({
    mutationFn: ({ descidas_realizadas, observacoes, checklist_fim, materiais_utilizados, fotos_depois, visual_checkout_map, executed_area, execution_status, execution_justificativa, checkout_photos }) => activityService.checkout(db, {
      activity,
      activeSession,
      materials,
      user,
      checkoutData: {
        descidas_realizadas,
        observacoes,
        checklist_fim,
        materiais_utilizados,
        fotos_depois,
        visual_checkout_map: visual_checkout_map || null,
        // Novos campos adicionais
        executed_area: executed_area || null,
        execution_status: execution_status || null,
        execution_justificativa: execution_justificativa || null,
        checkout_photos: checkout_photos || [],
      },
    }),
    onSuccess: (result, variables) => {
      mergeSessionCache(result?.session || {
        ...activeSession,
        descidas_realizadas: variables?.descidas_realizadas,
        status: 'finalizado',
      });
      mergeActivityCache(result?.activity || {
        ...activity,
        descents_completed: (activity.descents_completed || 0) + Number(variables?.descidas_realizadas || 0),
        progress: result?.progress,
        status: result?.newStatus,
      });
      invalidate();
      setShowCheckout(false);
    },
  });

  const addDuringPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeSession) return;
    setUploadingDuring(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const session = await activityService.addDuringPhoto(db, { activeSession, fileUrl: file_url });
    mergeSessionCache(session || {
      ...activeSession,
      fotos_durante: [...(activeSession.fotos_durante || []), file_url],
    });
    invalidate();
    setUploadingDuring(false);
  };

  const addDescida = async () => {
    if (!activeSession) return;
    const session = await activityService.addDescent(db, { activeSession });
    mergeSessionCache(session || {
      ...activeSession,
      descidas_realizadas: (activeSession.descidas_realizadas || 0) + 1,
    });
    invalidate();
  };

  const pastSessions = sessions.filter(s => s.status === 'finalizado').slice(0, 5);
  // Mapa do check-in da sessão ativa (para passar ao checkout)
  const activeCheckinMap = activeSession?.visual_checkin_map || null;
  // Sessões com mapa visual (para timeline)
  const sessionsWithVisual = sessions.filter(s => s.visual_checkin_map || s.visual_checkout_map);

  return (
    <div className="space-y-4">
      {/* ── Botão inteligente ── */}
      <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(145deg,rgba(12,18,36,0.95),rgba(6,10,22,0.98))', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#718096' }}>
              Status de Execução Hoje
            </p>
            {activeSession ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00D99A', boxShadow: '0 0 8px #00D99A' }} />
                  <span className="text-sm font-bold" style={{ color: '#00D99A' }}>Em Execução</span>
                </div>
                <p className="text-xs" style={{ color: '#A0AEC0' }}>
                  Iniciado em {format(new Date(activeSession.hora_inicio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
                <ExecutionTimer startTime={activeSession.hora_inicio} />
              </div>
            ) : todaySession ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: '#14B8D4' }} />
                <span className="text-sm font-bold" style={{ color: '#14B8D4' }}>Finalizado hoje</span>
              </div>
            ) : (
              <p className="text-sm" style={{ color: '#A0AEC0' }}>Nenhuma execução ativa</p>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            {activeSession ? (
              <>
                {/* Foto durante */}
                <button onClick={() => duringRef.current?.click()}
                  disabled={uploadingDuring}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: 'rgba(109,86,232,0.12)', border: '1px solid rgba(109,86,232,0.30)', color: '#6D56E8' }}>
                  <Camera className="w-3.5 h-3.5" />
                  {uploadingDuring ? 'Enviando...' : 'Foto'}
                </button>
                <input ref={duringRef} type="file" accept="image/*" className="hidden" onChange={addDuringPhoto} />

                {/* +1 descida */}
                <button onClick={addDescida}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: 'rgba(20,184,212,0.10)', border: '1px solid rgba(20,184,212,0.28)', color: '#14B8D4' }}>
                  <Plus className="w-3.5 h-3.5" />
                  Descida ({activeSession.descidas_realizadas || 0})
                </button>

                {/* Finalizar */}
                <Button onClick={() => setShowCheckout(true)}
                  className="gap-2 font-bold"
                  style={{ background: 'linear-gradient(135deg,#14B8D4,#6D56E8)', color: '#020B14' }}>
                  <StopCircle className="w-4 h-4" />
                  Finalizar Atividade
                </Button>
              </>
            ) : sessionsWithVisual.length > 0 && !activeSession ? (
              <>
                {/* Botão histórico visual */}
                <button
                  onClick={() => setShowVisualHistory(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: 'rgba(109,86,232,0.12)', border: '1px solid rgba(109,86,232,0.30)', color: '#6D56E8' }}>
                  <BarChart2 className="w-3.5 h-3.5" />
                  Histórico Visual ({sessionsWithVisual.length})
                </button>
              </>
            ) : (
              <Button
                onClick={() => setShowCheckin(true)}
                disabled={!!todaySession}
                className="gap-2 font-bold"
                style={!todaySession ? { background: 'linear-gradient(135deg,#00D99A,#14B8D4)', color: '#020B14' } : {}}
              >
                <PlayCircle className="w-4 h-4" />
                {todaySession ? 'Já executado hoje' : 'Iniciar Atividade'}
              </Button>
            )}
          </div>
        </div>

        {/* Fotos durante em execução */}
        {activeSession && (activeSession.fotos_durante || []).length > 0 && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#718096' }}>Fotos durante execução</p>
            <div className="flex flex-wrap gap-2">
              {activeSession.fotos_durante.map((url, i) => (
                <img key={i} src={url} alt="" className="w-14 h-14 rounded-lg object-cover" style={{ border: '1px solid rgba(255,255,255,0.10)' }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Histórico Visual ── */}
      {showVisualHistory && sessionsWithVisual.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(109,86,232,0.04)', border: '1px solid rgba(109,86,232,0.15)' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#6D56E8' }}>Histórico Visual Operacional</p>
          <VisualHistoryTimeline sessions={sessions} />
        </div>
      )}

      {/* ── Histórico de execuções ── */}
      {pastSessions.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#718096' }}>Histórico de Execuções</p>
          <div className="space-y-2">
            {pastSessions.map(s => (
              <div key={s.id} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: '#A0AEC0' }}>{format(new Date(s.date), 'dd/MM/yyyy')}</span>
                <span style={{ color: '#14B8D4' }}>{s.descidas_realizadas || 0} descidas</span>
                <span style={{ color: '#718096' }}>
                  {s.hora_inicio ? format(new Date(s.hora_inicio), 'HH:mm') : '—'} →
                  {s.hora_fim ? format(new Date(s.hora_fim), ' HH:mm') : ' em execução'}
                </span>
                <span style={{ color: s.status === 'finalizado' ? '#00D99A' : '#E87D00' }}>
                  {s.status === 'finalizado' ? 'Finalizado' : 'Em execução'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <CheckinModal
        open={showCheckin}
        onClose={() => setShowCheckin(false)}
        onConfirm={checkinMut.mutate}
        activity={activity}
        team={team}
        alreadyStarted={!!todaySession}
        loading={checkinMut.isPending}
      />
      <CheckoutModal
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        onConfirm={checkoutMut.mutate}
        session={activeSession}
        activity={activity}
        materials={materials}
        loading={checkoutMut.isPending}
        checkinMap={activeCheckinMap}
      />
    </div>
  );
}
