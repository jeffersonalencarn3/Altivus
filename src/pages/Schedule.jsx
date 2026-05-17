import React, { useState, useMemo } from 'react';
import { useActivities, useTeams, useAreas, useContracts, useUnits, useServiceTypes } from '@/lib/useAppData';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { useWorkspace } from '@/lib/useWorkspace';
import PageHeader from '@/components/shared/PageHeader';
import GlobalFilters from '@/components/shared/GlobalFilters';
import GanttChart from '@/components/schedule/GanttChart';
import ActivityDialog from '@/components/activities/ActivityDialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { activityService } from '@/services/activityService';
import { invalidateGroup } from '@/services/serviceUtils';

export default function Schedule() {
  const { data: activities = [] } = useActivities();
  const { data: teams = [] } = useTeams();
  const { data: areas = [] } = useAreas();
  const { data: contracts = [] } = useContracts();
  const { data: units = [] } = useUnits();
  const { data: serviceTypes = [] } = useServiceTypes();
  const db = useWorkspaceEntities();
  const { workspaceId } = useWorkspace();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({ period_start: '', period_end: '', team_id: 'all', area_id: 'all' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState('month');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const filtered = useMemo(() => {
    return activities.filter(a => {
      if (filters.team_id !== 'all' && a.team_id !== filters.team_id) return false;
      if (filters.area_id !== 'all' && a.area_id !== filters.area_id) return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (filters.period_start && a.start_date < filters.period_start) return false;
      if (filters.period_end && a.end_date > filters.period_end) return false;
      return true;
    });
  }, [activities, filters, statusFilter]);

  const createMutation = useMutation({
    mutationFn: (data) => activityService.createActivity(db, data),
    onSuccess: () => { invalidateGroup(queryClient, workspaceId, 'activities'); setDialogOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => activityService.updateActivity(db, id, data),
    onSuccess: () => { invalidateGroup(queryClient, workspaceId, 'activities'); setDialogOpen(false); },
  });

  const handleSave = (form) => {
    if (editData) {
      updateMutation.mutate({ id: editData.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (activity) => {
    setEditData(activity);
    setDialogOpen(true);
  };

  const handleDatesChange = (id, start_date, end_date) => {
    updateMutation.mutate({ id, data: { start_date, end_date } });
  };

  const handleNew = () => {
    setEditData(null);
    setDialogOpen(true);
  };

  return (
    <div>
      <PageHeader title="Cronograma" subtitle="Planejamento e acompanhamento de atividades">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="not_started">Não Iniciado</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="delayed">Atrasado</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
          </SelectContent>
        </Select>
        <Tabs value={view} onValueChange={setView}>
          <TabsList className="h-9">
            <TabsTrigger value="week" className="text-xs">Semana</TabsTrigger>
            <TabsTrigger value="month" className="text-xs">Mês</TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button size="sm" onClick={handleNew} className="h-9">
          <Plus className="w-4 h-4 mr-1" /> Nova Atividade
        </Button>
      </PageHeader>

      <GlobalFilters filters={filters} onChange={setFilters} teams={teams} areas={areas} />
      <GanttChart activities={filtered} teams={teams} areas={areas} view={view} onEditActivity={handleEdit} onDatesChange={handleDatesChange} />

      <ActivityDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editData={editData}
        onSave={handleSave}
        teams={teams}
        areas={areas}
        contracts={contracts}
        units={units}
        serviceTypes={serviceTypes}
      />
    </div>
  );
}
