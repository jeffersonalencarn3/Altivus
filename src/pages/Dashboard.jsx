import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useActivities,
  useActivitySessions,
  useAreas,
  useContracts,
  useEmployees,
  useMaterials,
  useOperationalMaps,
  useTeams,
} from '@/lib/useAppData';
import { useWorkspace } from '@/lib/useWorkspace';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { buildGoLiveSelect } from '@/lib/goLive';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import InsightsPanel from '@/components/dashboard/InsightsPanel';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock,
  Factory,
  Gauge,
  HardHat,
  MapPinned,
  Package,
  PlayCircle,
  Radar,
  RotateCcw,
  ShieldCheck,
  Timer,
  TrendingDown,
  Zap,
} from 'lucide-react';

const TODAY = new Date().toISOString().slice(0, 10);

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function parseMetricNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const match = String(value).replace(',', '.').match(/-?\d+(\.\d+)?/);
  return match ? safeNumber(match[0]) : 0;
}

function pct(part, total) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function compactNumber(value, suffix = '') {
  const number = safeNumber(value);
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: number >= 100 ? 0 : 1 }).format(number)}${suffix}`;
}

function daysUntil(dateValue) {
  if (!dateValue) return null;
  return differenceInDays(new Date(`${dateValue}T12:00:00`), new Date(`${TODAY}T12:00:00`));
}

function isOverdue(activity) {
  return activity.end_date && activity.end_date < TODAY && activity.status !== 'completed';
}

function ExecutiveKPI({ icon: Icon, label, value, sub, color = '#14B8D4', tone = 'neutral' }) {
  const toneBg = tone === 'danger'
    ? 'rgba(252,82,82,0.08)'
    : tone === 'warning'
      ? 'rgba(232,125,0,0.08)'
      : tone === 'success'
        ? 'rgba(0,217,154,0.07)'
        : 'rgba(255,255,255,0.035)';

  return (
    <div
      className="group rounded-2xl p-4 min-h-[116px] transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: `linear-gradient(145deg, ${toneBg}, rgba(6,10,22,0.96))`,
        border: `1px solid ${color}26`,
        boxShadow: `0 16px 38px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.035)`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] leading-tight" style={{ color: '#718096' }}>{label}</p>
          <p className="text-2xl font-black text-white mt-2 leading-none">{value}</p>
          {sub && <p className="text-[11px] mt-2 leading-snug" style={{ color: '#4A5568' }}>{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105"
          style={{ background: `${color}15`, border: `1px solid ${color}32`, boxShadow: `0 0 18px ${color}12` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function TodayActivityRow({ activity, teams, sessions }) {
  const team = teams.find(t => t.id === activity.team_id);
  const activeSession = sessions.find(s => s.activity_id === activity.id && s.status === 'em_execucao');
  const todaySession = sessions.find(s => s.activity_id === activity.id && s.date === TODAY && s.status === 'finalizado');

  const statusIcon = activeSession
    ? <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00D99A', boxShadow: '0 0 8px #00D99A', display: 'inline-block' }} />
    : todaySession
      ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#00D99A' }} />
      : <Clock className="w-3.5 h-3.5" style={{ color: '#718096' }} />;

  const statusLabel = activeSession ? 'Em execução' : todaySession ? 'Concluída hoje' : 'Aguardando início';
  const statusColor = activeSession ? '#00D99A' : todaySession ? '#00D99A' : '#718096';

  return (
    <Link to="/activities">
      <div
        className="flex items-center gap-3 p-3 rounded-xl transition-all duration-150 hover:bg-white/[0.04] group cursor-pointer"
        style={{ border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="relative w-10 h-10 shrink-0">
          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
            <circle cx="20" cy="20" r="16" fill="none"
              stroke={activity.status === 'delayed' ? '#FC5252' : '#14B8D4'}
              strokeWidth="3" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 16}`}
              strokeDashoffset={`${2 * Math.PI * 16 * (1 - (activity.progress || 0) / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
            {activity.progress || 0}%
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate group-hover:text-primary transition-colors">
            {activity.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {statusIcon}
            <span className="text-[11px] font-medium" style={{ color: statusColor }}>{statusLabel}</span>
            {team && <span className="text-[11px]" style={{ color: '#4A5568' }}>· {team.name}</span>}
          </div>
        </div>

        <ChevronRight className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-all" style={{ color: '#14B8D4' }} />
      </div>
    </Link>
  );
}

function PanelShell({ title, eyebrow, icon: Icon, children, color = '#14B8D4' }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, rgba(10,16,32,0.94), rgba(6,10,22,0.985))',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.30)',
      }}>
      <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {Icon && (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${color}14`, border: `1px solid ${color}2f` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        )}
        <div>
          {eyebrow && <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: '#4A5568' }}>{eyebrow}</p>}
          <h3 className="text-sm font-bold text-white">{title}</h3>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function OperationalMapPanel({ areas, activities, operationalMaps }) {
  const rows = useMemo(() => {
    const areaRows = areas.map(area => {
      const acts = activities.filter(activity => activity.area_id === area.id);
      if (!acts.length) return null;
      const mapProgress = operationalMaps
        .filter(map => acts.some(activity => activity.id === map.activity_id))
        .map(map => safeNumber(map.progress_percentage))
        .filter(value => value > 0);
      const progress = mapProgress.length
        ? Math.round(mapProgress.reduce((sum, value) => sum + value, 0) / mapProgress.length)
        : Math.round(acts.reduce((sum, activity) => sum + safeNumber(activity.progress), 0) / acts.length);
      const areaM2 = acts.reduce((sum, activity) => sum + safeNumber(activity.area_m2), 0);
      return {
        id: area.id,
        name: area.name,
        risk: area.risk_level || 'low',
        progress,
        active: acts.filter(activity => activity.status === 'in_progress').length,
        delayed: acts.filter(isOverdue).length,
        areaM2,
      };
    }).filter(Boolean);

    if (areaRows.length) return areaRows.sort((a, b) => b.delayed - a.delayed || b.active - a.active || b.progress - a.progress).slice(0, 6);

    return activities.slice(0, 5).map(activity => ({
      id: activity.id,
      name: activity.bloco_nome || activity.title,
      risk: activity.priority || 'medium',
      progress: safeNumber(activity.progress),
      active: activity.status === 'in_progress' ? 1 : 0,
      delayed: isOverdue(activity) ? 1 : 0,
      areaM2: safeNumber(activity.area_m2),
    }));
  }, [activities, areas, operationalMaps]);

  const riskColor = { low: '#00D99A', medium: '#E8C200', high: '#E87D00', critical: '#FC5252' };

  return (
    <PanelShell title="Mapa Operacional" eyebrow="Frentes e Áreas" icon={MapPinned} color="#14B8D4">
      {rows.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-xs" style={{ color: '#4A5568' }}>Sem frentes operacionais mapeadas</div>
      ) : (
        <div className="space-y-3">
          {rows.map(row => {
            const color = riskColor[row.risk] || '#14B8D4';
            return (
              <div key={row.id} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.035)', border: `1px solid ${color}24` }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{row.name}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: '#718096' }}>
                      {compactNumber(row.areaM2, ' m²')} · {row.active} ativa(s) · {row.delayed} risco(s)
                    </p>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ color, background: `${color}13`, border: `1px solid ${color}30` }}>
                    {row.progress}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(row.progress, 100)}%`, background: `linear-gradient(90deg, ${color}, #14B8D4)`, boxShadow: `0 0 12px ${color}55` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PanelShell>
  );
}

function OperationalRankingPanel({ teams }) {
  return (
    <PanelShell title="Ranking Operacional" eyebrow="Performance por Equipe" icon={BarChart3} color="#6D56E8">
      {teams.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-xs" style={{ color: '#4A5568' }}>Sem equipes com dados</div>
      ) : (
        <div className="space-y-3">
          {teams.slice(0, 5).map((team, index) => {
            const color = team.score >= 80 ? '#00D99A' : team.score >= 55 ? '#E87D00' : '#FC5252';
            return (
              <div key={team.id} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                    style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{team.name}</p>
                    <p className="text-[10px]" style={{ color: '#718096' }}>{team.completed}/{team.total} concluídas · {team.delayed} atraso(s)</p>
                  </div>
                  <span className="text-lg font-black" style={{ color }}>{team.score}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{ width: `${team.score}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PanelShell>
  );
}

function StatusSummaryPanel({ analytics }) {
  return (
    <PanelShell title="Saúde Operacional" eyebrow="Resumo Executivo" icon={Gauge} color="#00D99A">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Em andamento', value: analytics.inProgress, color: '#14B8D4' },
          { label: 'Concluídas', value: analytics.completed, color: '#00D99A' },
          { label: 'Atrasadas', value: analytics.delayed, color: '#FC5252' },
          { label: 'Equipes ativas', value: analytics.activeTeams, color: '#6D56E8' },
        ].map(item => (
          <div key={item.label} className="rounded-xl p-3 text-center" style={{ background: `${item.color}0d`, border: `1px solid ${item.color}24` }}>
            <p className="text-xl font-black" style={{ color: item.color }}>{item.value}</p>
            <p className="text-[10px] mt-1 font-semibold" style={{ color: '#718096' }}>{item.label}</p>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

export default function Dashboard() {
  const { workspaceId, currentWorkspace } = useWorkspace();
  const db = useWorkspaceEntities();
  const goLiveDate = currentWorkspace?.go_live_date;

  const { data: activities = [], isLoading: loadAct } = useActivities();
  const { data: contracts = [], isLoading: loadCon } = useContracts();
  const { data: teams = [] } = useTeams();
  const { data: areas = [] } = useAreas();
  const { data: employees = [] } = useEmployees();
  const { data: materials = [] } = useMaterials();
  const { data: sessions = [] } = useActivitySessions(null);
  const { data: operationalMaps = [] } = useOperationalMaps(null);

  const { data: fieldLogs = [] } = useQuery({
    queryKey: ['dashboardFieldLogs', workspaceId, goLiveDate || 'all'],
    queryFn: () => db.FieldLog.list('-date', 120),
    enabled: !!workspaceId,
    staleTime: 2 * 60_000,
    select: buildGoLiveSelect(goLiveDate, 'FieldLog'),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['dashboardAppointments', workspaceId, goLiveDate || 'all'],
    queryFn: () => db.Appointment.list('-date', 160),
    enabled: !!workspaceId,
    staleTime: 2 * 60_000,
    select: buildGoLiveSelect(goLiveDate, 'Appointment'),
  });

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);
  const dayLabel = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });

  const analytics = useMemo(() => {
    const activeEmployees = employees.filter(employee => employee.status !== 'inactive' && employee.status !== 'suspended').length;
    const activeTeams = teams.filter(team => team.status === 'active').length;
    const completed = activities.filter(activity => activity.status === 'completed').length;
    const inProgress = activities.filter(activity => activity.status === 'in_progress').length;
    const delayed = activities.filter(activity => activity.status === 'delayed' || isOverdue(activity)).length;
    const plannedHours = activities.reduce((sum, activity) => sum + safeNumber(activity.hours_planned), 0);
    const actualHours = activities.reduce((sum, activity) => sum + safeNumber(activity.hours_actual), 0);
    const efficiency = actualHours > 0 ? Math.round((plannedHours / actualHours) * 100) : 0;
    const sessionsToday = sessions.filter(session => session.date === TODAY);
    const descentsToday = sessionsToday.reduce((sum, session) => sum + safeNumber(session.descidas_realizadas), 0);
    const executedM2Today = sessionsToday.reduce((sum, session) => sum + parseMetricNumber(session.executed_area), 0);
    const totalDescents = activities.reduce((sum, activity) => sum + safeNumber(activity.descents_completed), 0);
    const productivityPerCollaborator = activeEmployees ? Math.round((descentsToday / activeEmployees) * 10) / 10 : 0;
    const overdueActivities = activities.filter(isOverdue).length;
    const sla = activities.length ? pct(activities.length - overdueActivities, activities.length) : 100;
    const loggedIdleHours = fieldLogs.reduce((sum, log) => sum + safeNumber(log.idle_hours), 0);
    const unproductiveHours = loggedIdleHours || Math.max(0, Math.round((actualHours - plannedHours) * 10) / 10);
    const reworkBase = appointments.filter(appointment => appointment.report_status !== 'not_started' || appointment.status !== 'not_started').length;
    const reworkIndex = reworkBase ? pct(appointments.filter(appointment => appointment.report_rework).length, reworkBase) : 0;
    const contractsAtRisk = contracts.filter(contract => {
      const due = daysUntil(contract.end_date);
      const hasDelayedActivity = activities.some(activity => activity.contract_id === contract.id && isOverdue(activity));
      return contract.status === 'active' && (hasDelayedActivity || (due !== null && due <= 30));
    }).length;
    const criticalStock = materials.filter(material => safeNumber(material.quantity_available) <= safeNumber(material.low_stock_threshold || 5)).length;
    const totalM2 = activities.reduce((sum, activity) => sum + safeNumber(activity.area_m2), 0);
    const executedM2Total = activities.reduce((sum, activity) => sum + (safeNumber(activity.area_m2) * safeNumber(activity.progress)) / 100, 0);

    const teamRanking = teams.map(team => {
      const teamActivities = activities.filter(activity => activity.team_id === team.id);
      const teamCompleted = teamActivities.filter(activity => activity.status === 'completed').length;
      const teamDelayed = teamActivities.filter(activity => activity.status === 'delayed' || isOverdue(activity)).length;
      const avgProgress = teamActivities.length
        ? Math.round(teamActivities.reduce((sum, activity) => sum + safeNumber(activity.progress), 0) / teamActivities.length)
        : 0;
      const score = Math.max(0, Math.min(100, Math.round(avgProgress + pct(teamCompleted, Math.max(teamActivities.length, 1)) * 0.25 - teamDelayed * 8)));
      return { id: team.id, name: team.name, score, completed: teamCompleted, delayed: teamDelayed, total: teamActivities.length };
    }).filter(team => team.total > 0).sort((a, b) => b.score - a.score);

    return {
      activeEmployees,
      activeTeams,
      completed,
      inProgress,
      delayed,
      plannedHours,
      actualHours,
      efficiency,
      descentsToday,
      executedM2Today,
      totalDescents,
      productivityPerCollaborator,
      sla,
      unproductiveHours,
      reworkIndex,
      contractsAtRisk,
      criticalStock,
      totalM2,
      executedM2Total,
      teamRanking,
    };
  }, [activities, appointments, contracts, employees, fieldLogs, materials, sessions, teams]);

  const todayActivities = useMemo(() =>
    activities
      .filter(activity => activity.status === 'in_progress' || activity.status === 'not_started')
      .sort((a, b) => {
        if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
        if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
        return 0;
      })
      .slice(0, 7),
    [activities]
  );

  const isLoading = loadAct || loadCon;

  const executiveKpis = [
    { icon: Gauge, label: 'Eficiência Operacional', value: `${analytics.efficiency}%`, sub: `${compactNumber(analytics.actualHours, 'h')} realizadas`, color: analytics.efficiency >= 90 ? '#00D99A' : analytics.efficiency >= 70 ? '#E87D00' : '#FC5252', tone: analytics.efficiency >= 90 ? 'success' : analytics.efficiency >= 70 ? 'warning' : 'danger' },
    { icon: Factory, label: 'm² Executado Hoje', value: compactNumber(analytics.executedM2Today, ' m²'), sub: `${compactNumber(analytics.executedM2Total, ' m²')} acumulado`, color: '#14B8D4' },
    { icon: HardHat, label: 'Produtividade Média', value: compactNumber(analytics.productivityPerCollaborator), sub: 'descidas / colaborador hoje', color: '#6D56E8' },
    { icon: ShieldCheck, label: 'SLA Operacional', value: `${analytics.sla}%`, sub: 'atividades dentro do prazo', color: analytics.sla >= 90 ? '#00D99A' : analytics.sla >= 75 ? '#E87D00' : '#FC5252', tone: analytics.sla >= 90 ? 'success' : analytics.sla >= 75 ? 'warning' : 'danger' },
    { icon: Timer, label: 'Horas Improdutivas', value: compactNumber(analytics.unproductiveHours, 'h'), sub: 'ociosas ou desvio positivo', color: analytics.unproductiveHours > 0 ? '#E87D00' : '#00D99A', tone: analytics.unproductiveHours > 0 ? 'warning' : 'success' },
    { icon: RotateCcw, label: 'Índice de Retrabalho', value: `${analytics.reworkIndex}%`, sub: 'apontamentos com retrabalho', color: analytics.reworkIndex > 0 ? '#FC5252' : '#00D99A', tone: analytics.reworkIndex > 0 ? 'danger' : 'success' },
    { icon: TrendingDown, label: 'Contratos em Risco', value: analytics.contractsAtRisk, sub: 'prazo ou atividade crítica', color: analytics.contractsAtRisk > 0 ? '#FC5252' : '#00D99A', tone: analytics.contractsAtRisk > 0 ? 'danger' : 'success' },
    { icon: Package, label: 'Estoque Crítico', value: analytics.criticalStock, sub: 'itens abaixo do mínimo', color: analytics.criticalStock > 0 ? '#E87D00' : '#00D99A', tone: analytics.criticalStock > 0 ? 'warning' : 'success' },
  ];

  return (
    <div className="space-y-5 page-enter">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium capitalize" style={{ color: '#718096' }}>{dayLabel}</p>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight mt-0.5"
            style={{
              background: 'linear-gradient(120deg, #FFFFFF 22%, #14B8D4 62%, #6D56E8 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
            {greeting} — Inteligência Operacional
          </h1>
          <p className="text-sm mt-1" style={{ color: '#4A5568' }}>
            Cockpit enterprise para execução, risco, produtividade e SLA em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider"
            style={{ background: 'rgba(0,217,154,0.09)', border: '1px solid rgba(0,217,154,0.24)', color: '#00D99A' }}>
            <Radar className="w-3 h-3" /> Live Ops
          </span>
          {analytics.delayed > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(252,82,82,0.10)', border: '1px solid rgba(252,82,82,0.25)', color: '#FC5252' }}>
              <AlertTriangle className="w-3 h-3" /> {analytics.delayed} atraso(s)
            </span>
          )}
          <Link to="/activities"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:brightness-110"
            style={{ background: 'rgba(109,86,232,0.10)', border: '1px solid rgba(109,86,232,0.25)', color: '#6D56E8' }}>
            <Zap className="w-3 h-3" /> Operação
          </Link>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton type="kpi" count={8} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 2xl:grid-cols-8 gap-3">
          {executiveKpis.map(kpi => <ExecutiveKPI key={kpi.label} {...kpi} />)}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8">
          <DashboardCharts activities={activities} teams={teams} sessions={sessions} />
        </div>
        <div className="xl:col-span-4 space-y-5">
          <OperationalMapPanel areas={areas} activities={activities} operationalMaps={operationalMaps} />
          <OperationalRankingPanel teams={analytics.teamRanking} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8 rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 16px 40px rgba(0,0,0,0.24)' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" style={{ color: '#14B8D4' }} />
              <h2 className="text-sm font-bold text-white">Atividades Operacionais</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(20,184,212,0.10)', color: '#14B8D4', border: '1px solid rgba(20,184,212,0.2)' }}>
                {todayActivities.length}
              </span>
            </div>
            <Link to="/activities" className="text-[11px] font-semibold flex items-center gap-1 transition-all hover:opacity-80" style={{ color: '#14B8D4' }}>
              Ver todas <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-3 space-y-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : todayActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(20,184,212,0.08)', border: '1px solid rgba(20,184,212,0.15)' }}>
                  <PlayCircle className="w-6 h-6" style={{ color: '#14B8D4' }} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">Nenhuma atividade pendente</p>
                  <p className="text-xs mt-1" style={{ color: '#4A5568' }}>Todas as atividades foram concluídas</p>
                </div>
                <Link to="/activities" className="text-xs font-bold px-4 py-2 rounded-xl transition-all hover:brightness-110" style={{ background: 'rgba(20,184,212,0.12)', color: '#14B8D4', border: '1px solid rgba(20,184,212,0.25)' }}>
                  Criar nova atividade
                </Link>
              </div>
            ) : (
              todayActivities.map(activity => (
                <TodayActivityRow key={activity.id} activity={activity} teams={teams} sessions={sessions} />
              ))
            )}
          </div>
        </div>

        <div className="xl:col-span-4 space-y-5">
          <StatusSummaryPanel analytics={analytics} />
          <AlertsPanel />
        </div>
      </div>

      <InsightsPanel activities={activities} teams={teams} />
    </div>
  );
}
