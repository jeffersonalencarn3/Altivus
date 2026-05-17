import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useActivities, useTeams, useContracts, useActivitySessions } from '@/lib/useAppData';
import { useWorkspace } from '@/lib/useWorkspace';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PlanningCalculator from '@/components/activities/PlanningCalculator';
import ActivityBlockCard from '@/components/activities/ActivityBlockCard';
import ActivityDetailPanel from '@/components/activities/ActivityDetailPanel';
import ActivityDeleteModal from '@/components/activities/ActivityDeleteModal';
import ActivityRescheduleModal from '@/components/activities/ActivityRescheduleModal';
import RecalcButton from '@/components/activities/RecalcButton';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { Plus, Search, AlertTriangle, CheckCircle2, Clock, BarChart2, Filter, RefreshCw, Archive } from 'lucide-react';
import { usePermissions } from '@/lib/usePermissions';
import { toast } from 'sonner';
import { activityService } from '@/services/activityService';
import { invalidateGroup } from '@/services/serviceUtils';

export default function Activities() {
  const qc = useQueryClient();
  const { workspaceId } = useWorkspace();
  const db = useWorkspaceEntities();
  const { user } = useAuth();
  const { canCreateActivity, canEditActivity, canDeleteActivity } = usePermissions();

  const { data: activities = [], isLoading } = useActivities();
  const { data: teams = [] }                 = useTeams();
  const { data: contracts = [] }             = useContracts();
  const { data: allSessions = [] }           = useActivitySessions(null);

  const [showPlanner, setShowPlanner]       = useState(false);
  const [selectedAct, setSelectedAct]       = useState(null);
  const [search, setSearch]                 = useState('');
  const [filterStatus, setFilterStatus]     = useState('all');
  const [filterTipo, setFilterTipo]         = useState('all');
  const [showFilters, setShowFilters]       = useState(false);
  const [showArchived, setShowArchived]     = useState(false);

  // Modal states
  const [deleteModal, setDeleteModal]       = useState(null); // { activity, mode: 'archive'|'delete' }
  const [rescheduleModal, setRescheduleModal] = useState(null); // activity
  const [editActivity, setEditActivity]     = useState(null); // activity to edit

  // Ao trocar de workspace, descarta qualquer atividade/modal do workspace anterior.
  // Isso evita que ações operacionais usem um activity_id antigo contra o novo cliente isolado.
  useEffect(() => {
    setSelectedAct(null);
    setDeleteModal(null);
    setRescheduleModal(null);
    setEditActivity(null);
  }, [workspaceId]);

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: data => {
      return activityService.createActivity(db, data, { canCreateActivity });
    },
    onSuccess: () => {
      invalidateGroup(qc, workspaceId, 'activities');
      setShowPlanner(false);
      toast.success('Atividade criada com sucesso!');
    },
  });

  const softDeleteMutation = useMutation({
    mutationFn: ({ activity, mode, reason }) => activityService.archiveActivity(db, {
      activity,
      mode,
      reason,
      user,
      canDeleteActivity,
    }),
    onSuccess: (_, { mode }) => {
      invalidateGroup(qc, workspaceId, 'activities');
      setDeleteModal(null);
      toast.success(mode === 'delete' ? 'Atividade excluída (soft delete)' : 'Atividade arquivada');
    },
    onError: (err) => toast.error(err.message || 'Erro ao executar ação'),
  });

  const restoreMutation = useMutation({
    mutationFn: (activity) => activityService.restoreActivity(db, {
      activity,
      user,
      canDeleteActivity,
    }),
    onSuccess: () => {
      invalidateGroup(qc, workspaceId, 'activities');
      toast.success('Atividade restaurada');
    },
    onError: (err) => toast.error(err.message),
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ activity, form }) => activityService.rescheduleActivity(db, {
      activity,
      form,
      user,
      canEditActivity,
    }),
    onSuccess: () => {
      invalidateGroup(qc, workspaceId, 'activities');
      setRescheduleModal(null);
      toast.success('Atividade reprogramada');
    },
    onError: (err) => toast.error(err.message),
  });

  const duplicateMutation = useMutation({
    mutationFn: (activity) => activityService.duplicateActivity(db, {
      activity,
      user,
      canCreateActivity,
    }),
    onSuccess: () => {
      invalidateGroup(qc, workspaceId, 'activities');
      toast.success('Atividade duplicada!');
    },
    onError: (err) => toast.error(err.message),
  });

  // ─── Filtros ─────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => activities.filter(a => {
    // Por padrão, ocultar arquivadas e excluídas
    if (!showArchived && (a.status === 'archived' || a.status === 'deleted')) return false;
    if (showArchived && a.status !== 'archived' && a.status !== 'deleted') return false;
    if (search && !a.title?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (filterTipo !== 'all' && a.tipo_servico !== filterTipo) return false;
    return true;
  }), [activities, search, filterStatus, filterTipo, showArchived]);

  const kpis = useMemo(() => {
    const active = activities.filter(a => a.status !== 'archived' && a.status !== 'deleted');
    return {
      total:      active.length,
      concluidas: active.filter(a => a.status === 'completed').length,
      andamento:  active.filter(a => a.status === 'in_progress').length,
      atrasadas:  active.filter(a => a.status === 'delayed').length,
    };
  }, [activities]);

  const archivedCount = useMemo(() =>
    activities.filter(a => a.status === 'archived' || a.status === 'deleted').length,
  [activities]);

  const refresh = useCallback(() => {
    invalidateGroup(qc, workspaceId, 'activities');
  }, [qc, workspaceId]);

  const hasFilters = filterStatus !== 'all' || filterTipo !== 'all' || search;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="relative pb-2">
          <h1 className="text-xl lg:text-2xl font-black tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 20%, #14B8D4 70%, #6D56E8 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
            Atividades
          </h1>
          <p className="text-xs mt-0.5 font-medium" style={{ color: '#718096' }}>
            Planejamento automático e execução em campo
          </p>
          <div className="absolute bottom-0 left-0 h-0.5 w-14 rounded-full"
            style={{ background: 'linear-gradient(90deg, #14B8D4, transparent)' }} />
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <RecalcButton activities={activities} onDone={refresh} />
          {canCreateActivity && (
            <Button onClick={() => setShowPlanner(true)} className="gap-1.5 text-sm">
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nova</span> Atividade
            </Button>
          )}
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiChip label="Total" value={kpis.total}      color="#14B8D4" icon={<BarChart2 className="w-3.5 h-3.5" />} />
        <KpiChip label="Concluídas" value={kpis.concluidas} color="#00D99A" icon={<CheckCircle2 className="w-3.5 h-3.5" />} />
        <KpiChip label="Andamento"  value={kpis.andamento}  color="#6D56E8" icon={<Clock className="w-3.5 h-3.5" />} />
        <KpiChip label="Atrasadas"  value={kpis.atrasadas}  color="#FC5252" icon={<AlertTriangle className="w-3.5 h-3.5" />} />
      </div>

      {/* ── Filtros ── */}
      <div className="space-y-2">
        {/* Mobile: toggle filter bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              className="pl-9 h-9"
              placeholder="Buscar atividade..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-semibold transition-all duration-200"
            style={{
              background: (showFilters || hasFilters) ? 'rgba(20,184,212,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${(showFilters || hasFilters) ? 'rgba(20,184,212,0.30)' : 'rgba(255,255,255,0.10)'}`,
              color: (showFilters || hasFilters) ? '#14B8D4' : '#718096',
            }}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filtros</span>
            {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-[#14B8D4]" style={{ boxShadow: '0 0 5px #14B8D4' }} />}
          </button>
          <button
            onClick={refresh}
            className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#718096' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#14B8D4'; e.currentTarget.style.borderColor = 'rgba(20,184,212,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#718096'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Expanded filter row */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 p-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="not_started">Não iniciado</SelectItem>
                <SelectItem value="in_progress">Em andamento</SelectItem>
                <SelectItem value="delayed">Atrasado</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="telhado">🏗 Telhado</SelectItem>
                <SelectItem value="fachada">🏢 Fachada</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={() => { setShowArchived(v => !v); setFilterStatus('all'); }}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: showArchived ? 'rgba(113,128,150,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${showArchived ? 'rgba(113,128,150,0.35)' : 'rgba(255,255,255,0.08)'}`,
                color: showArchived ? '#A0AEC0' : '#4A5568',
              }}
            >
              <Archive className="w-3 h-3" />
              Arquivadas {archivedCount > 0 && `(${archivedCount})`}
            </button>
            {hasFilters && (
              <button
                onClick={() => { setSearch(''); setFilterStatus('all'); setFilterTipo('all'); }}
                className="px-3 h-8 rounded-lg text-xs font-medium transition-all"
                style={{ color: '#FC5252', background: 'rgba(252,82,82,0.07)', border: '1px solid rgba(252,82,82,0.18)' }}
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {/* Results count */}
        {!isLoading && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: '#4A5568' }}>
              {filtered.length} atividade{filtered.length !== 1 ? 's' : ''}
              {hasFilters && <span style={{ color: '#14B8D4' }}> (filtrado)</span>}
            </span>
          </div>
        )}
      </div>

      {/* ── Grid de atividades ── */}
      {isLoading ? (
        <LoadingSkeleton type="card" count={8} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BarChart2}
          title={hasFilters ? 'Nenhuma atividade encontrada' : 'Sem atividades ainda'}
          description={hasFilters
            ? 'Tente ajustar os filtros para encontrar atividades.'
            : 'Crie a primeira atividade com planejamento automático.'}
          actionLabel={!hasFilters ? '+ Nova Atividade' : undefined}
          onAction={!hasFilters ? () => setShowPlanner(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
          {filtered.map(act => (
            <ActivityBlockCard
              key={act.id}
              activity={act}
              sessions={allSessions.filter(s => s.activity_id === act.id)}
              teams={teams}
              onOpen={() => setSelectedAct(act)}
              onEdit={canEditActivity ? (a) => setEditActivity(a) : undefined}
              onDuplicate={canCreateActivity ? (a) => duplicateMutation.mutate(a) : undefined}
              onReschedule={canEditActivity ? (a) => setRescheduleModal(a) : undefined}
              onArchive={canDeleteActivity ? (a) => setDeleteModal({ activity: a, mode: 'archive' }) : undefined}
              onDelete={canDeleteActivity ? (a) => setDeleteModal({ activity: a, mode: 'delete' }) : undefined}
              onRestore={canDeleteActivity ? (a) => restoreMutation.mutate(a) : undefined}
            />
          ))}
        </div>
      )}

      {/* Planner modal */}
      {showPlanner && (
        <PlanningCalculator
          open={showPlanner}
          onClose={() => setShowPlanner(false)}
          onSave={data => createMutation.mutate(data)}
          contracts={contracts}
          teams={teams}
        />
      )}

      {/* Painel de detalhe operacional */}
      {selectedAct && (
        <ActivityDetailPanel
          activity={selectedAct}
          teams={teams}
          onClose={() => setSelectedAct(null)}
          onRefresh={refresh}
        />
      )}

      {/* Modal: Excluir / Arquivar */}
      {deleteModal && (
        <ActivityDeleteModal
          activity={deleteModal.activity}
          mode={deleteModal.mode}
          loading={softDeleteMutation.isPending}
          onConfirm={(reason) => softDeleteMutation.mutate({ activity: deleteModal.activity, mode: deleteModal.mode, reason })}
          onCancel={() => setDeleteModal(null)}
        />
      )}

      {/* Modal: Reprogramar */}
      {rescheduleModal && (
        <ActivityRescheduleModal
          activity={rescheduleModal}
          teams={teams}
          loading={rescheduleMutation.isPending}
          onConfirm={(form) => rescheduleMutation.mutate({ activity: rescheduleModal, form })}
          onCancel={() => setRescheduleModal(null)}
        />
      )}

      {/* Modal: Editar (reutiliza PlanningCalculator em modo edição) */}
      {editActivity && (
        <PlanningCalculator
          open={!!editActivity}
          onClose={() => setEditActivity(null)}
          editMode
          initialData={editActivity}
          onSave={async (data) => {
            try {
              await activityService.updateActivity(db, editActivity.id, data, { canEditActivity });
              invalidateGroup(qc, workspaceId, 'activities');
              setEditActivity(null);
              toast.success('Atividade atualizada');
            } catch (err) {
              toast.error(err.message || 'Erro ao atualizar atividade');
            }
          }}
          contracts={contracts}
          teams={teams}
        />
      )}
    </div>
  );
}

const KpiChip = memo(function KpiChip({ label, value, color, icon }) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: `${color}09`,
        border: `1px solid ${color}20`,
        boxShadow: `0 2px 12px ${color}08`,
      }}
    >
      <div className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
        style={{ background: `${color}14`, color, border: `1px solid ${color}25` }}>
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
        <p className="text-lg font-black leading-tight" style={{ color: '#FFFFFF', textShadow: `0 0 10px ${color}30` }}>{value}</p>
      </div>
    </div>
  );
});
