import React, { useState, useRef } from 'react';
import { useActivitySessions } from '@/lib/useAppData';
import { useMaterials } from '@/lib/useAppData';
import { useActivityServiceMutations } from '@/hooks/services/useActivityServiceMutations';
import CheckinModal from './CheckinModal';
import CheckoutModal from './CheckoutModal';
import ExecutionTimer from './ExecutionTimer';
import VisualHistoryTimeline from '@/components/operationalmap/VisualHistoryTimeline';
import { Button } from '@/components/ui/button';
import { Camera, PlayCircle, StopCircle, CheckCircle2, Plus, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ActivityExecutionPanel({ activity, team }) {
  const { data: sessions = [] } = useActivitySessions(activity?.id);
  const { data: materials = [] } = useMaterials();
  const [showCheckin, setShowCheckin] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showVisualHistory, setShowVisualHistory] = useState(false);
  const duringRef = useRef();

  const today = new Date().toISOString().split('T')[0];
  const activeSession = sessions.find(s => s.status === 'em_execucao');
  const todaySession = sessions.find(s => s.date === today && s.team_id === activity?.team_id);

  const {
    checkin: checkinMut,
    checkout: checkoutMut,
    uploadDuringPhoto,
    addDescent: addDescentMut,
  } = useActivityServiceMutations({
    activity,
    activeSession,
    materials,
    today,
  });

  const handleCheckin = (payload) => {
    checkinMut.mutate(payload, {
      onSuccess: () => setShowCheckin(false),
    });
  };

  const handleCheckout = (payload) => {
    checkoutMut.mutate({
      checkoutData: {
        ...payload,
        visual_checkout_map: payload.visual_checkout_map || null,
        executed_area: payload.executed_area || null,
        execution_status: payload.execution_status || null,
        execution_justificativa: payload.execution_justificativa || null,
        checkout_photos: payload.checkout_photos || [],
      },
    }, {
      onSuccess: () => setShowCheckout(false),
    });
  };

  const addDuringPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeSession) return;
    uploadDuringPhoto.mutate({ file });
  };

  const addDescida = () => {
    if (!activeSession) return;
    addDescentMut.mutate();
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
                  disabled={uploadDuringPhoto.isPending}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: 'rgba(109,86,232,0.12)', border: '1px solid rgba(109,86,232,0.30)', color: '#6D56E8' }}>
                  <Camera className="w-3.5 h-3.5" />
                  {uploadDuringPhoto.isPending ? 'Enviando...' : 'Foto'}
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
        onConfirm={handleCheckin}
        activity={activity}
        team={team}
        alreadyStarted={!!todaySession}
        loading={checkinMut.isPending}
      />
      <CheckoutModal
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        onConfirm={handleCheckout}
        session={activeSession}
        activity={activity}
        materials={materials}
        loading={checkoutMut.isPending}
        checkinMap={activeCheckinMap}
      />
    </div>
  );
}
