import React, { useMemo } from 'react';
import { useActivities, useAllActivityEmployees } from '@/lib/useAppData';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Activity, Crown, Wrench, HandHelping } from 'lucide-react';

const ROLE_CONFIG = {
  lider:    { label: 'Líder',    icon: Crown,       cls: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
  executor: { label: 'Executor', icon: Wrench,      cls: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
  apoio:    { label: 'Apoio',    icon: HandHelping, cls: 'bg-green-500/10 text-green-600 border-green-500/30' },
};

export default function TeamAllocationView({ employees, teams }) {
  const { data: allAE = [] } = useAllActivityEmployees();
  const { data: activities = [] } = useActivities();

  // Active activities (in_progress)
  const activeActivityIds = new Set(activities.filter(a => a.status === 'in_progress').map(a => a.id));

  // Map: employee_id -> list of active assignments
  const allocMap = useMemo(() => {
    const map = {};
    allAE.filter(ae => activeActivityIds.has(ae.activity_id)).forEach(ae => {
      if (!map[ae.employee_id]) map[ae.employee_id] = [];
      map[ae.employee_id].push(ae);
    });
    return map;
  }, [allAE, activeActivityIds]);

  // Build per-team view
  const teamViews = useMemo(() => {
    return teams.map(team => {
      const members = employees.filter(e => e.team_id === team.id && e.status === 'active');
      const allocated = members.filter(e => allocMap[e.id]);
      const free = members.filter(e => !allocMap[e.id]);
      return { team, members, allocated, free };
    }).filter(tv => tv.members.length > 0);
  }, [teams, employees, allocMap]);

  // Global stats
  const totalActive = Object.keys(allocMap).length;
  const totalEmployees = employees.filter(e => e.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Global summary */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 rounded-lg border border-green-500/20">
          <Activity className="w-4 h-4 text-green-500" />
          <span className="text-sm font-semibold text-green-600">{totalActive}</span>
          <span className="text-xs text-muted-foreground">em atividade agora</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-muted rounded-lg border border-border/50">
          <span className="text-sm font-semibold">{totalEmployees - totalActive}</span>
          <span className="text-xs text-muted-foreground">colaboradores disponíveis</span>
        </div>
      </div>

      {teamViews.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">Nenhuma equipe com colaboradores ativos</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teamViews.map(({ team, members, allocated, free }) => (
            <Card key={team.id} className="border-border/50">
              <CardHeader className="pb-2 flex flex-row items-center gap-3">
                <div className="w-2.5 h-8 rounded-full shrink-0" style={{ backgroundColor: team.color || '#3b82f6' }} />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm truncate">{team.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{allocated.length}/{members.length} alocados</p>
                </div>
                <div className="shrink-0 w-10 h-10 flex flex-col items-center justify-center rounded-full border-2"
                  style={{ borderColor: team.color || '#3b82f6' }}>
                  <span className="text-xs font-bold leading-none">{allocated.length}</span>
                  <span className="text-[9px] text-muted-foreground leading-none">/{members.length}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-1.5">
                {allocated.map(emp => {
                  const assignments = allocMap[emp.id] || [];
                  const totalHours = assignments.reduce((s, a) => s + (a.hours_worked || 0), 0);
                  return (
                    <div key={emp.id} className="flex items-center gap-2 p-2 bg-green-500/5 rounded-md border border-green-500/20">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-600 text-[10px] font-bold shrink-0">
                        {emp.name?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{emp.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {assignments.map(a => {
                            const act = activities.find(ac => ac.id === a.activity_id);
                            const cfg = ROLE_CONFIG[a.role_in_activity] || ROLE_CONFIG.executor;
                            return `${act?.title || 'Atividade'} (${cfg.label})`;
                          }).join(', ')}
                        </p>
                      </div>
                      {totalHours > 0 && (
                        <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />{totalHours}h
                        </span>
                      )}
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 animate-pulse" />
                    </div>
                  );
                })}
                {free.map(emp => (
                  <div key={emp.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-[10px] font-bold shrink-0">
                      {emp.name?.[0] || '?'}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{emp.name}</p>
                    <Badge variant="outline" className="text-[9px] ml-auto">Livre</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
