import React, { useMemo } from 'react';
import { useActivities, useContracts, useTeams } from '@/lib/useAppData';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import {
  ClipboardList, TrendingUp, Users, AlertTriangle,
  ArrowDownCircle, CheckCircle2, Clock, PlayCircle,
  ChevronRight, Activity, Building2, Zap,
} from 'lucide-react';

// ── KPI Card compacto ──────────────────────────────────────────────
function KPI({ icon: Icon, label, value, sub, color = '#14B8D4', urgent }) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-2 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: urgent
          ? 'rgba(252,82,82,0.07)'
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${urgent ? 'rgba(252,82,82,0.22)' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: urgent ? '0 0 14px rgba(252,82,82,0.08)' : 'none',
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {sub && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${color}12`, color }}>
            {sub}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-black text-white leading-none">{value}</p>
        <p className="text-xs mt-1 font-medium" style={{ color: '#718096' }}>{label}</p>
      </div>
    </div>
  );
}

// ── Activity Row — hoje / em execução ──────────────────────────────
function TodayActivityRow({ activity, teams, sessions }) {
  const today = new Date().toISOString().slice(0, 10);
  const team = teams.find(t => t.id === activity.team_id);
  const activeSession = sessions.find(s => s.activity_id === activity.id && s.status === 'em_execucao');
  const todaySession  = sessions.find(s => s.activity_id === activity.id && s.date === today && s.status === 'finalizado');

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
        {/* Progress ring mini */}
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

// ── Main Dashboard ─────────────────────────────────────────────────
export default function Dashboard() {
  const { data: activities = [], isLoading: loadAct } = useActivities();
  const { data: contracts = [], isLoading: loadCon } = useContracts();
  const { data: teams = [] } = useTeams();

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);
  const dayLabel = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });

  const kpis = useMemo(() => {
    const activeContracts = contracts.filter(c => c.status === 'active').length;
    const inProgress = activities.filter(a => a.status === 'in_progress').length;
    const delayed = activities.filter(a => a.status === 'delayed').length;
    const completed = activities.filter(a => a.status === 'completed').length;
    const totalDescents = activities.reduce((s, a) => s + (a.descents_completed || 0), 0);
    const totalProgress = activities.length > 0
      ? Math.round(activities.reduce((s, a) => s + (a.progress || 0), 0) / activities.length)
      : 0;
    const activeTeams = teams.filter(t => t.status === 'active').length;
    return { activeContracts, inProgress, delayed, completed, totalDescents, totalProgress, activeTeams };
  }, [activities, contracts, teams]);

  // Atividades relevantes para hoje: em_andamento ou scheduled para hoje
  const todayActivities = useMemo(() =>
    activities
      .filter(a => a.status === 'in_progress' || a.status === 'not_started')
      .sort((a, b) => {
        // em execução primeiro
        if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
        if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
        return 0;
      })
      .slice(0, 6),
    [activities]
  );

  const isLoading = loadAct || loadCon;

  return (
    <div className="space-y-6 page-enter">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium capitalize" style={{ color: '#718096' }}>{dayLabel}</p>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight mt-0.5"
            style={{
              background: 'linear-gradient(120deg, #FFFFFF 30%, #14B8D4 80%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
            {greeting} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: '#4A5568' }}>
            Visão operacional do dia
          </p>
        </div>

        {/* Quick status chips */}
        <div className="flex flex-wrap gap-2 items-center">
          {kpis.inProgress > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(20,184,212,0.10)', border: '1px solid rgba(20,184,212,0.25)', color: '#14B8D4' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#14B8D4' }} />
              {kpis.inProgress} em andamento
            </span>
          )}
          {kpis.delayed > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(252,82,82,0.10)', border: '1px solid rgba(252,82,82,0.25)', color: '#FC5252' }}>
              <AlertTriangle className="w-3 h-3" />
              {kpis.delayed} atrasada{kpis.delayed > 1 ? 's' : ''}
            </span>
          )}
          <Link to="/activities"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:brightness-110"
            style={{ background: 'rgba(109,86,232,0.10)', border: '1px solid rgba(109,86,232,0.25)', color: '#6D56E8' }}>
            <Zap className="w-3 h-3" />
            Ver atividades
          </Link>
        </div>
      </div>

      {/* ── KPIs ────────────────────────────────────────────────── */}
      {isLoading ? (
        <LoadingSkeleton type="kpi" count={6} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPI icon={Building2}      label="Contratos Ativos"    value={kpis.activeContracts}   color="#14B8D4" />
          <KPI icon={ClipboardList}  label="Em Andamento"        value={kpis.inProgress}         color="#00D99A" />
          <KPI icon={CheckCircle2}   label="Concluídas"          value={kpis.completed}          color="#00D99A" />
          <KPI icon={ArrowDownCircle} label="Descidas Realizadas" value={kpis.totalDescents}      color="#6D56E8" />
          <KPI icon={TrendingUp}     label="Progresso Geral"     value={`${kpis.totalProgress}%`} color="#14B8D4" />
          <KPI icon={AlertTriangle}  label="Atrasadas"           value={kpis.delayed}            color="#FC5252" urgent={kpis.delayed > 0} />
        </div>
      )}

      {/* ── Conteúdo principal ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Atividades do dia — 2/3 */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" style={{ color: '#14B8D4' }} />
              <h2 className="text-sm font-bold text-white">Atividades Operacionais</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(20,184,212,0.10)', color: '#14B8D4', border: '1px solid rgba(20,184,212,0.2)' }}>
                {todayActivities.length}
              </span>
            </div>
            <Link to="/activities"
              className="text-[11px] font-semibold flex items-center gap-1 transition-all hover:opacity-80"
              style={{ color: '#14B8D4' }}>
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
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(20,184,212,0.08)', border: '1px solid rgba(20,184,212,0.15)' }}>
                  <PlayCircle className="w-6 h-6" style={{ color: '#14B8D4' }} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">Nenhuma atividade pendente</p>
                  <p className="text-xs mt-1" style={{ color: '#4A5568' }}>Todas as atividades foram concluídas</p>
                </div>
                <Link to="/activities"
                  className="text-xs font-bold px-4 py-2 rounded-xl transition-all hover:brightness-110"
                  style={{ background: 'rgba(20,184,212,0.12)', color: '#14B8D4', border: '1px solid rgba(20,184,212,0.25)' }}>
                  Criar nova atividade
                </Link>
              </div>
            ) : (
              todayActivities.map(a => (
                <TodayActivityRow key={a.id} activity={a} teams={teams} sessions={[]} />
              ))
            )}
          </div>
        </div>

        {/* Painel lateral direito — 1/3 */}
        <div className="flex flex-col gap-4">
          {/* Resumo por status */}
          <div className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#718096' }}>
              Resumo de Status
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Em Andamento', count: kpis.inProgress, color: '#14B8D4', total: activities.length },
                { label: 'Concluídas', count: kpis.completed, color: '#00D99A', total: activities.length },
                { label: 'Não Iniciadas', count: activities.filter(a => a.status === 'not_started').length, color: '#718096', total: activities.length },
                { label: 'Atrasadas', count: kpis.delayed, color: '#FC5252', total: activities.length },
              ].map(({ label, count, color, total }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: '#A0AEC0' }}>{label}</span>
                    <span className="font-bold" style={{ color }}>{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: total > 0 ? `${Math.round((count / total) * 100)}%` : '0%',
                        background: color,
                        boxShadow: `0 0 6px ${color}60`,
                      }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Equipes ativas */}
          <div className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#718096' }}>Equipes</h3>
              <Link to="/teams"
                className="text-[10px] font-semibold" style={{ color: '#14B8D4' }}>Ver todas</Link>
            </div>
            {teams.filter(t => t.status === 'active').slice(0, 5).map(team => {
              const teamActs = activities.filter(a => a.team_id === team.id && a.status === 'in_progress').length;
              return (
                <div key={team.id} className="flex items-center gap-3 py-2"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${team.color || '#14B8D4'}18`, border: `1px solid ${team.color || '#14B8D4'}30` }}>
                    <Users className="w-3.5 h-3.5" style={{ color: team.color || '#14B8D4' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{team.name}</p>
                  </div>
                  {teamActs > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(20,184,212,0.12)', color: '#14B8D4' }}>
                      {teamActs} ativ.
                    </span>
                  )}
                </div>
              );
            })}
            {teams.filter(t => t.status === 'active').length === 0 && (
              <p className="text-xs text-center py-4" style={{ color: '#4A5568' }}>Nenhuma equipe ativa</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Alertas e Gráficos ──────────────────────────────────── */}
      <AlertsPanel />
      {!isLoading && activities.length > 0 && (
        <DashboardCharts activities={activities} teams={teams} areas={[]} />
      )}
    </div>
  );
}
