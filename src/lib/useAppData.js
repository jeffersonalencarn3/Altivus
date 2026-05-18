import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWorkspace } from '@/lib/useWorkspace';
import { createWorkspaceClient } from '@/lib/workspaceClient';
import { operationalLogService } from '@/services/operationalLogService';
import { buildGoLiveSelect } from '@/lib/goLive';

/**
 * useDB — memoizado por workspaceId para evitar recriar o cliente a cada render.
 * Só retorna cliente válido quando workspaceId existe.
 */
function useDB() {
  const { workspaceId } = useWorkspace();
  return useMemo(() => createWorkspaceClient(workspaceId), [workspaceId]);
}

const safeArray = (data) => Array.isArray(data) ? data : [];

/**
 * BASE_OPTS — configuração estável que preserva estado entre navegações.
 * refetchOnMount: false → usa cache sem re-fetch ao trocar de página
 * staleTime: 5min → dados considerados frescos, sem re-request desnecessário
 */
function baseOpts(workspaceId) {
  return {
    staleTime: 3 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
    networkMode: 'online',
    enabled: !!workspaceId,
    select: safeArray,
  };
}

export function useContracts() {
  const db = useDB();
  const { workspaceId } = useWorkspace();
  return useQuery({ queryKey: ['contracts', workspaceId], queryFn: () => db.Contract.list(), ...baseOpts(workspaceId) });
}

export function useUnits() {
  const db = useDB();
  const { workspaceId } = useWorkspace();
  return useQuery({ queryKey: ['units', workspaceId], queryFn: () => db.Unit.list(), ...baseOpts(workspaceId) });
}

export function useAreas() {
  const db = useDB();
  const { workspaceId } = useWorkspace();
  return useQuery({ queryKey: ['areas', workspaceId], queryFn: () => db.Area.list(), ...baseOpts(workspaceId) });
}

export function useTeams() {
  const db = useDB();
  const { workspaceId } = useWorkspace();
  return useQuery({ queryKey: ['teams', workspaceId], queryFn: () => db.Team.list(), ...baseOpts(workspaceId) });
}

export function useEmployees() {
  const db = useDB();
  const { workspaceId } = useWorkspace();
  return useQuery({ queryKey: ['employees', workspaceId], queryFn: () => db.Employee.list(), ...baseOpts(workspaceId) });
}

export function useActivities() {
  const db = useDB();
  const { workspaceId, currentWorkspace } = useWorkspace();
  const goLiveDate = currentWorkspace?.go_live_date;
  return useQuery({
    queryKey: ['activities', workspaceId, goLiveDate || 'all'],
    queryFn: () => db.Activity.list(),
    ...baseOpts(workspaceId),
    select: buildGoLiveSelect(goLiveDate, 'Activity'),
  });
}

export function useServiceTypes() {
  const db = useDB();
  const { workspaceId } = useWorkspace();
  return useQuery({ queryKey: ['serviceTypes', workspaceId], queryFn: () => db.ServiceType.list(), ...baseOpts(workspaceId) });
}

export function useMaterials() {
  const db = useDB();
  const { workspaceId } = useWorkspace();
  return useQuery({ queryKey: ['materials', workspaceId], queryFn: () => db.Material.list(), ...baseOpts(workspaceId) });
}

export function useActivityMaterials(activityId) {
  const db = useDB();
  const { workspaceId } = useWorkspace();
  return useQuery({
    queryKey: ['activityMaterials', workspaceId, activityId],
    queryFn: () => db.ActivityMaterial.filter({ activity_id: activityId }),
    ...baseOpts(workspaceId),
    enabled: !!workspaceId && !!activityId,
  });
}

export function useAllActivityMaterials() {
  const db = useDB();
  const { workspaceId } = useWorkspace();
  return useQuery({ queryKey: ['allActivityMaterials', workspaceId], queryFn: () => db.ActivityMaterial.list(), ...baseOpts(workspaceId) });
}

export function useAllActivityEmployees() {
  const db = useDB();
  const { workspaceId } = useWorkspace();
  return useQuery({ queryKey: ['allActivityEmployees', workspaceId], queryFn: () => db.ActivityEmployee.list(), ...baseOpts(workspaceId) });
}

export function useActivityEmployees(activityId) {
  const db = useDB();
  const { workspaceId } = useWorkspace();
  const listAll = activityId === null;
  return useQuery({
    queryKey: ['activityEmployees', workspaceId, listAll ? 'all' : activityId],
    queryFn: () => listAll
      ? db.ActivityEmployee.list()
      : db.ActivityEmployee.filter({ activity_id: activityId }),
    ...baseOpts(workspaceId),
    enabled: !!workspaceId && (listAll || !!activityId),
  });
}

export function useActivitySessions(activityId) {
  const db = useDB();
  const { workspaceId, currentWorkspace } = useWorkspace();
  const goLiveDate = currentWorkspace?.go_live_date;
  const listAll = activityId === null;
  return useQuery({
    queryKey: ['activitySessions', workspaceId, goLiveDate || 'all', listAll ? 'all' : activityId],
    queryFn: () => listAll
      ? db.ActivitySession.list('-date', 50)
      : db.ActivitySession.filter({ activity_id: activityId }, '-date', 50),
    ...baseOpts(workspaceId),
    select: buildGoLiveSelect(goLiveDate, 'ActivitySession'),
    enabled: !!workspaceId && (listAll || !!activityId),
  });
}

export function useAttendanceRecords(activityId) {
  const db = useDB();
  const { workspaceId, currentWorkspace } = useWorkspace();
  const goLiveDate = currentWorkspace?.go_live_date;
  const listAll = activityId === null;
  return useQuery({
    queryKey: ['attendanceRecords', workspaceId, goLiveDate || 'all', listAll ? 'all' : activityId],
    queryFn: () => listAll
      ? db.AttendanceRecord.list('-date', 200)
      : db.AttendanceRecord.filter({ activity_id: activityId }),
    ...baseOpts(workspaceId),
    select: buildGoLiveSelect(goLiveDate, 'AttendanceRecord'),
    enabled: !!workspaceId && (listAll || !!activityId),
  });
}

export function useOperationalMaps(activityId) {
  const db = useDB();
  const { workspaceId, currentWorkspace } = useWorkspace();
  const goLiveDate = currentWorkspace?.go_live_date;
  const listAll = activityId === null;
  return useQuery({
    queryKey: ['operationalMaps', workspaceId, goLiveDate || 'all', listAll ? 'all' : activityId],
    queryFn: () => listAll
      ? db.OperationalMap.list('-captured_at', 100)
      : db.OperationalMap.filter({ activity_id: activityId }, '-captured_at', 100),
    ...baseOpts(workspaceId),
    select: buildGoLiveSelect(goLiveDate, 'OperationalMap'),
    enabled: !!workspaceId && (listAll || !!activityId),
  });
}

export function useEquipments(employeeId) {
  const db = useDB();
  const { workspaceId } = useWorkspace();
  return useQuery({
    queryKey: ['equipments', workspaceId, employeeId ?? 'all'],
    queryFn: () => employeeId
      ? db.Equipment.filter({ employee_id: employeeId })
      : db.Equipment.list(),
    ...baseOpts(workspaceId),
  });
}

export function useAllEquipments() {
  const db = useDB();
  const { workspaceId } = useWorkspace();
  return useQuery({
    queryKey: ['equipments', workspaceId, 'all'],
    queryFn: () => db.Equipment.list(),
    ...baseOpts(workspaceId),
  });
}

export function useInspections(employeeId) {
  const db = useDB();
  const { workspaceId } = useWorkspace();
  return useQuery({
    queryKey: ['inspections', workspaceId, employeeId ?? 'all'],
    queryFn: () => employeeId
      ? db.Inspection.filter({ employee_id: employeeId })
      : db.Inspection.list('-date', 100),
    ...baseOpts(workspaceId),
  });
}

export function useOperationalReports(activityId) {
  const db = useDB();
  const { workspaceId, currentWorkspace } = useWorkspace();
  const goLiveDate = currentWorkspace?.go_live_date;
  return useQuery({
    queryKey: ['operationalReports', workspaceId, goLiveDate || 'all', activityId ?? 'all'],
    queryFn: () => activityId
      ? db.ActivityOperationalReport.filter({ activity_id: activityId }, '-generated_at', 20)
      : db.ActivityOperationalReport.list('-generated_at', 100),
    ...baseOpts(workspaceId),
    select: buildGoLiveSelect(goLiveDate, 'ActivityOperationalReport'),
    enabled: !!workspaceId,
  });
}

function normalizeOperationalLogFilters(filters = {}) {
  return {
    activityId: filters.activityId || filters.activity_id || '',
    teamId: filters.teamId || filters.team_id || '',
    contractId: filters.contractId || filters.contract_id || '',
    materialId: filters.materialId || filters.material_id || '',
    fieldLogId: filters.fieldLogId || filters.field_log_id || '',
    appointmentId: filters.appointmentId || filters.appointment_id || '',
    userEmail: filters.userEmail || filters.user_email || '',
    date: filters.date || filters.eventDate || filters.event_date || '',
    dateFrom: filters.dateFrom || filters.date_from || '',
    dateTo: filters.dateTo || filters.date_to || '',
    category: filters.category || '',
    severity: filters.severity || '',
    eventType: filters.eventType || filters.event_type || '',
    entityType: filters.entityType || filters.entity_type || '',
    entityId: filters.entityId || filters.entity_id || '',
    limit: filters.limit || 200,
  };
}

export function useOperationalLogs(filters = {}) {
  const db = useDB();
  const { workspaceId, currentWorkspace } = useWorkspace();
  const goLiveDate = currentWorkspace?.go_live_date;
  const normalizedFilters = normalizeOperationalLogFilters(filters);

  return useQuery({
    queryKey: ['operationalLogs', workspaceId, goLiveDate || 'all', normalizedFilters],
    queryFn: () => operationalLogService.list(db, normalizedFilters),
    ...baseOpts(workspaceId),
    select: buildGoLiveSelect(goLiveDate, 'OperationalLog'),
    enabled: !!workspaceId,
  });
}

export function useOperationalTimeline(filters = {}) {
  const query = useOperationalLogs(filters);
  return {
    ...query,
    data: useMemo(() => operationalLogService.timeline(query.data || []), [query.data]),
  };
}

export function useChecklists(employeeId) {
  const db = useDB();
  const { workspaceId } = useWorkspace();
  return useQuery({
    queryKey: ['checklists', workspaceId, employeeId ?? 'all'],
    queryFn: () => employeeId
      ? db.EmployeeChecklist.filter({ employee_id: employeeId })
      : db.EmployeeChecklist.list('-date', 100),
    ...baseOpts(workspaceId),
  });
}
