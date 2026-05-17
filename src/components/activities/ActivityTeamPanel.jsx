import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useEmployees } from '@/lib/useAppData';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { useWorkspace } from '@/lib/useWorkspace';
import { useActivityServiceMutations } from '@/hooks/services/useActivityServiceMutations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2, Clock, Crown, Wrench, HandHelping } from 'lucide-react';

const ROLE_CONFIG = {
  lider:    { label: 'Líder',    icon: Crown,       cls: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
  executor: { label: 'Executor', icon: Wrench,      cls: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
  apoio:    { label: 'Apoio',    icon: HandHelping, cls: 'bg-green-500/10 text-green-600 border-green-500/30' },
};

export default function ActivityTeamPanel({ activityId, hoursPlanned = 0 }) {
  const db = useWorkspaceEntities();
  const { workspaceId } = useWorkspace();
  const { assignEmployee, removeEmployeeAssignment, updateEmployeeHours } = useActivityServiceMutations();
  const { data: employees = [] } = useEmployees();

  const { data: assignments = [] } = useQuery({
    queryKey: ['activityEmployees', workspaceId, activityId],
    queryFn: () => db.ActivityEmployee.filter({ activity_id: activityId }),
    enabled: !!activityId && !!workspaceId,
    initialData: [],
  });

  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedRole, setSelectedRole] = useState('executor');

  const assignedIds = new Set(assignments.map(a => a.employee_id));
  const availableEmployees = employees.filter(e => !assignedIds.has(e.id) && e.status === 'active');

  const totalHours = assignments.reduce((s, a) => s + (a.hours_worked || 0), 0);

  return (
    <div className="space-y-4">
      {/* Add employee row */}
      <div className="flex flex-col sm:flex-row gap-2 p-3 bg-muted/40 rounded-lg border border-border/50">
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger className="flex-1 h-9 text-xs">
            <SelectValue placeholder="Selecionar colaborador..." />
          </SelectTrigger>
          <SelectContent>
            {availableEmployees.length === 0
              ? <SelectItem value="_none" disabled>Todos já alocados</SelectItem>
              : availableEmployees.map(e => (
                <SelectItem key={e.id} value={e.id}>{e.name} {e.role ? `(${e.role})` : ''}</SelectItem>
              ))
            }
          </SelectContent>
        </Select>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-36 h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lider">Líder</SelectItem>
            <SelectItem value="executor">Executor</SelectItem>
            <SelectItem value="apoio">Apoio</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm" className="h-9 shrink-0"
          disabled={!selectedEmployee}
          onClick={() => assignEmployee.mutate({ activityId, employeeId: selectedEmployee, role: selectedRole }, { onSuccess: () => setSelectedEmployee('') })}
        >
          <UserPlus className="w-4 h-4 mr-1" /> Adicionar
        </Button>
      </div>

      {/* Summary */}
      {assignments.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
          <span><strong className="text-foreground">{assignments.length}</strong> colaborador(es) alocado(s)</span>
          <span><Clock className="w-3 h-3 inline mr-1" /><strong className="text-foreground">{totalHours}h</strong> registradas
            {hoursPlanned > 0 && <> de {hoursPlanned}h previstas
              <span className={`ml-1 font-semibold ${totalHours > hoursPlanned ? 'text-red-500' : 'text-green-500'}`}>
                ({totalHours > hoursPlanned ? '+' : ''}{totalHours - hoursPlanned}h)
              </span>
            </>}
          </span>
        </div>
      )}

      {/* Assignments list */}
      {assignments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-xs">
          Nenhum colaborador alocado nesta atividade
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map(a => {
            const emp = employees.find(e => e.id === a.employee_id);
            const cfg = ROLE_CONFIG[a.role_in_activity] || ROLE_CONFIG.executor;
            const Icon = cfg.icon;
            const productivity = hoursPlanned > 0 && assignments.length > 0
              ? Math.round(((hoursPlanned / assignments.length) / Math.max(1, a.hours_worked || 1)) * 100)
              : null;

            return (
              <div key={a.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-card rounded-lg border border-border/50">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-semibold text-xs">
                    {emp?.name?.[0] || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{emp?.name || 'Desconhecido'}</p>
                    <p className="text-[10px] text-muted-foreground">{emp?.role || ''}</p>
                  </div>
                </div>

                <Badge variant="outline" className={`text-[10px] shrink-0 ${cfg.cls}`}>
                  <Icon className="w-2.5 h-2.5 mr-1" />{cfg.label}
                </Badge>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    type="number" min="0" step="0.5"
                    value={a.hours_worked || 0}
                    onChange={e => updateEmployeeHours.mutate({ id: a.id, hours: Number(e.target.value) })}
                    className="w-20 h-7 text-xs text-center"
                  />
                  <span className="text-xs text-muted-foreground">h</span>
                </div>

                {productivity !== null && (
                  <span className={`text-[10px] font-semibold shrink-0 ${productivity >= 80 ? 'text-green-500' : productivity >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {productivity}% prod.
                  </span>
                )}

                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => removeEmployeeAssignment.mutate(a.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
