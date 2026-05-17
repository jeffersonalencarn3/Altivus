const ACTIVITY_FILTERED_KEYS = new Set([
  'activitySessions',
  'attendanceRecords',
  'activityEmployees',
  'activityMaterials',
  'operationalMaps',
  'operationalReports',
]);

const EMPLOYEE_FILTERED_KEYS = new Set(['equipments', 'inspections', 'checklists']);

function keyPrefix(key, workspaceId) {
  return Array.isArray(key) ? key : [key, workspaceId];
}

function getRecordFromEvent(event) {
  if (!event) return null;
  return event.record || event.data || event.new || event.old || event.payload || event;
}

function getEventAction(event) {
  const raw = event?.eventType || event?.type || event?.action || event?.operation || '';
  return String(raw).toLowerCase();
}

function isDeleteEvent(event) {
  const action = getEventAction(event);
  return action.includes('delete') || action.includes('remove') || action === 'deleted';
}

function matchesFilteredQuery(entityName, record, queryKey) {
  const cacheKey = queryKey?.[0];
  const filterId = queryKey?.[2];

  if (!filterId || filterId === 'all') return true;
  if (cacheKey === 'operationalLogs' && typeof filterId === 'object') {
    return matchesOperationalLogFilters(record, filterId);
  }
  if (ACTIVITY_FILTERED_KEYS.has(cacheKey)) return record.activity_id === filterId;
  if (EMPLOYEE_FILTERED_KEYS.has(cacheKey)) return record.employee_id === filterId;
  if (entityName === 'Employee' && cacheKey === 'employee') return record.id === filterId;

  return true;
}

function matchesOperationalLogFilters(record, filters = {}) {
  const date = record.event_date || record.occurred_at?.slice(0, 10);
  if (filters.activityId && record.activity_id !== filters.activityId) return false;
  if (filters.teamId && record.team_id !== filters.teamId) return false;
  if (filters.contractId && record.contract_id !== filters.contractId) return false;
  if (filters.materialId && record.material_id !== filters.materialId) return false;
  if (filters.fieldLogId && record.field_log_id !== filters.fieldLogId) return false;
  if (filters.appointmentId && record.appointment_id !== filters.appointmentId) return false;
  if (filters.userEmail && record.user_email !== filters.userEmail) return false;
  if (filters.date && date !== filters.date) return false;
  if (filters.dateFrom && date < filters.dateFrom) return false;
  if (filters.dateTo && date > filters.dateTo) return false;
  if (filters.category && record.category !== filters.category) return false;
  if (filters.severity && record.severity !== filters.severity) return false;
  if (filters.eventType && record.event_type !== filters.eventType) return false;
  if (filters.entityType && record.entity_type !== filters.entityType) return false;
  if (filters.entityId && record.entity_id !== filters.entityId) return false;
  return true;
}

function mergeArrayRecord(current, record, { deleted, entityName, queryKey }) {
  if (!record?.id) return current;

  const existingIndex = current.findIndex(item => item?.id === record.id);

  if (deleted) {
    if (existingIndex === -1) return current;
    return current.filter(item => item?.id !== record.id);
  }

  if (existingIndex >= 0) {
    return current.map(item => item?.id === record.id ? { ...item, ...record } : item);
  }

  if (!matchesFilteredQuery(entityName, record, queryKey)) return current;
  return [record, ...current];
}

function mergeObjectRecord(current, record, deleted) {
  if (!record?.id || current?.id !== record.id) return current;
  return deleted ? undefined : { ...current, ...record };
}

function mergeCachedValue(current, record, options) {
  if (!current) return current;
  if (Array.isArray(current)) return mergeArrayRecord(current, record, options);
  if (typeof current === 'object') return mergeObjectRecord(current, record, options.deleted);
  return current;
}

function markQueriesStale(queryClient, workspaceId, keys, refetchType = 'inactive') {
  keys.forEach((key) => {
    queryClient.invalidateQueries({
      queryKey: keyPrefix(key, workspaceId),
      refetchType,
    });
  });
}

export function mergeEntityRecord(queryClient, workspaceId, entityName, record, keys = []) {
  if (!queryClient || !workspaceId || !record?.id) return false;

  let updated = false;

  keys.forEach((key) => {
    const prefix = keyPrefix(key, workspaceId);
    const queries = queryClient.getQueriesData({ queryKey: prefix, exact: false });

    queries.forEach(([queryKey, current]) => {
      const next = mergeCachedValue(current, record, {
        deleted: false,
        entityName,
        queryKey,
      });

      if (next !== current) {
        queryClient.setQueryData(queryKey, next);
        updated = true;
      }
    });
  });

  markQueriesStale(queryClient, workspaceId, keys);
  return updated;
}

export function removeEntityRecord(queryClient, workspaceId, entityName, record, keys = []) {
  if (!queryClient || !workspaceId || !record?.id) return false;

  let updated = false;

  keys.forEach((key) => {
    const prefix = keyPrefix(key, workspaceId);
    const queries = queryClient.getQueriesData({ queryKey: prefix, exact: false });

    queries.forEach(([queryKey, current]) => {
      const next = mergeCachedValue(current, record, {
        deleted: true,
        entityName,
        queryKey,
      });

      if (next !== current) {
        queryClient.setQueryData(queryKey, next);
        updated = true;
      }
    });
  });

  markQueriesStale(queryClient, workspaceId, keys);
  return updated;
}

export function applyRealtimeEntityEvent(queryClient, workspaceId, entityName, event, keys = []) {
  const record = getRecordFromEvent(event);
  if (!record?.id) return false;

  if (isDeleteEvent(event)) {
    removeEntityRecord(queryClient, workspaceId, entityName, record, keys);
    return true;
  }

  mergeEntityRecord(queryClient, workspaceId, entityName, record, keys);
  return true;
}
