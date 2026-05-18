import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { useWorkspace } from '@/lib/useWorkspace';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { TrendingUp, Shield, Clock, AlertTriangle, CheckCircle2, Activity, BarChart2, Package, ArrowDown, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { buildGoLiveSelect } from '@/lib/goLive';

const CHART_TT = {
  contentStyle: { background: 'rgba(8,14,28,0.97)', border: '1px solid rgba(20,184,212,0.22)', borderRadius: 12, color: '#fff' },
  labelStyle: { color: '#A0AEC0', fontWeight: 600, fontSize: 12 },
};

function Widget({ label, value, sub, color, icon: Icon, status, extra }) {   
  const sc = status === 'green' ? '#00D99A' : status === 'yellow' ? '#E87D00' : status === 'red' ? '#DC3737' : color;
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'linear-gradient(145deg, rgba(10,18,36,0.92) 0%, rgba(6,10,22,0.97) 100%)',
        border: `1px solid rgba(255,255,255,0.07)`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#718096' }}>{label}</p>
          <p className="text-2xl font-black truncate" style={{ color: sc }}>{value}</p>
          {sub && <p className="text-xs mt-0.5" style={{ color: '#4A5568' }}>{sub}</p>}
          {extra}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ml-3"
          style={{ background: `${sc}18`, border: `1px solid ${sc}30` }}
        >
          <Icon className="w-5 h-5" style={{ color: sc }} />
        </div>
      </div>
    </div>
  );
}

function LowStockAlert({ materials }) {
  const low = materials.filter(m => (m.quantity_available ?? 0) <= (m.low_stock_threshold ?? 5));
  if (low.length === 0) return null;
  return (
    <div className="rounded-2xl p-5"
      style={{ background: 'rgba(220,55,55,0.06)', border: '1px solid rgba(220,55,55,0.22)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4" style={{ color: '#DC3737' }} />
        <span className="text-sm font-bold" style={{ color: '#DC3737' }}>Estoque Crítico — {low.length} item(ns)</span>
      </div>
      <div className="space-y-2">
        {low.map(m => (
          <div key={m.id} className="flex items-center justify-between text-xs rounded-lg px-3 py-2"
            style={{ background: 'rgba(220,55,55,0.08)', border: '1px solid rgba(220,55,55,0.18)' }}>
            <span className="font-semibold text-white">{m.name}</span>
            <div className="flex items-center gap-2">
              <span style={{ color: '#DC3737' }} className="font-bold">{m.quantity_available} {m.unit || 'un'}</span>
              <span style={{ color: '#4A5568' }}>/ mín. {m.low_stock_threshold}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentMovements({ movements, materials }) {
  const matMap = Object.fromEntries(materials.map(m => [m.id, m]));
  const recent = movements.slice(0, 8);
  if (recent.length === 0) return null;

  return (
    <div className="rounded-2xl p-5"
      style={{ background: 'linear-gradient(145deg, rgba(10,18,36,0.92) 0%, rgba(6,10,22,0.97) 100%)', border: '1px solid rgba(109,86,232,0.12)', boxShadow: '0 4px 24px rgba(0,0,0,0.45)' }}>
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-4 h-4" style={{ color: '#6D56E8' }} />
        <span className="text-sm font-bold text-white">Últimas Movimentações de Estoque</span>
      </div>
      <div className="space-y-2">
        {recent.map(mv => {
          const mat = matMap[mv.material_id];
          return (
            <div key={mv.id} className="flex items-center justify-between text-xs rounded-lg px-3 py-2"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p className="font-semibold text-white">{mv.material_name || mat?.name || '—'}</p>
                <p style={{ color: '#4A5568' }}>{mv.collaborator || '—'} · {mv.created_date ? format(new Date(mv.created_date), 'dd/MM HH:mm') : '—'}</p>
              </div>
              <div className="text-right">
                <p className="font-bold" style={{ color: mv.type === 'exit' ? '#E87D00' : '#00D99A' }}>
                  {mv.type === 'exit' ? '−' : '+'}{mv.quantity} {mat?.unit || 'un'}
                </p>
                <p style={{ color: mv.confirmed ? '#00D99A' : '#718096' }}>
                  {mv.confirmed ? '✓ confirmado' : '⏳ pendente'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function FieldLogDashboard() {
  const db = useWorkspaceEntities();
  const { workspaceId, currentWorkspace } = useWorkspace();
  const goLiveDate = currentWorkspace?.go_live_date;

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['fieldlogs', workspaceId, goLiveDate || 'all'],
    queryFn: () => db.FieldLog.list('-date', 100),
    enabled: !!workspaceId,
    select: buildGoLiveSelect(goLiveDate, 'FieldLog'),
  });
  const { data: materials = [] } = useQuery({
    queryKey: ['materials', workspaceId],
    queryFn: () => db.Material.list(),
    enabled: !!workspaceId,
  });
  const { data: movements = [] } = useQuery({
    queryKey: ['material_movements', workspaceId, goLiveDate || 'all'],
    queryFn: () => db.MaterialMovement.list('-created_date', 50),
    enabled: !!workspaceId,
    select: buildGoLiveSelect(goLiveDate, 'MaterialMovement'),
  });
  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', workspaceId],
    queryFn: () => db.Contract.list(),
    enabled: !!workspaceId,
  });

  const today = new Date().toISOString().split('T')[0];

  const stats = useMemo(() => {
    const closed = logs.filter(l => l.status === 'closed' || l.status === 'approved');
    const todayLogs = logs.filter(l => l.date === today);
    const openToday = todayLogs.filter(l => l.status === 'open' || l.status === 'draft');

    // Today production
    const descidasHoje = todayLogs.reduce((s, l) => s + (l.descidas_realizadas ?? 0), 0);
    const colaboradoresAtivos = new Set(
      todayLogs.flatMap(l => l.workers_present ?? [])
    ).size;
    const contratosAtualizados = new Set(
      todayLogs.filter(l => (l.descidas_realizadas ?? 0) > 0).map(l => l.contract_id)
    ).size;

    // Safety & delays
    const withSafety = closed.filter(l => l.nr35_completed && l.anchor_verified && l.ppe_inspected).length;
    const safetyRate = closed.length ? Math.round((withSafety / closed.length) * 100) : 0;
    const delays = closed.filter(l => l.delay_occurred).length;
    const delayRate = closed.length ? Math.round((delays / closed.length) * 100) : 0;
    const incidents = closed.filter(l => l.incident_occurred).length;
    const riskFlags = closed.reduce((s, l) => s + (l.sub_activities ?? []).filter(a => a.risk_flagged).length, 0);
    const totalHours = closed.reduce((s, l) => s + (l.total_hours_team ?? 0), 0);

    // Weekly trend
    const now = new Date();
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i) * 7);
      const wStart = new Date(d); wStart.setDate(d.getDate() - d.getDay());
      const wEnd = new Date(wStart); wEnd.setDate(wStart.getDate() + 6);
      const wLogs = closed.filter(l => { const ld = new Date(l.date); return ld >= wStart && ld <= wEnd; });
      return {
        week: `S${i + 1}`,
        horas: wLogs.reduce((s, l) => s + (l.total_hours_team ?? 0), 0),
        descidas: wLogs.reduce((s, l) => s + (l.descidas_realizadas ?? 0), 0),
      };
    });

    // Descidas por contrato
    const descByContract = {};
    closed.forEach(l => {
      if (!l.contract_id || !l.descidas_realizadas) return;
      descByContract[l.contract_id] = (descByContract[l.contract_id] ?? 0) + l.descidas_realizadas;
    });
    const descidasData = Object.entries(descByContract)
      .sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([id, v]) => ({ name: (contracts.find(c => c.id === id)?.name || id).slice(0, 12), descidas: v }));

    return {
      descidasHoje, colaboradoresAtivos, contratosAtualizados,
      totalHours, safetyRate, delayRate, incidents, riskFlags,
      weeklyData, descidasData, closedCount: closed.length,
      openToday: openToday.length,
    };
  }, [logs, contracts, today]);

  if (isLoading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const safetyStatus = stats.safetyRate >= 90 ? 'green' : stats.safetyRate >= 70 ? 'yellow' : 'red';
  const delayStatus = stats.delayRate <= 10 ? 'green' : stats.delayRate <= 25 ? 'yellow' : 'red';

  return (
    <div className="space-y-6">

      {/* ── Produção do Dia ── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: '#14B8D4' }}>
          <ArrowDown className="w-3.5 h-3.5" /> Produção do Dia — {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Widget label="Descidas Realizadas Hoje" value={stats.descidasHoje} color="#14B8D4" icon={ArrowDown} status="green"
            sub="total do dia" />
          <Widget label="Colaboradores Ativos" value={stats.colaboradoresAtivos} color="#6D56E8" icon={Users}
            sub="com jornada hoje" />
          <Widget label="Contratos Atualizados" value={stats.contratosAtualizados} color="#00D99A" icon={CheckCircle2}
            sub="com descidas hoje" />
        </div>
      </div>

      {/* ── Estoque ── */}
      <LowStockAlert materials={materials} />

      {/* ── Geral ── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#718096' }}>Visão Geral</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Widget label="Total de Horas" value={`${stats.totalHours.toFixed(1)}h`} color="#14B8D4" icon={Clock} status="green" />
          <Widget label="Conformidade NR-35" value={`${stats.safetyRate}%`} color="#00D99A" icon={Shield} status={safetyStatus} />
          <Widget label="Frequência de Atrasos" value={`${stats.delayRate}%`} color="#E87D00" icon={AlertTriangle} status={delayStatus}
            sub={`${stats.closedCount} diários`} />
          <Widget label="Incidentes" value={stats.incidents} color="#DC3737" icon={Activity}
            sub={`${stats.riskFlags} riscos sinalizados`} />
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl p-5"
          style={{ background: 'linear-gradient(145deg, rgba(10,18,36,0.92) 0%, rgba(6,10,22,0.97) 100%)', border: '1px solid rgba(20,184,212,0.10)', boxShadow: '0 4px 24px rgba(0,0,0,0.45)' }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4" style={{ color: '#14B8D4' }} />
            <span className="text-sm font-bold text-white">Descidas por Semana</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="week" tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_TT} />
              <Line type="monotone" dataKey="descidas" stroke="#14B8D4" strokeWidth={2.5} dot={{ fill: '#14B8D4', r: 4 }} activeDot={{ r: 6, fill: '#00D99A' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-5"
          style={{ background: 'linear-gradient(145deg, rgba(10,18,36,0.92) 0%, rgba(6,10,22,0.97) 100%)', border: '1px solid rgba(109,86,232,0.12)', boxShadow: '0 4px 24px rgba(0,0,0,0.45)' }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4" style={{ color: '#6D56E8' }} />
            <span className="text-sm font-bold text-white">Descidas por Contrato</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.descidasData} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#718096', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_TT} />
              <Bar dataKey="descidas" fill="#6D56E8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Recent movements ── */}
      <RecentMovements movements={movements} materials={materials} />

      {/* ── Audit notice ── */}
      <div className="rounded-2xl p-5 flex items-start gap-4"
        style={{ background: 'rgba(109,86,232,0.05)', border: '1px solid rgba(109,86,232,0.16)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(109,86,232,0.15)', border: '1px solid rgba(109,86,232,0.30)' }}>
          <CheckCircle2 className="w-5 h-5" style={{ color: '#6D56E8' }} />
        </div>
        <div>
          <p className="text-sm font-bold text-white mb-1">Sistema de Proteção Legal Ativo</p>
          <p className="text-xs leading-relaxed" style={{ color: '#718096' }}>
            Todos os {stats.closedCount} diários encerrados possuem trilha de auditoria com timestamp, usuário e histórico. Prontos para auditorias e processos.
          </p>
        </div>
      </div>
    </div>
  );
}
