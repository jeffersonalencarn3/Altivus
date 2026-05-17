/**
 * Catálogo canônico de eventos operacionais Altivus (enterprise audit trail).
 * Usar estas constantes evita divergência entre serviços, realtime e analytics.
 */
export const OPERATIONAL_LOG_EVENTS = {
  AUTH_LOGIN: 'auth.login',

  WORKSPACE_SWITCH: 'workspace.switch',
  WORKSPACE_BLOCKED: 'workspace.blocked',
  WORKSPACE_EXPIRED: 'workspace.expired',

  ACTIVITY_CREATE: 'activity.create',
  ACTIVITY_UPDATE: 'activity.update',
  ACTIVITY_START: 'activity.start',
  ACTIVITY_FINISH: 'activity.finish',
  ACTIVITY_CHECKIN: 'activity.checkin',
  ACTIVITY_CHECKOUT: 'activity.checkout',

  ATTENDANCE_TEAM_LOADED: 'attendance.team_loaded',
  ATTENDANCE_RECORD: 'attendance.record',
  ATTENDANCE_COLLABORATOR_ADDED: 'attendance.collaborator_added',
  ATTENDANCE_COLLABORATOR_REMOVED: 'attendance.collaborator_removed',

  MATERIAL_STOCK_EXIT: 'material.stock_exit',
  MATERIAL_CREATE: 'material.create',
  MATERIAL_UPDATE: 'material.update',
  MATERIAL_DELETE: 'material.delete',

  FIELD_LOG_CREATE: 'field_log.create',
  FIELD_LOG_UPDATE: 'field_log.update',
  FIELD_LOG_CLOSE: 'field_log.close',
  FIELD_LOG_DELETE: 'field_log.delete',
  FIELD_LOG_APPROVAL: 'field_log.approval',

  APPOINTMENT_APPROVAL: 'appointment.approval',

  SYSTEM_EVENT: 'system.event',
};

export const OPERATIONAL_LOG_CATEGORIES = {
  AUTH: 'auth',
  WORKSPACE: 'workspace',
  ACTIVITY: 'activity',
  ATTENDANCE: 'attendance',
  INVENTORY: 'inventory',
  FIELD_LOG: 'field_log',
  APPOINTMENT: 'appointment',
  APPROVAL: 'approval',
  SECURITY: 'security',
  SYSTEM: 'system',
};
