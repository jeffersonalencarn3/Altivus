/**
 * OperationalBar — barra inteligente de execução operacional por descidas
 * Status automático: aguardando → em execução → produção estável → fase final → concluído
 */
import React, { useMemo } from 'react';
import { CheckCircle2, TrendingUp, TrendingDown, Zap, Users, Gauge, Layers } from 'lucide-react';

function getOperationalStatus(executed, planned) {
  if (!planned || planned === 0) return { label: 'SEM META', color: '#718096', bg: 'rgba(113,128,150,0.10)', border: 'rgba(113,128,150,0.25)' };
  const pct = (executed / planned) * 100;
  if (executed === 0)    return { label: 'AGUARDANDO EXECUÇÃO', color: '#718096', bg: 'rgba(113,128,150,0.08)', border: 'rgba(113,128,150,0.20)', pulse: false };
  if (pct < 50)          return { label: 'EM EXECUÇÃO',         color: '#14B8D4', bg: 'rgba(20,184,212,0.08)',  border: 'rgba(20,184,212,0.25)',  pulse: true  };
  if (pct < 80)          return { label: 'PRODUÇÃO ESTÁVEL',    color: '#00D99A', bg: 'rgba(0,217,154,0.08)',   border: 'rgba(0,217,154,0.25)',   pulse: false };
  if (pct < 100)         return { label: 'FASE FINAL',          color: '#6D56E8', bg: 'rgba(109,86,232,0.10)', border: 'rgba(109,86,232,0.28)',  pulse: true  };
  return                        { label: 'EXECUÇÃO CONCLUÍDA',  color: '#00D99A', bg: 'rgba(0,217,154,0.10)',   border: 'rgba(0,217,154,0.30)',   pulse: false, done: true };
}

function getBarColor(executed, planned) {
  if (!planned) return 'linear-gradient(90deg,#14B8D4,#6D56E8)';
  const pct = (executed / planned) * 100;
  if (pct >= 100) return 'linear-gradient(90deg,#00D99A,#14B8D4)';
  if (pct >= 80)  return 'linear-gradient(90deg,#6D56E8,#00D99A)';
  if (pct >= 50)  return 'linear-gradient(90deg,#14B8D4,#00D99A)';
  if (pct > 0)    return 'linear-gradient(90deg,#14B8D4,#6D56E8)';
  return 'rgba(113,128,150,0.3)';
}

export default function OperationalBar({
  executedTotal,    // descidas totais da atividade (todos os dias)
  executedToday,    // descidas do dia ativo
  plannedTotal,     // descents_planned da atividade
  plannedToday,     // meta de hoje (definida no check-in)
  areaM2,           // área total em m²
  elapsedMinutes,   // minutos desde início da sessão ativa
  active,           // true = sessão ativa aberta
  completionPct,
  presence,
  facadeProgress,
  remainingToday,
  remainingTotal,
}) {
  const pctTotal = typeof completionPct === 'number'
    ? Math.min(100, Math.max(0, Math.round(completionPct)))
    : (plannedTotal > 0 ? Math.min(100, Math.round((executedTotal / plannedTotal) * 100)) : 0);
  const pctToday = plannedToday > 0 ? Math.min(100, Math.round((executedToday  / plannedToday)  * 100)) : 0;

  const statusToday = getOperationalStatus(executedToday, plannedToday || 0);
  const showPresence = !!presence && presence.total > 0;
  const showFacade = !!facadeProgress?.visible;
  const showOperationalState = showPresence || showFacade || plannedToday > 0 || plannedTotal > 0;

  // Produtividade
  const prodM2 = areaM2 > 0 && executedTotal > 0
    ? (areaM2 / executedTotal).toFixed(1)
    : null;
  const prodPerHour = elapsedMinutes > 0 && executedToday > 0
    ? Math.round((executedToday / elapsedMinutes) * 60)
    : null;

  // Alerta de ritmo — só quando há meta hoje e sessão ativa
  const ritmoAlert = useMemo(() => {
    if (!active || !plannedToday || !elapsedMinutes) return null;
    // Velocidade esperada vs real
    const expectedByNow = Math.round((elapsedMinutes / (plannedToday * 7)) * plannedToday);
    if (executedToday < expectedByNow * 0.8) return 'below';
    if (executedToday >= expectedByNow)       return 'above';
    return null;
  }, [active, plannedToday, elapsedMinutes, executedToday]);

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, rgba(10,16,32,0.97), rgba(5,10,22,0.99))',
        border: `1px solid ${active ? 'rgba(20,184,212,0.22)' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: active ? '0 0 20px rgba(20,184,212,0.06)' : 'none',
      }}>

      {/* ── Cabeçalho ── */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#718096' }}>
          Descidas Operacionais
        </p>
        {/* Badge status da sessão de hoje */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: statusToday.bg, border: `1px solid ${statusToday.border}` }}>
          {statusToday.pulse && (
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: statusToday.color }} />
          )}
          {statusToday.done && <CheckCircle2 className="w-3 h-3" style={{ color: statusToday.color }} />}
          <span className="text-[9px] font-black tracking-wider" style={{ color: statusToday.color }}>
            {statusToday.label}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">

        {/* ── HOJE: barra principal ── */}
        {(active || executedToday > 0) && (
          <div>
            <div className="flex justify-between items-end mb-2">
              <div>
                <span className="text-2xl font-black text-white">{executedToday}</span>
                {plannedToday > 0 && (
                  <span className="text-sm font-semibold ml-1" style={{ color: '#4A5568' }}>
                    / {plannedToday}
                  </span>
                )}
                <p className="text-[10px] mt-0.5" style={{ color: '#718096' }}>descidas hoje</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black" style={{ color: statusToday.color }}>
                  {pctToday}%
                </span>
                <p className="text-[10px]" style={{ color: '#4A5568' }}>meta do dia</p>
              </div>
            </div>

            {/* Barra segmentada */}
            <div className="relative h-3 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              {/* Fill */}
              <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pctToday}%`,
                  background: getBarColor(executedToday, plannedToday),
                  boxShadow: pctToday > 0 ? `0 0 10px ${statusToday.color}50` : 'none',
                }} />
              {/* Marcadores 25% 50% 75% */}
              {[25, 50, 75].map(mark => (
                <div key={mark} className="absolute top-0 bottom-0 w-px"
                  style={{ left: `${mark}%`, background: 'rgba(0,0,0,0.35)' }} />
              ))}
            </div>

            {/* Segmentos legenda */}
            <div className="flex justify-between mt-1">
              {['25%', '50%', '75%', '100%'].map(l => (
                <span key={l} className="text-[8px]" style={{ color: '#2D3748' }}>{l}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── TOTAL GERAL: barra secundária ── */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span style={{ color: '#718096' }}>Progresso total da atividade</span>
            <span className="font-bold" style={{ color: pctTotal >= 100 ? '#00D99A' : '#14B8D4' }}>
              {executedTotal} / {plannedTotal || '?'} · {pctTotal}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pctTotal}%`,
                background: getBarColor(executedTotal, plannedTotal),
                boxShadow: pctTotal > 0 ? '0 0 8px rgba(20,184,212,0.30)' : 'none',
              }} />
          </div>
        </div>

        {showOperationalState && (
          <div className="grid grid-cols-3 gap-2 pt-1">
            {showPresence && (
              <div className="rounded-xl p-2.5 min-w-0"
                style={{ background: 'rgba(0,217,154,0.06)', border: '1px solid rgba(0,217,154,0.14)' }}>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 shrink-0" style={{ color: '#00D99A' }} />
                  <p className="text-sm font-black truncate" style={{ color: '#00D99A' }}>
                    {presence.present}/{presence.total}
                  </p>
                </div>
                <p className="text-[10px] mt-0.5 truncate" style={{ color: '#4A5568' }}>
                  {presence.pending > 0 ? `${presence.pending} pendente(s)` : `${presence.absent || 0} ausente(s)`}
                </p>
              </div>
            )}

            {(plannedToday > 0 || plannedTotal > 0) && (
              <div className="rounded-xl p-2.5 min-w-0"
                style={{ background: 'rgba(20,184,212,0.06)', border: '1px solid rgba(20,184,212,0.14)' }}>
                <div className="flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 shrink-0" style={{ color: '#14B8D4' }} />
                  <p className="text-sm font-black truncate" style={{ color: '#14B8D4' }}>
                    {remainingToday ?? Math.max((plannedToday || 0) - (executedToday || 0), 0)}
                  </p>
                </div>
                <p className="text-[10px] mt-0.5 truncate" style={{ color: '#4A5568' }}>
                  faltam hoje · {remainingTotal ?? Math.max((plannedTotal || 0) - (executedTotal || 0), 0)} total
                </p>
              </div>
            )}

            {showFacade && (
              <div className="rounded-xl p-2.5 min-w-0"
                style={{ background: 'rgba(109,86,232,0.06)', border: '1px solid rgba(109,86,232,0.14)' }}>
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 shrink-0" style={{ color: '#6D56E8' }} />
                  <p className="text-sm font-black truncate" style={{ color: '#6D56E8' }}>
                    {facadeProgress.pct || 0}%
                  </p>
                </div>
                <p className="text-[10px] mt-0.5 truncate" style={{ color: '#4A5568' }}>
                  {facadeProgress.label}
                </p>
                <div className="h-1 mt-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, facadeProgress.pct || 0)}%`, background: 'linear-gradient(90deg,#6D56E8,#14B8D4)' }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Métricas de produtividade ── */}
        {(prodM2 || prodPerHour) && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            {prodM2 && (
              <div className="rounded-xl p-2.5"
                style={{ background: 'rgba(109,86,232,0.07)', border: '1px solid rgba(109,86,232,0.15)' }}>
                <p className="text-sm font-black" style={{ color: '#6D56E8' }}>{prodM2} m²</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#4A5568' }}>por descida</p>
              </div>
            )}
            {prodPerHour && (
              <div className="rounded-xl p-2.5"
                style={{ background: 'rgba(20,184,212,0.07)', border: '1px solid rgba(20,184,212,0.15)' }}>
                <p className="text-sm font-black" style={{ color: '#14B8D4' }}>{prodPerHour}/h</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#4A5568' }}>descidas por hora</p>
              </div>
            )}
          </div>
        )}

        {/* ── Alerta de ritmo ── */}
        {ritmoAlert === 'below' && (
          <div className="flex items-center gap-2 rounded-xl p-2.5"
            style={{ background: 'rgba(232,125,0,0.08)', border: '1px solid rgba(232,125,0,0.22)' }}>
            <TrendingDown className="w-3.5 h-3.5 shrink-0" style={{ color: '#E87D00' }} />
            <p className="text-[11px] font-semibold" style={{ color: '#E87D00' }}>
              Execução abaixo do planejado
            </p>
          </div>
        )}
        {ritmoAlert === 'above' && (
          <div className="flex items-center gap-2 rounded-xl p-2.5"
            style={{ background: 'rgba(0,217,154,0.07)', border: '1px solid rgba(0,217,154,0.20)' }}>
            <TrendingUp className="w-3.5 h-3.5 shrink-0" style={{ color: '#00D99A' }} />
            <p className="text-[11px] font-semibold" style={{ color: '#00D99A' }}>
              Execução acima da meta operacional
            </p>
          </div>
        )}

        {/* Sem sessão ativa e sem descidas — estado vazio */}
        {!active && executedToday === 0 && executedTotal === 0 && (
          <div className="flex items-center gap-2 py-1">
            <Zap className="w-3.5 h-3.5" style={{ color: '#2D3748' }} />
            <p className="text-xs" style={{ color: '#4A5568' }}>Nenhuma execução registrada</p>
          </div>
        )}
      </div>
    </div>
  );
}
