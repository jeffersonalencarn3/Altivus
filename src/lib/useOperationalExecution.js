import { useEffect, useMemo, useState } from 'react';
import {
  useActivityEmployees,
  useActivitySessions,
  useAttendanceRecords,
  useOperationalMaps,
} from '@/lib/useAppData';

const PRESENT_STATUSES = new Set(['presente', 'atrasado', 'finalizado']);
const ABSENT_STATUSES = new Set(['ausente', 'falta_justificada', 'falta_nao_justificada']);

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

function latestDate(...values) {
  return values
    .filter(Boolean)
    .map(value => new Date(value).getTime())
    .filter(Number.isFinite)
    .sort((a, b) => b - a)[0] || null;
}

export function useOperationalExecution(activity) {
  const activityId = activity?.id;
  const { data: sessions = [] } = useActivitySessions(activityId);
  const { data: attendanceRecords = [] } = useAttendanceRecords(activityId);
  const { data: activityEmployees = [] } = useActivityEmployees(activityId);
  const { data: operationalMaps = [] } = useOperationalMaps(activityId);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  return useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);

    if (!activity) {
      return {
        sessions,
        attendanceRecords,
        activityEmployees,
        operationalMaps,
        activeSession: null,
        todaySession: null,
        today,
        metrics: {
          executedToday: 0,
          plannedToday: 0,
          executedTotal: 0,
          plannedTotal: 0,
          completionPct: 0,
          elapsedMinutes: 0,
          remainingToday: 0,
          remainingTotal: 0,
          presence: { total: 0, present: 0, absent: 0, pending: 0, assigned: 0 },
          facadeProgress: null,
          lastSyncedAt: null,
        },
      };
    }

    const activeSession = sessions.find(session => session.status === 'em_execucao') || null;
    const todaySession = sessions.find(session =>
      session.date === today &&
      session.status === 'finalizado' &&
      (!activity.team_id || session.team_id === activity.team_id)
    ) || null;
    const todaySessions = sessions.filter(session => session.date === today);

    const finalizedToday = todaySessions
      .filter(session => session.status === 'finalizado')
      .reduce((total, session) => total + toNumber(session.descidas_realizadas), 0);
    const activeToday = activeSession?.date === today ? toNumber(activeSession.descidas_realizadas) : 0;
    const executedToday = activeSession ? finalizedToday + activeToday : (todaySession ? toNumber(todaySession.descidas_realizadas) : finalizedToday);
    const plannedToday = activeSession
      ? toNumber(activeSession.descidas_planejadas_hoje)
      : toNumber(todaySession?.descidas_planejadas_hoje);

    const finalizedDescents = sessions
      .filter(session => session.status === 'finalizado')
      .reduce((total, session) => total + toNumber(session.descidas_realizadas), 0);
    const liveDescents = activeSession ? toNumber(activeSession.descidas_realizadas) : 0;
    const plannedTotal = toNumber(activity.descents_planned);
    const executedTotal = Math.max(toNumber(activity.descents_completed), finalizedDescents + liveDescents);
    const completionPct = plannedTotal > 0 ? clampPercent((executedTotal / plannedTotal) * 100) : 0;
    const elapsedMinutes = activeSession
      ? Math.max(0, Math.floor((now - new Date(activeSession.hora_inicio).getTime()) / 60000))
      : toNumber(todaySession?.tempo_total_minutos);

    const todayRecords = attendanceRecords.filter(record => record.date === today);
    const present = todayRecords.filter(record => PRESENT_STATUSES.has(record.status)).length;
    const absent = todayRecords.filter(record => ABSENT_STATUSES.has(record.status)).length;
    const expectedTeamSize = Math.max(
      todayRecords.length,
      activityEmployees.length,
      toNumber(activity.num_alpinistas)
    );
    const pending = todayRecords.length
      ? todayRecords.filter(record => record.status === 'previsto').length
      : Math.max(expectedTeamSize - present - absent, 0);

    const executedArea = sessions.reduce((total, session) => total + toNumber(session.executed_area), 0);
    const totalArea = toNumber(activity.area_m2);
    const latestMapProgress = operationalMaps
      .map(map => Number(map.progress_percentage))
      .find(Number.isFinite);
    const areaPct = Number.isFinite(latestMapProgress)
      ? clampPercent(latestMapProgress)
      : (totalArea > 0 ? clampPercent((executedArea / totalArea) * 100) : completionPct);
    const displayedArea = executedArea || (totalArea > 0 ? Math.round((totalArea * completionPct) / 10) / 10 : 0);

    const lastSyncedAt = latestDate(
      activeSession?.updated_date,
      activeSession?.created_date,
      todaySession?.updated_date,
      todaySession?.created_date,
      ...attendanceRecords.map(record => record.updated_date || record.registered_at),
      ...operationalMaps.map(map => map.updated_date || map.captured_at)
    );

    return {
      sessions,
      attendanceRecords,
      activityEmployees,
      operationalMaps,
      activeSession,
      todaySession,
      today,
      metrics: {
        executedToday,
        plannedToday,
        executedTotal,
        plannedTotal,
        completionPct,
        elapsedMinutes,
        remainingToday: plannedToday > 0 ? Math.max(plannedToday - executedToday, 0) : 0,
        remainingTotal: plannedTotal > 0 ? Math.max(plannedTotal - executedTotal, 0) : 0,
        presence: {
          total: expectedTeamSize,
          present,
          absent,
          pending,
          assigned: activityEmployees.length,
        },
        facadeProgress: {
          label: activity.bloco_nome || activity.area_name || (activity.tipo_servico === 'fachada' ? 'Fachada' : 'Frente operacional'),
          pct: areaPct,
          executedArea: displayedArea,
          totalArea,
          visible: totalArea > 0 || operationalMaps.length > 0 || activity.tipo_servico === 'fachada',
        },
        lastSyncedAt: lastSyncedAt ? new Date(lastSyncedAt).toISOString() : null,
      },
    };
  }, [activity, activityEmployees, attendanceRecords, now, operationalMaps, sessions]);
}
