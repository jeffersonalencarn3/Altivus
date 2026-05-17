import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { useWorkspace } from '@/lib/useWorkspace';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { Clock, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { buildGoLiveSelect } from '@/lib/goLive';

const CHART_TT = {
  contentStyle: { background: 'rgba(8,14,28,0.97)', border: '1px solid rgba(20,184,212,0.22)', borderRadius: 12, color: '#fff' },
  labelStyle: { color: '#A0AEC0', fontWeight: 600, fontSize: 12 },
};

function Widget({ label, value, sub, color = '#14B8D4', icon: Icon }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(145deg,rgba(10,18,36,0.92),rgba(6,10,22,0.97))', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#718096' }}>{label}</p>
          <p className="text-2xl font-black" style={{ color }}>{value}</p>
          {sub && <p className="text-xs mt-0.5" style={{ color: '#4A5568' }}>{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ml-3" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

export default function AppointmentDashboard() {
  const today = new Date().toISOString().split('T')[0];
  const db = useWorkspaceEntities();
  const { workspaceId, currentWorkspace } = useWorkspace();
  const goLiveDate = currentWorkspace?.go_live_date;

  const { data: appts = [], isLoading } = useQuery({
    queryKey: ['appointments', workspaceId, goLiveDate || 'all'],
    queryFn: () => db.Appointment.list('-date', 200),
    enabled: !!workspaceId,
    select: buildGoLiveSelect(goLiveDate, 'Appointment'),
  });

  const stats = useMemo(() => {
    const todayAppts = appts.filter(a => a.date === today);
    const closed = appts.filter(a => a.status === 'approved' || a.status === 'awaiting_approval');
    const inProgress = appts.filter(a => a.status === 'in_progress' || a.status === 'executing');
    const withoutPhoto = appts.filter(a => (a.photos_before || []).length === 0 && a.status !== 'not_started');
    const withoutReport = appts.filter(a => a.report_status === 'not_started' && (a.photos_before || []).length > 0);
    const withoutSig = appts.filter(a => !a.signature_worker && a.status === 'awaiting_approval');

    const totalHours = appts.reduce((s, a) => s + (a.total_hours || 0), 0);
    const approvedCount = appts.filter(a => a.approval_status === 'approved').length;
    const rejectedCount = appts.filter(a => a.approval_status === 'rejected').length;

    // By employee
    const byEmployee = {};
    appts.forEach(a => {
      if (!a.employee_name) return;
      if (!byEmployee[a.employee_name]) byEmployee[a.employee_name] = { name: a.employee_name, hours: 0, count: 0, reports: 0 };
      byEmployee[a.employee_name].hours += a.total_hours || 0;
      byEmployee[a.employee_name].count++;
      if (a.report_status === 'filled' || a.report_status === 'approved') byEmployee[a.employee_name].reports++;
    });
    const employeeData = Object.values(byEmployee).sort((a, b) => b.hours - a.hours).slice(0, 8);

    // Weekly trend
    const weeklyMap = {};
    appts.forEach(a => {
      if (!a.date) return;
      const d = new Date(a.date);
      const week = `${d.getFullYear()}-W${String(Math.ceil((d.getDate()) / 7)).padStart(2,'0')}`;
      if (!weeklyMap[week]) weeklyMap[week] = { week, appts: 0, hours: 0 };
      weeklyMap[week].appts++;
      weeklyMap[week].hours += a.total_hours || 0;
    });
    const weekly = Object.values(weeklyMap).slice(-8);

    const alerts = [];
    if (withoutPhoto.length) alerts.push({ msg: `${withoutPhoto.length} apontamento(s) iniciado(s) sem foto`, color: '#E87D00' });
    if (withoutReport.length) alerts.push({ msg: `${withoutReport.length} reporte(s) pendente(s)`, color: '#DC3737' });
    if (withoutSig.length) alerts.push({ msg: `${withoutSig.length} aguardando assinatura`, color: '#6D56E8' });

    return { todayAppts, inProgress, closed, totalHours, approvedCount, rejectedCount, employeeData, weekly, alerts };
  }, [appts, today]);

  if (isLoading) return <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {stats.alerts.length > 0 && (
        <div className="space-y-2">
          {stats.alerts.map((a, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: `${a.color}10`, border: `1px solid ${a.color}35`, color: a.color }}>
              <AlertTriangle className="w-4 h-4 shrink-0" /> {a.msg}
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#14B8D4' }}>📊 Visão Geral — Apontamentos</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Widget label="Total Apontamentos" value={appts.length} color="#14B8D4" icon={FileText} sub="todos os períodos" />
          <Widget label="Em Andamento" value={stats.inProgress.length} color="#6D56E8" icon={Clock} sub="ativos agora" />
          <Widget label="Horas Registradas" value={`${stats.totalHours.toFixed(1)}h`} color="#00D99A" icon={Clock} />
          <Widget label="Aprovados" value={stats.approvedCount} color="#00D99A" icon={CheckCircle2} sub={`${stats.rejectedCount} reprovados`} />
        </div>
      </div>

      {/* Today */}
      <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(145deg,rgba(10,18,36,0.92),rgba(6,10,22,0.97))', border: '1px solid rgba(20,184,212,0.12)' }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#14B8D4' }}>
          📅 Hoje — {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
        </p>
        {stats.todayAppts.length === 0 ? (
          <p className="text-sm" style={{ color: '#4A5568' }}>Nenhum apontamento registrado hoje.</p>
        ) : (
          <div className="space-y-2">
            {stats.todayAppts.map(a => (
              <div key={a.id} className="flex items-center justify-between rounded-xl px-3 py-2.5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div>
                  <p className="text-sm font-semibold text-white">{a.employee_name || '—'}</p>
                  <p className="text-xs" style={{ color: '#718096' }}>{a.employee_role || ''} · {a.start_time || '—'}{a.end_time ? ` – ${a.end_time}` : ''}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {(a.photos_before || []).length > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background: 'rgba(232,125,0,0.12)', color: '#E87D00' }}>📷</span>}
                  {(a.photos_after || []).length > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background: 'rgba(0,217,154,0.12)', color: '#00D99A' }}>📷✓</span>}
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background: 'rgba(20,184,212,0.12)', color: '#14B8D4' }}>{a.total_hours || 0}h</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(145deg,rgba(10,18,36,0.92),rgba(6,10,22,0.97))', border: '1px solid rgba(109,86,232,0.12)' }}>
          <p className="text-sm font-bold text-white mb-4">👤 Horas por Colaborador</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.employeeData} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#718096', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_TT} />
              <Bar dataKey="hours" fill="#6D56E8" radius={[6, 6, 0, 0]} name="Horas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(145deg,rgba(10,18,36,0.92),rgba(6,10,22,0.97))', border: '1px solid rgba(20,184,212,0.12)' }}>
          <p className="text-sm font-bold text-white mb-4">📈 Apontamentos por Semana</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="week" tick={{ fill: '#718096', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_TT} />
              <Line type="monotone" dataKey="appts" stroke="#14B8D4" strokeWidth={2.5} dot={{ fill: '#14B8D4', r: 4 }} name="Apontamentos" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per employee table */}
      {stats.employeeData.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(145deg,rgba(10,18,36,0.92),rgba(6,10,22,0.97))', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-sm font-bold text-white mb-4">📋 Resumo por Colaborador</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Colaborador', 'Apontamentos', 'Horas', 'Reportes'].map(h => (
                    <th key={h} className="text-left pb-2 pr-4 font-bold uppercase tracking-wider" style={{ color: '#718096' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.employeeData.map((e, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="py-2 pr-4 font-semibold text-white">{e.name}</td>
                    <td className="py-2 pr-4" style={{ color: '#14B8D4' }}>{e.count}</td>
                    <td className="py-2 pr-4" style={{ color: '#00D99A' }}>{e.hours.toFixed(1)}h</td>
                    <td className="py-2 pr-4" style={{ color: '#6D56E8' }}>{e.reports}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
