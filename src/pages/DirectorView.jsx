import React, { useMemo } from 'react';
import { useActivities, useContracts, useTeams } from '@/lib/useAppData';
import PageHeader from '@/components/shared/PageHeader';
import KPICard from '@/components/shared/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Eye, TrendingUp, AlertTriangle, Clock, CheckCircle2, ShieldAlert, CalendarClock } from 'lucide-react';
import { differenceInDays, format, addDays } from 'date-fns';

export default function DirectorView() {
  const { data: activities = [] } = useActivities();
  const { data: contracts = [] } = useContracts();
  const { data: teams = [] } = useTeams();

  const analysis = useMemo(() => {
    const today = new Date();
    const total = activities.length;
    const completed = activities.filter(a => a.status === 'completed').length;
    const delayed = activities.filter(a => a.status === 'delayed').length;
    const inProgress = activities.filter(a => a.status === 'in_progress').length;
    const overallProgress = total > 0 ? Math.round(activities.reduce((s, a) => s + (a.progress || 0), 0) / total) : 0;

    // Delay rate
    const delayRate = total > 0 ? Math.round((delayed / total) * 100) : 0;

    // Forecast: estimate completion based on current trend
    const completedCount = completed;
    const remaining = total - completedCount;
    const daysActive = activities.filter(a => a.start_date).reduce((min, a) => {
      const diff = differenceInDays(today, new Date(a.start_date));
      return diff > min ? diff : min;
    }, 1);
    const dailyRate = daysActive > 0 ? completedCount / daysActive : 0;
    const daysToComplete = dailyRate > 0 ? Math.ceil(remaining / dailyRate) : 999;
    const estimatedCompletion = addDays(today, daysToComplete);

    // Risk index
    const riskActivities = activities.filter(a => a.risks && a.risks.trim() !== '');
    const riskIndex = total > 0 ? Math.round((riskActivities.length / total) * 100) : 0;

    // Alerts
    const alerts = [];
    if (delayRate > 20) alerts.push({ type: 'danger', message: `${delayRate}% das atividades estão atrasadas` });
    if (delayRate > 10 && delayRate <= 20) alerts.push({ type: 'warning', message: `${delayRate}% das atividades estão atrasadas - atenção!` });
    
    const contractsExpiring = contracts.filter(c => c.end_date && differenceInDays(new Date(c.end_date), today) < 30 && differenceInDays(new Date(c.end_date), today) >= 0);
    contractsExpiring.forEach(c => alerts.push({ type: 'warning', message: `Contrato "${c.name}" vence em ${differenceInDays(new Date(c.end_date), today)} dias` }));

    const criticalActivities = activities.filter(a => a.priority === 'critical' && a.status !== 'completed');
    if (criticalActivities.length > 0) alerts.push({ type: 'danger', message: `${criticalActivities.length} atividade(s) crítica(s) pendente(s)` });

    // Monthly trend (mock based on activities dates)
    const monthMap = {};
    activities.forEach(a => {
      if (a.start_date) {
        const month = a.start_date.substring(0, 7);
        if (!monthMap[month]) monthMap[month] = { month, planejadas: 0, concluidas: 0 };
        monthMap[month].planejadas++;
        if (a.status === 'completed') monthMap[month].concluidas++;
      }
    });
    const trendData = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

    return { overallProgress, delayRate, daysToComplete, estimatedCompletion, riskIndex, alerts, trendData, completed, total, inProgress, delayed };
  }, [activities, contracts]);

  const tooltipStyle = { backgroundColor: 'hsl(222,47%,11%)', border: '1px solid hsl(217,33%,17%)', borderRadius: '8px', color: '#e2e8f0', fontSize: '12px' };

  return (
    <div>
      <PageHeader title="Visão Diretor" subtitle="Indicadores estratégicos consolidados">
        <Badge className="bg-primary/10 text-primary border-primary/30 text-xs"><Eye className="w-3 h-3 mr-1" /> Modo Executivo</Badge>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Progresso Global" value={`${analysis.overallProgress}%`} icon={TrendingUp} color={analysis.overallProgress >= 70 ? 'success' : analysis.overallProgress >= 40 ? 'warning' : 'danger'} subtitle={`${analysis.completed}/${analysis.total} concluídas`} />
        <KPICard title="Índice de Atraso" value={`${analysis.delayRate}%`} icon={AlertTriangle} color={analysis.delayRate > 20 ? 'danger' : analysis.delayRate > 10 ? 'warning' : 'success'} subtitle={`${analysis.delayed} atrasadas`} />
        <KPICard title="Previsão Conclusão" value={analysis.daysToComplete < 999 ? `${analysis.daysToComplete} dias` : 'N/A'} icon={CalendarClock} color="primary" subtitle={analysis.daysToComplete < 999 ? format(analysis.estimatedCompletion, 'dd/MM/yyyy') : 'Sem dados suficientes'} />
        <KPICard title="Índice de Risco" value={`${analysis.riskIndex}%`} icon={ShieldAlert} color={analysis.riskIndex > 30 ? 'danger' : analysis.riskIndex > 15 ? 'warning' : 'success'} subtitle="Atividades com riscos" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Alerts */}
        <Card className="border-border/50 lg:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-yellow-500" /> Alertas Automáticos</CardTitle></CardHeader>
          <CardContent>
            {analysis.alerts.length > 0 ? (
              <div className="space-y-2">
                {analysis.alerts.map((alert, i) => (
                  <div key={i} className={`p-3 rounded-lg border text-xs ${alert.type === 'danger' ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-yellow-500/5 border-yellow-500/20 text-yellow-400'}`}>
                    {alert.type === 'danger' ? <AlertTriangle className="w-3 h-3 inline mr-1.5" /> : <Clock className="w-3 h-3 inline mr-1.5" />}
                    {alert.message}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-4 text-green-500 text-sm">
                <CheckCircle2 className="w-4 h-4" /> Tudo em ordem — sem alertas
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trend */}
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Evolução Mensal</CardTitle></CardHeader>
          <CardContent>
            {analysis.trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={analysis.trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,33%,17%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="planejadas" stroke="hsl(217,91%,60%)" strokeWidth={2} name="Planejadas" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="concluidas" stroke="hsl(142,76%,36%)" strokeWidth={2} name="Concluídas" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">Sem dados históricos</div>}
          </CardContent>
        </Card>
      </div>

      {/* Team Summary */}
      <Card className="border-border/50">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Resumo por Equipe</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {teams.map(team => {
              const ta = activities.filter(a => a.team_id === team.id);
              const prog = ta.length > 0 ? Math.round(ta.reduce((s, a) => s + (a.progress || 0), 0) / ta.length) : 0;
              const delayed = ta.filter(a => a.status === 'delayed').length;
              return (
                <div key={team.id} className="p-4 rounded-xl bg-muted/30 border border-border/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-6 rounded-full" style={{ backgroundColor: team.color || '#3b82f6' }} />
                    <span className="text-sm font-medium">{team.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${prog}%`, backgroundColor: prog >= 70 ? '#22c55e' : prog >= 40 ? '#eab308' : '#ef4444' }} />
                    </div>
                    <span className="text-xs font-medium">{prog}%</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{ta.length} atividades</span>
                    {delayed > 0 && <span className="text-red-400">{delayed} atrasada(s)</span>}
                  </div>
                </div>
              );
            })}
            {teams.length === 0 && <p className="col-span-4 text-center text-sm text-muted-foreground py-4">Nenhuma equipe cadastrada</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}