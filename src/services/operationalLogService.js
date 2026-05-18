import { runService } from '@/services/serviceUtils';
import { buildOperationalAnalyticsMeta } from '@/services/serviceLayer';
import { OPERATIONAL_LOG_CATEGORIES, OPERATIONAL_LOG_EVENTS } from '@/services/operationalLogEvents';

export const OPERATIONAL_LOG_SERVICE_DOMAIN = 'operational_log';

const DEFAULT_LIMIT = 200;

export { OPERATIONAL_LOG_EVENTS, OPERATIONAL_LOG_CATEGORIES };

function normalizeUser(user = {}) {
  return {
    user_id: user.id || user.user_id || '',
    user_email: user.email || user.user_email || user.created_by || '',
    user_name: user.full_name || user.name || user.user_name || user.email || '',
    user_role: user.role || user.user_role || '',
  };
}

function pickWorkspaceId(event = {}) {
  return event.workspace_id || event.workspaceId || event.workspace?.id || event.currentWorkspaceId || '';
}

function normalizeTags(tags = []) {
  if (!Array.isArray(tags)) return [];
  return tags.filter(Boolean).map(String);
}

function normalizeLog(event = {}) {
  const occurredAt = event.occurred_at || event.occurredAt || new Date().toISOString();
  const createdAt = event.created_at || event.createdAt || occurredAt;
  const userFields = normalizeUser(event.user || event.actor || event.currentUser || {});

  return {
    workspace_id: pickWorkspaceId(event),
    event_type: event.event_type || event.eventType || event.type || OPERATIONAL_LOG_EVENTS.SYSTEM_EVENT,
    category: event.category || 'system',
    severity: event.severity || 'info',
    action: event.action || event.event_type || event.eventType || event.type || 'event',
    description: event.description || event.message || '',
    status: event.status || 'success',
    entity_type: event.entity_type || event.entityType || '',
    entity_id: event.entity_id || event.entityId || '',
    activity_id: event.activity_id || event.activityId || '',
    team_id: event.team_id || event.teamId || '',
    contract_id: event.contract_id || event.contractId || '',
    material_id: event.material_id || event.materialId || '',
    field_log_id: event.field_log_id || event.fieldLogId || '',
    appointment_id: event.appointment_id || event.appointmentId || '',
    ...userFields,
    occurred_at: occurredAt,
    created_at: createdAt,
    event_date: event.event_date || event.eventDate || occurredAt.slice(0, 10),
    source: event.source || 'web',
    correlation_id: event.correlation_id || event.correlationId || '',
    sla_scope: event.sla_scope || event.slaScope || '',
    analytics_tags: normalizeTags(event.analytics_tags || event.analyticsTags || []),
    metadata: event.metadata || {},
    before: event.before || {},
    after: event.after || {},
  };
}

function matchesDateRange(log, filters = {}) {
  const date = log.event_date || log.occurred_at?.slice(0, 10);
  if (!date) return true;
  if (filters.dateFrom && date < filters.dateFrom) return false;
  if (filters.dateTo && date > filters.dateTo) return false;
  return true;
}

function matchesArrayFilter(value, filter) {
  if (!filter) return true;
  if (Array.isArray(filter)) return filter.includes(value);
  return value === filter;
}

function filterClientSide(logs = [], filters = {}) {
  return logs.filter(log =>
    matchesDateRange(log, filters) &&
    matchesArrayFilter(log.category, filters.category) &&
    matchesArrayFilter(log.severity, filters.severity) &&
    matchesArrayFilter(log.event_type, filters.eventType || filters.event_type) &&
    matchesArrayFilter(log.entity_type, filters.entityType || filters.entity_type) &&
    (!filters.entityId || log.entity_id === filters.entityId)
  );
}

function buildServerFilter(filters = {}) {
  const query = {};
  if (filters.activityId || filters.activity_id) query.activity_id = filters.activityId || filters.activity_id;
  if (filters.teamId || filters.team_id) query.team_id = filters.teamId || filters.team_id;
  if (filters.contractId || filters.contract_id) query.contract_id = filters.contractId || filters.contract_id;
  if (filters.materialId || filters.material_id) query.material_id = filters.materialId || filters.material_id;
  if (filters.fieldLogId || filters.field_log_id) query.field_log_id = filters.fieldLogId || filters.field_log_id;
  if (filters.appointmentId || filters.appointment_id) query.appointment_id = filters.appointmentId || filters.appointment_id;
  if (filters.date || filters.eventDate || filters.event_date) query.event_date = filters.date || filters.eventDate || filters.event_date;
  if (filters.userEmail || filters.user_email) query.user_email = filters.userEmail || filters.user_email;
  return query;
}

function toTimelineEntry(log) {
  return {
    id: log.id,
    timestamp: log.occurred_at,
    date: log.event_date,
    category: log.category,
    severity: log.severity,
    title: log.description || log.action || log.event_type,
    action: log.action,
    eventType: log.event_type,
    workspaceId: log.workspace_id,
    entityType: log.entity_type,
    entityId: log.entity_id,
    activityId: log.activity_id,
    teamId: log.team_id,
    userEmail: log.user_email,
    userName: log.user_name,
    metadata: log.metadata || {},
  };
}

function groupBy(logs, getKey) {
  return logs.reduce((acc, item) => {
    const key = getKey(item) || 'unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

async function writeLog(db, event, { required = false } = {}) {
  const payload = normalizeLog(event);
  payload.metadata = {
    ...(payload.metadata || {}),
    analytics: buildOperationalAnalyticsMeta({
      domain: event.category || OPERATIONAL_LOG_SERVICE_DOMAIN,
      operation: payload.event_type,
      workspaceId: payload.workspace_id,
      entityType: payload.entity_type,
      entityId: payload.entity_id,
    }),
  };
  try {
    return await db.OperationalLog.create(payload);
  } catch (error) {
    if (required) throw error;
    console.warn('Operational log skipped:', error?.message || error);
    return null;
  }
}

export const operationalLogService = {
  normalizeLog,

  record(db, event, options) {
    return writeLog(db, event, options);
  },

  recordBatch(db, events = [], options) {
    return Promise.all(events.map(event => writeLog(db, event, options)));
  },

  recordWorkspaceSwitch(db, { workspaceId, previousWorkspaceId, user }) {
    if (!workspaceId || !previousWorkspaceId || workspaceId === previousWorkspaceId) {
      return Promise.resolve(null);
    }
    return writeLog(db, {
      workspace_id: workspaceId,
      event_type: OPERATIONAL_LOG_EVENTS.WORKSPACE_SWITCH,
      category: OPERATIONAL_LOG_CATEGORIES.WORKSPACE,
      action: 'switch_workspace',
      severity: 'info',
      description: 'Workspace ativo alterado',
      entity_type: 'Workspace',
      entity_id: workspaceId,
      user,
      before: { workspace_id: previousWorkspaceId },
      after: { workspace_id: workspaceId },
      source: 'web',
      analytics_tags: ['workspace', 'multi_tenant'],
    });
  },

  recordActivityExecution(db, {
    workspaceId,
    activity,
    session,
    user,
    phase,
    metadata = {},
    before,
    after,
  }) {
    const activityId = activity?.id || '';
    const teamId = activity?.team_id || '';
    const contractId = activity?.contract_id || '';
    const wsId = workspaceId || activity?.workspace_id || '';
    const sessionId = session?.id || '';

    const phases = {
      start: {
        event_type: OPERATIONAL_LOG_EVENTS.ACTIVITY_START,
        action: 'start_activity',
        description: `Atividade iniciada: ${activity?.title || activityId}`,
        entity_type: 'Activity',
        entity_id: activityId,
        analytics_tags: ['activity', 'execution', 'sla'],
      },
      finish: {
        event_type: OPERATIONAL_LOG_EVENTS.ACTIVITY_FINISH,
        action: 'finish_activity',
        description: `Atividade finalizada: ${activity?.title || activityId}`,
        entity_type: 'Activity',
        entity_id: activityId,
        analytics_tags: ['activity', 'execution', 'sla'],
      },
      checkin: {
        event_type: OPERATIONAL_LOG_EVENTS.ACTIVITY_CHECKIN,
        action: 'checkin_activity',
        description: `Check-in realizado: ${activity?.title || activityId}`,
        entity_type: 'ActivitySession',
        entity_id: sessionId,
        analytics_tags: ['activity', 'execution', 'sla'],
      },
      checkout: {
        event_type: OPERATIONAL_LOG_EVENTS.ACTIVITY_CHECKOUT,
        action: 'checkout_activity',
        description: `Check-out realizado: ${activity?.title || activityId}`,
        entity_type: 'ActivitySession',
        entity_id: sessionId,
        analytics_tags: ['activity', 'execution', 'sla'],
      },
    };

    const config = phases[phase];
    if (!config) return Promise.resolve(null);

    return writeLog(db, {
      workspace_id: wsId,
      source: 'service',
      category: OPERATIONAL_LOG_CATEGORIES.ACTIVITY,
      activity_id: activityId,
      team_id: teamId,
      contract_id: contractId,
      user,
      metadata,
      before: before || {},
      after: after || (phase === 'checkin' ? session : {}),
      ...config,
    });
  },

  recordInventoryExit(db, event) {
    return writeLog(db, {
      source: 'service',
      category: OPERATIONAL_LOG_CATEGORIES.INVENTORY,
      event_type: OPERATIONAL_LOG_EVENTS.MATERIAL_STOCK_EXIT,
      action: 'consume_material',
      severity: 'info',
      analytics_tags: ['inventory', 'stock', 'audit'],
      ...event,
    });
  },

  recordApproval(db, event) {
    const decision = event.decision || event.action || 'pending';
    return writeLog(db, {
      source: 'service',
      category: OPERATIONAL_LOG_CATEGORIES.APPROVAL,
      action: decision,
      severity: decision === 'approved' ? 'info' : 'warning',
      analytics_tags: ['approval', 'audit'],
      ...event,
    });
  },

  recordWorkspaceAccessRestriction(db, { workspace, user, status }) {
    const workspaceId = workspace?.id || workspace?.workspace_id || '';
    const normalizedStatus = status === 'blocked' ? 'blocked' : 'expired';
    const eventType = normalizedStatus === 'blocked'
      ? OPERATIONAL_LOG_EVENTS.WORKSPACE_BLOCKED
      : OPERATIONAL_LOG_EVENTS.WORKSPACE_EXPIRED;
    return writeLog(db, {
      workspace_id: workspaceId,
      event_type: eventType,
      category: OPERATIONAL_LOG_CATEGORIES.SECURITY,
      severity: normalizedStatus === 'blocked' ? 'critical' : 'warning',
      action: normalizedStatus === 'blocked' ? 'block_workspace_access' : 'expire_workspace_access',
      description: normalizedStatus === 'blocked'
        ? 'Acesso operacional bloqueado para o workspace'
        : 'Acesso operacional expirado para o workspace',
      entity_type: 'Workspace',
      entity_id: workspaceId,
      user,
      metadata: {
        account_status: workspace?.account_status || normalizedStatus,
        trial_end: workspace?.trial_end || '',
        access_limited: true,
      },
      analytics_tags: ['workspace', 'security', 'access'],
      source: 'web',
    });
  },

  list(db, filters = {}) {
    return runService(async () => {
      const limit = Number(filters.limit || DEFAULT_LIMIT);
      const query = buildServerFilter(filters);
      const logs = Object.keys(query).length
        ? await db.OperationalLog.filter(query, '-occurred_at', limit)
        : await db.OperationalLog.list('-occurred_at', limit);
      return filterClientSide(logs, filters);
    }, 'Erro ao carregar logs operacionais');
  },

  timeline(logs = []) {
    return logs
      .map(toTimelineEntry)
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
  },

  groupTimelineByActivity(logs = []) {
    return groupBy(operationalLogService.timeline(logs), item => item.activityId);
  },

  groupTimelineByTeam(logs = []) {
    return groupBy(operationalLogService.timeline(logs), item => item.teamId);
  },

  groupTimelineByWorkspace(logs = []) {
    return groupBy(operationalLogService.timeline(logs), item => item.workspaceId);
  },
};
