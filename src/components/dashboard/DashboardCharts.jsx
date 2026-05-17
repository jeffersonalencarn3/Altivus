import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Legend
} from 'recharts';

const NEON = {
  blue:   '#14B8D4',
  purple: '#6D56E8',
  green:  '#00D99A',
  orange: '#E87D00',
  red:    '#FC5252',
};

const STATUS_COLORS = {
  not_started: '#4A5568',
  in_progress: '#14B8D4',
  delayed:     '#FC5252',
  completed:   '#00D99A',
};
const STATUS_LABELS = {
  not_started: 'Não Iniciado',
  in_progress: 'Em Andamento',
  delayed:     'Atrasado',
  completed:   'Concluído',
};

const tooltipStyle = {
  backgroundColor: 'rgba(6,10,22,0.97)',
  border: '1px solid rgba(20,184,212,0.2)',
  borderRadius: 12,
  padding: '10px 14px',
  color: '#E2E8F0',
  fontSize: 12,
  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
};

function ChartPanel({ title, children }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, rgba(10,16,32,0.92), rgba(6,10,22,0.96))',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
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
    <div className="h-[220px] flex items-center justify-center text-xs" style={{ color: '#4A5568' }}>
      Sem dados suficientes
    </div>
  );
}

export default function DashboardCharts({ activities = [], teams = [], areas = [] }) {
  const teamProduction = teams.map(team => {
    const acts = activities.filter(a => a.team_id === team.id);
    return {
      name: team.name.length > 10 ? team.name.slice(0, 10) + '…' : team.name,
      Descidas: acts.reduce((s, a) => s + (a.descents_completed || 0), 0),
      Horas: acts.reduce((s, a) => s + (a.hours_actual || 0), 0),
    };
  }).filter(t => t.Descidas > 0 || t.Horas > 0);

  const statusData = ['not_started', 'in_progress', 'delayed', 'completed'].map(s => ({
    name: STATUS_LABELS[s],
    value: activities.filter(a => a.status === s).length,
    color: STATUS_COLORS[s],
  })).filter(s => s.value > 0);

  const comparisonData = teams.map(team => {
    const acts = activities.filter(a => a.team_id === team.id);
    return {
      name: team.name.length > 10 ? team.name.slice(0, 10) + '…' : team.name,
      Previsto: acts.reduce((s, a) => s + (a.hours_planned || 0), 0),
      Realizado: acts.reduce((s, a) => s + (a.hours_actual || 0), 0),
    };
  }).filter(t => t.Previsto > 0 || t.Realizado > 0);

  const areaHeat = areas.map(area => {
    const acts = activities.filter(a => a.area_id === area.id);
    const prog = acts.length > 0 ? Math.round(acts.reduce((s, a) => s + (a.progress || 0), 0) / acts.length) : 0;
    return { name: area.name, atividades: acts.length, progresso: prog };
  }).filter(a => a.atividades > 0);

  const tickStyle = { fontSize: 11, fill: '#4A5568' };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Produção por Equipe */}
      <ChartPanel title="Produção por Equipe">
        {teamProduction.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={teamProduction} barGap={4}>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={tickStyle} axisLine={false} tickLine={false} />
              <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(20,184,212,0.04)' }} />
              <Bar dataKey="Descidas" fill={NEON.blue} radius={[6, 6, 0, 0]} maxBarSize={32}
                style={{ filter: 'drop-shadow(0 0 6px rgba(20,184,212,0.4))' }} />
              <Bar dataKey="Horas" fill={NEON.purple} radius={[6, 6, 0, 0]} maxBarSize={32}
                style={{ filter: 'drop-shadow(0 0 6px rgba(109,86,232,0.4))' }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#718096', paddingTop: 8 }} />
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyChart />}
      </ChartPanel>

      {/* Status das Atividades */}
      <ChartPanel title="Status das Atividades">
        {statusData.length > 0 ? (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color}
                      style={{ filter: `drop-shadow(0 0 8px ${entry.color}60)` }} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {statusData.map((s, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color, boxShadow: `0 0 5px ${s.color}` }} />
                    <span className="text-[11px] font-medium" style={{ color: '#A0AEC0' }}>{s.name}</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : <EmptyChart />}
      </ChartPanel>

      {/* Previsto vs Realizado */}
      <ChartPanel title="Previsto vs Realizado (Horas)">
        {comparisonData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={comparisonData} barGap={4}>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={tickStyle} axisLine={false} tickLine={false} />
              <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(20,184,212,0.04)' }} />
              <Bar dataKey="Previsto" fill={NEON.blue} radius={[6, 6, 0, 0]} maxBarSize={28} opacity={0.7} />
              <Bar dataKey="Realizado" fill={NEON.green} radius={[6, 6, 0, 0]} maxBarSize={28}
                style={{ filter: 'drop-shadow(0 0 5px rgba(0,217,154,0.4))' }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#718096', paddingTop: 8 }} />
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyChart />}
      </ChartPanel>

      {/* Progresso por Área */}
      <ChartPanel title="Progresso por Área">
        {areaHeat.length > 0 ? (
          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {areaHeat.map((area, i) => {
              const color = area.progresso >= 80 ? NEON.green : area.progresso >= 50 ? NEON.blue : area.progresso >= 25 ? NEON.orange : NEON.red;
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-white/80">{area.name}</span>
                    <span className="font-bold" style={{ color }}>{area.progresso}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${area.progresso}%`,
                        background: `linear-gradient(90deg, ${color}, ${color}80)`,
                        boxShadow: `0 0 6px ${color}50`,
                      }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : <EmptyChart />}
      </ChartPanel>
    </div>
  );
}