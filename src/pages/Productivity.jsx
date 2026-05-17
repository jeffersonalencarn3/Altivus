import React, { useMemo } from 'react';
import { useActivities, useTeams, useEmployees } from '@/lib/useAppData';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, ReferenceLine
} from 'recharts';
import { TrendingUp, Clock, AlertTriangle, Award, Zap, Timer, Target, Info } from 'lucide-react';

const tooltipStyle = {
  backgroundColor: 'hsl(222,47%,11%)',
  border: '1px solid hsl(217,33%,17%)',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: '12px',
};

function round2(n) { return Math.round(n * 100) / 100; }

/** Tooltip explicativo com ícone de info */
function InfoTooltip({ text }) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
      >
        <Info className="w-3 h-3" style={{ color: '#14B8D4' }} />
      </button>
      {show && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 text-xs rounded-xl p-3 shadow-xl"
          style={{ background: 'rgba(8,14,30,0.97)', border: '1px solid rgba(20,184,212,0.25)', color: '#A0AEC0' }}
        >
          {text}
        </div>
      )}
    </div>
  );
}

/** KPI Card com tooltip embutido */
function KPIBlock({ title, value, subtitle, icon: Icon, color, alert, tooltip }) {
  const colors = {
    blue: { icon: '#14B8D4', border: 'rgba(20,184,212,0.15)', bg: 'rgba(20,184,212,0.06)' },
    green: { icon: '#00D99A', border: 'rgba(0,217,154,0.15)', bg: 'rgba(0,217,154,0.06)' },
    purple: { icon: '#6D56E8', border: 'rgba(109,86,232,0.15)', bg: 'rgba(109,86,232,0.06)' },
    orange: { icon: '#E87D00', border: 'rgba(232,125,0,0.15)', bg: 'rgba(232,125,0,0.06)' },
    red: { icon: '#FC5252', border: 'rgba(252,82,82,0.15)', bg: 'rgba(252,82,82,0.06)' },
    yellow: { icon: '#EAB308', border: 'rgba(234,179,8,0.15)', bg: 'rgba(234,179,8,0.06)' },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className="rounded-2xl p-4 flex flex-col gap-2"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: '#718096' }}>
          {title}
          {tooltip && <InfoTooltip text={tooltip} />}
        </span>
        {Icon && <Icon className="w-4 h-4" style={{ color: c.icon }} />}
      </div>
      <p className="text-2xl font-black" style={{ color: '#FFFFFF' }}>{value}</p>
      {subtitle && <p className="text-[11px]" style={{ color: '#718096' }}>{subtitle}</p>}
      {alert && (
        <div className="flex items-start gap-1.5 mt-1 p-2 rounded-lg" style={{ background: 'rgba(252,82,82,0.10)', border: '1px solid rgba(252,82,82,0.20)' }}>
          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" style={{ color: '#FC5252' }} />
          <p className="text-[10px]" style={{ color: '#FC5252' }}>{alert}</p>
        </div>
      )}
    </div>
  );
}

/** Cor do score de produtividade */
function scoreColor(score) {
  if (score >= 80) return { text: '#00D99A', bg: 'rgba(0,217,154,0.12)', border: 'rgba(0,217,154,0.30)', label: 'Alta Performance' };
  if (score >= 55) return { text: '#E87D00', bg: 'rgba(232,125,0,0.10)', border: 'rgba(232,125,0,0.28)', label: 'Atenção' };
  return { text: '#FC5252', bg: 'rgba(252,82,82,0.10)', border: 'rgba(252,82,82,0.28)', label: 'Baixa Performance' };
}

export default function Productivity() {
  const { data: activities = [], isLoading: loadAct } = useActivities();
  const { data: teams = [], isLoading: loadTeams } = useTeams();
  const { data: employees = [], isLoading: loadEmp } = useEmployees();
  const isLoading = loadAct || loadTeams || loadEmp;

  const stats = useMemo(() => {
    const totalHoursPlanned = activities.reduce((s, a) => s + (a.hours_planned || 0), 0);
    const totalHoursActual  = activities.reduce((s, a) => s + (a.hours_actual  || 0), 0);

    // Aderência ao Planejamento: realizadas / planejadas * 100
    const adherence = totalHoursPlanned > 0
      ? round2((totalHoursActual / totalHoursPlanned) * 100)
      : 0;

    // Desvio de horas: realizadas - planejadas (positivo = mais que previsto)
    const hoursDeviation = round2(totalHoursActual - totalHoursPlanned);

    // Eficiência de Execução: apenas atividades concluídas
    const completedActivities = activities.filter(a => a.status === 'completed');
    const compPlanned = completedActivities.reduce((s, a) => s + (a.hours_planned || 0), 0);
    const compActual  = completedActivities.reduce((s, a) => s + (a.hours_actual  || 0), 0);
    const execEfficiency = compActual > 0
      ? round2((compPlanned / compActual) * 100)
      : null; // null = sem atividades concluídas

    // Alerta de valor irreal (>300%)
    const adherenceAlert = adherence > 300
      ? 'Verifique se as horas planejadas e realizadas foram apontadas corretamente.'
      : null;
    const execAlert = execEfficiency !== null && execEfficiency > 300
      ? 'Verifique se as horas planejadas e realizadas foram apontadas corretamente.'
      : null;

    // Stats por equipe
    const teamStats = teams.map(team => {
      const ta = activities.filter(a => a.team_id === team.id);
      const hoursPlanned = ta.reduce((s, a) => s + (a.hours_planned || 0), 0);
      const hoursActual  = ta.reduce((s, a) => s + (a.hours_actual  || 0), 0);
      const deviation    = round2(hoursActual - hoursPlanned);
      const teamAdherence = hoursPlanned > 0 ? round2((hoursActual / hoursPlanned) * 100) : 0;

      const completed   = ta.filter(a => a.status === 'completed');
      const totalTa     = ta.length;
      const memberCount = employees.filter(e => e.team_id === team.id).length;

      // Eficiência de execução da equipe (só concluídas)
      const cPl = completed.reduce((s, a) => s + (a.hours_planned || 0), 0);
      const cAc = completed.reduce((s, a) => s + (a.hours_actual  || 0), 0);
      const teamExecEff = cAc > 0 ? round2((cPl / cAc) * 100) : null;

      // ── SCORE DE PRODUTIVIDADE ──
      // 40% cumprimento de prazo
      const onTimePct = totalTa > 0
        ? (ta.filter(a => a.status === 'completed' && (!a.end_date || new Date(a.end_date) >= new Date())).length / totalTa)
        : 0;
      const prazoScore = onTimePct * 40;

      // 30% aderência às horas previstas (100% aderência = 30pts, escala 0-200% de aderência)
      const adScore = hoursPlanned > 0
        ? Math.min(30, (Math.min(200, teamAdherence) / 200) * 30)
        : 0;

      // 20% atividades concluídas
      const concScore = totalTa > 0
        ? (completed.length / totalTa) * 20
        : 0;

      // 10% qualidade (proxy: atividades com observations preenchidas)
      const withObs = ta.filter(a => a.observations && a.observations.trim().length > 0).length;
      const qualScore = totalTa > 0 ? (withObs / totalTa) * 10 : 0;

      const productivityScore = Math.round(prazoScore + adScore + concScore + qualScore);

      return {
        name: team.name,
        color: team.color || '#3b82f6',
        hoursPlanned,
        hoursActual,
        deviation,
        teamAdherence,
        teamExecEff,
        memberCount,
        completed: completed.length,
        totalActivities: totalTa,
        productivityScore,
      };
    })
    .filter(t => t.hoursPlanned > 0 || t.hoursActual > 0)
    .sort((a, b) => b.productivityScore - a.productivityScore);

    // Gráfico comparativo por equipe
    const comparativo = teamStats.map(t => ({
      name: t.name.length > 12 ? t.name.slice(0, 12) + '…' : t.name,
      Planejado: t.hoursPlanned,
      Realizado: t.hoursActual,
      Aderência: t.teamAdherence,
      Desvio: t.deviation,
    }));

    return {
      totalHoursPlanned, totalHoursActual,
      adherence, hoursDeviation, execEfficiency,
      adherenceAlert, execAlert,
      teamStats, comparativo,
      completedCount: completedActivities.length,
    };
  }, [activities, teams, employees]);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Produtividade" subtitle="Eficiência operacional das equipes" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl shimmer-line" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Produtividade" subtitle="Eficiência operacional das equipes" />

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KPIBlock
          title="Aderência ao Planejamento"
          value={`${stats.adherence}%`}
          subtitle={`${stats.totalHoursActual}h realizadas de ${stats.totalHoursPlanned}h planejadas`}
          icon={Target}
          color="blue"
          alert={stats.adherenceAlert}
          tooltip="Mostra quanto do volume planejado já foi executado no período selecionado. Fórmula: horas realizadas ÷ horas planejadas × 100."
        />
        <KPIBlock
          title="Horas Planejadas"
          value={`${stats.totalHoursPlanned}h`}
          subtitle="total de horas previstas"
          icon={Clock}
          color="purple"
          tooltip="Soma de todas as horas planejadas nas atividades."
        />
        <KPIBlock
          title="Horas Realizadas"
          value={`${stats.totalHoursActual}h`}
          subtitle="total de horas registradas"
          icon={Timer}
          color="green"
          tooltip="Soma de todas as horas efetivamente realizadas nas atividades."
        />
        <KPIBlock
          title="Desvio de Horas"
          value={`${stats.hoursDeviation >= 0 ? '+' : ''}${stats.hoursDeviation}h`}
          subtitle={stats.hoursDeviation > 0 ? 'acima do planejado' : stats.hoursDeviation < 0 ? 'abaixo do planejado' : 'dentro do planejado'}
          icon={AlertTriangle}
          color={stats.hoursDeviation > 0 ? 'red' : stats.hoursDeviation < 0 ? 'yellow' : 'green'}
          tooltip="Diferença entre horas realizadas e horas planejadas. Positivo = gastou mais que o previsto. Negativo = gastou menos."
        />
        <KPIBlock
          title="Eficiência de Execução"
          value={stats.execEfficiency !== null ? `${stats.execEfficiency}%` : '—'}
          subtitle={stats.execEfficiency !== null
            ? `${stats.execEfficiency >= 100 ? 'Abaixo do previsto' : 'Acima do previsto'} · ${stats.completedCount} atividade(s) concluída(s)`
            : 'Sem atividades concluídas ainda'}
          icon={Zap}
          color={stats.execEfficiency === null ? 'blue' : stats.execEfficiency >= 90 ? 'green' : stats.execEfficiency >= 70 ? 'yellow' : 'red'}
          alert={stats.execAlert}
          tooltip="Compara as horas previstas com as horas reais apenas em atividades concluídas. 100% = dentro do previsto. Acima = executou em menos tempo. Abaixo = gastou mais tempo que o previsto."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Aderência por equipe */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4" style={{ color: '#14B8D4' }} /> Aderência ao Planejamento por Equipe (%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.teamStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.teamStats} layout="vertical" margin={{ left: 8, right: 48 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,33%,17%)" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" domain={[0, 'auto']} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#94a3b8' }} width={100} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v, n) => [`${v}%`, n === 'teamAdherence' ? 'Aderência' : n]}
                  />
                  <ReferenceLine x={100} stroke="#22c55e" strokeDasharray="4 4" label={{ value: '100%', fill: '#22c55e', fontSize: 10 }} />
                  <Bar dataKey="teamAdherence" radius={[0, 4, 4, 0]} name="Aderência"
                    fill="#14B8D4"
                    label={{ position: 'right', fontSize: 10, fill: '#94a3b8', formatter: v => `${v}%` }}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">Sem dados suficientes</div>}
          </CardContent>
        </Card>

        {/* Planejado vs Realizado */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: '#00D99A' }} /> Planejado vs Realizado por Equipe (horas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.comparativo.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.comparativo} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,33%,17%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v, n) => [n === 'Desvio' ? `${v >= 0 ? '+' : ''}${v}h` : `${v}h`, n]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                  <Bar dataKey="Planejado" fill="#6D56E8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Realizado" fill="#14B8D4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">Sem dados suficientes</div>}
          </CardContent>
        </Card>
      </div>

      {/* Ranking de Produtividade */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-500" /> Ranking de Produtividade por Equipe
            </CardTitle>
            <div className="text-[10px] text-right max-w-[280px]" style={{ color: '#4A5568' }}>
              Score: 40% prazo · 30% aderência de horas · 20% conclusão · 10% qualidade
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {stats.teamStats.length === 0
            ? <p className="text-center text-sm text-muted-foreground py-8">Nenhuma equipe com dados de produtividade</p>
            : (
              <div className="space-y-3">
                {stats.teamStats.map((team, i) => {
                  const sc = scoreColor(team.productivityScore);
                  return (
                    <div key={team.name}
                      className="p-4 rounded-xl"
                      style={{ background: sc.bg, border: `1px solid ${sc.border}` }}>
                      <div className="flex items-center gap-3 mb-3">
                        {/* Posição */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0`}
                          style={{
                            background: i === 0 ? 'rgba(234,179,8,0.20)' : i === 1 ? 'rgba(148,163,184,0.15)' : i === 2 ? 'rgba(234,88,12,0.15)' : 'rgba(255,255,255,0.06)',
                            color: i === 0 ? '#EAB308' : i === 1 ? '#94A3B8' : i === 2 ? '#F97316' : '#718096',
                          }}>
                          {i + 1}
                        </div>
                        <div className="w-2.5 h-8 rounded-full shrink-0" style={{ backgroundColor: team.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{team.name}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: '#718096' }}>
                            {team.memberCount} membro(s) · {team.hoursPlanned}h plan. · {team.hoursActual}h real.
                            · {team.completed}/{team.totalActivities} concluída(s)
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xl font-black" style={{ color: sc.text }}>{team.productivityScore}</p>
                          <p className="text-[10px] font-semibold" style={{ color: sc.text }}>pts</p>
                        </div>
                      </div>

                      {/* Métricas detalhadas */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <p className="text-[10px] mb-0.5" style={{ color: '#4A5568' }}>Aderência</p>
                          <p className="text-xs font-bold" style={{ color: '#14B8D4' }}>{team.teamAdherence}%</p>
                        </div>
                        <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <p className="text-[10px] mb-0.5" style={{ color: '#4A5568' }}>Ef. Execução</p>
                          <p className="text-xs font-bold" style={{ color: '#6D56E8' }}>
                            {team.teamExecEff !== null ? `${team.teamExecEff}%` : '—'}
                          </p>
                        </div>
                        <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <p className="text-[10px] mb-0.5" style={{ color: '#4A5568' }}>Desvio</p>
                          <p className="text-xs font-bold" style={{ color: team.deviation > 0 ? '#FC5252' : team.deviation < 0 ? '#EAB308' : '#00D99A' }}>
                            {team.deviation >= 0 ? '+' : ''}{team.deviation}h
                          </p>
                        </div>
                      </div>

                      {/* Barra de score */}
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${team.productivityScore}%`, background: sc.text }} />
                      </div>

                      {/* Badge */}
                      <div className="flex justify-end mt-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text }}>
                          {sc.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }
        </CardContent>
      </Card>
    </div>
  );
}