import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { addDays, format, startOfWeek, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const NEON = {
  blue: '#14B8D4',
  purple: '#6D56E8',
  green: '#00D99A',
  orange: '#E87D00',
  red: '#FC5252',
};

const tooltipStyle = {
  backgroundColor: 'rgba(6,10,22,0.97)',
  border: '1px solid rgba(20,184,212,0.22)',
  borderRadius: 14,
  padding: '10px 14px',
  color: '#E2E8F0',
  fontSize: 12,
  boxShadow: '0 18px 44px rgba(0,0,0,0.58)',
};

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function shortTeamName(name = '') {
  return name.length > 11 ? `${name.slice(0, 11)}…` : name;
}

function weekStarts(count = 6) {
  const current = startOfWeek(new Date(), { weekStartsOn: 1 });
  return Array.from({ length: count }, (_, index) => subWeeks(current, count - 1 - index));
}

function matchesWeek(dateValue, weekStart) {
  if (!dateValue) return false;
  const date = new Date(`${String(dateValue).slice(0, 10)}T12:00:00`);
  const weekEnd = addDays(weekStart, 7);
  return date >= weekStart && date < weekEnd;
}

function ChartPanel({ title, eyebrow, children, className = '' }) {
  return (
    <div className={`rounded-2xl overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(145deg, rgba(10,16,32,0.96), rgba(6,10,22,0.985))',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 18px 46px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}>
      <div className="px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {eyebrow && <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-1" style={{ color: '#4A5568' }}>{eyebrow}</p>}
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-[210px] flex items-center justify-center text-xs" style={{ color: '#4A5568' }}>
      Sem dados suficientes
    </div>
  );
}

export default function DashboardCharts({ activities = [], teams = [], sessions = [] }) {
  const weeks = weekStarts(6);

  const sCurve = weeks.reduce((acc, weekStart, index) => {
    const previous = acc[index - 1] || { Previsto: 0, Realizado: 0 };
    const plannedWeek = activities
      .filter(activity => matchesWeek(activity.end_date || activity.start_date, weekStart))
      .reduce((total, activity) => total + safeNumber(activity.hours_planned), 0);
    const actualWeek = sessions
      .filter(session => matchesWeek(session.date, weekStart))
      .reduce((total, session) => total + safeNumber(session.tempo_total_minutos) / 60, 0);
    acc.push({
      week: format(weekStart, 'dd/MM', { locale: ptBR }),
      Previsto: Math.round((previous.Previsto + plannedWeek) * 10) / 10,
      Realizado: Math.round((previous.Realizado + actualWeek) * 10) / 10,
    });
    return acc;
  }, []);

  const delayTrend = weeks.map(weekStart => ({
    week: format(weekStart, 'dd/MM', { locale: ptBR }),
    Atrasos: activities.filter(activity =>
      matchesWeek(activity.end_date, weekStart) &&
      activity.status !== 'completed'
    ).length,
  }));

  const weeklyEvolution = weeks.map(weekStart => {
    const weekSessions = sessions.filter(session => matchesWeek(session.date, weekStart));
    return {
      week: format(weekStart, 'dd/MM', { locale: ptBR }),
      Descidas: weekSessions.reduce((total, session) => total + safeNumber(session.descidas_realizadas), 0),
      Horas: Math.round(weekSessions.reduce((total, session) => total + safeNumber(session.tempo_total_minutos) / 60, 0) * 10) / 10,
    };
  });

  const teamProductivity = teams.map(team => {
    const teamActivities = activities.filter(activity => activity.team_id === team.id);
    return {
      name: shortTeamName(team.name),
      Descidas: teamActivities.reduce((total, activity) => total + safeNumber(activity.descents_completed), 0),
      Eficiência: teamActivities.length
        ? Math.round(teamActivities.reduce((total, activity) => total + safeNumber(activity.progress), 0) / teamActivities.length)
        : 0,
    };
  }).filter(team => team.Descidas > 0 || team.Eficiência > 0);

  const comparison = teams.map(team => {
    const teamActivities = activities.filter(activity => activity.team_id === team.id);
    return {
      name: shortTeamName(team.name),
      Previsto: teamActivities.reduce((total, activity) => total + safeNumber(activity.hours_planned), 0),
      Realizado: teamActivities.reduce((total, activity) => total + safeNumber(activity.hours_actual), 0),
    };
  }).filter(team => team.Previsto > 0 || team.Realizado > 0);

  const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(new Date(), index - 6);
    const key = format(date, 'yyyy-MM-dd');
    const daySessions = sessions.filter(session => session.date === key);
    const finalized = daySessions.filter(session => session.status === 'finalizado').length;
    return {
      day: format(date, 'dd/MM'),
      Concluídas: finalized,
      Taxa: daySessions.length ? Math.round((finalized / daySessions.length) * 100) : 0,
    };
  });

  const tickStyle = { fontSize: 11, fill: '#718096' };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <ChartPanel title="Curva S Operacional" eyebrow="Planejamento x Execução">
        {sCurve.some(point => point.Previsto > 0 || point.Realizado > 0) ? (
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={sCurve}>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="week" tick={tickStyle} axisLine={false} tickLine={false} />
              <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="Previsto" stroke={NEON.purple} strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Realizado" stroke={NEON.green} strokeWidth={2.5} dot={{ r: 3 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#718096', paddingTop: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : <EmptyChart />}
      </ChartPanel>

      <ChartPanel title="Tendência de Atraso" eyebrow="Risco de SLA">
        {delayTrend.some(point => point.Atrasos > 0) ? (
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={delayTrend}>
              <defs>
                <linearGradient id="delayFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={NEON.red} stopOpacity={0.34} />
                  <stop offset="100%" stopColor={NEON.red} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="week" tick={tickStyle} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={tickStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="Atrasos" stroke={NEON.red} fill="url(#delayFill)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <EmptyChart />}
      </ChartPanel>

      <ChartPanel title="Produtividade por Equipe" eyebrow="Descidas x Eficiência">
        {teamProductivity.length > 0 ? (
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={teamProductivity} barGap={5}>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={tickStyle} axisLine={false} tickLine={false} />
              <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(20,184,212,0.04)' }} />
              <Bar dataKey="Descidas" fill={NEON.blue} radius={[6, 6, 0, 0]} maxBarSize={30}
                style={{ filter: 'drop-shadow(0 0 7px rgba(20,184,212,0.34))' }} />
              <Bar dataKey="Eficiência" fill={NEON.orange} radius={[6, 6, 0, 0]} maxBarSize={30} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#718096', paddingTop: 8 }} />
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyChart />}
      </ChartPanel>

      <ChartPanel title="Evolução Semanal" eyebrow="Cadência Operacional">
        {weeklyEvolution.some(point => point.Descidas > 0 || point.Horas > 0) ? (
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={weeklyEvolution}>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="week" tick={tickStyle} axisLine={false} tickLine={false} />
              <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="Descidas" stroke={NEON.blue} strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Horas" stroke={NEON.green} strokeWidth={2.5} dot={{ r: 3 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#718096', paddingTop: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : <EmptyChart />}
      </ChartPanel>

      <ChartPanel title="Previsto x Realizado" eyebrow="Horas por Equipe">
        {comparison.length > 0 ? (
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={comparison} barGap={4}>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={tickStyle} axisLine={false} tickLine={false} />
              <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(20,184,212,0.04)' }} />
              <Bar dataKey="Previsto" fill={NEON.purple} radius={[6, 6, 0, 0]} maxBarSize={28} opacity={0.75} />
              <Bar dataKey="Realizado" fill={NEON.green} radius={[6, 6, 0, 0]} maxBarSize={28}
                style={{ filter: 'drop-shadow(0 0 6px rgba(0,217,154,0.28))' }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#718096', paddingTop: 8 }} />
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyChart />}
      </ChartPanel>

      <ChartPanel title="Taxa de Conclusão Diária" eyebrow="Últimos 7 dias">
        {lastSevenDays.some(point => point.Concluídas > 0 || point.Taxa > 0) ? (
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={lastSevenDays}>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day" tick={tickStyle} axisLine={false} tickLine={false} />
              <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="Concluídas" fill={NEON.green} radius={[6, 6, 0, 0]} maxBarSize={24} />
              <Bar dataKey="Taxa" fill={NEON.blue} radius={[6, 6, 0, 0]} maxBarSize={24} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#718096', paddingTop: 8 }} />
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyChart />}
      </ChartPanel>
    </div>
  );
}
