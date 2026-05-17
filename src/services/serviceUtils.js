export class ServiceError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'ServiceError';
    this.cause = cause;
  }
}

export function ensureAllowed(condition, message = 'Sem permissão para executar esta ação') {
  if (!condition) {
    throw new ServiceError(message);
  }
}

export function normalizeServiceError(error, fallback = 'Erro ao executar operação') {
  if (error instanceof ServiceError) return error;
  return new ServiceError(error?.message || fallback, error);
}

export async function runService(operation, fallback) {
  try {
    return await operation();
  } catch (error) {
    throw normalizeServiceError(error, fallback);
  }
}

export function invalidateWorkspaceQueries(queryClient, workspaceId, keys = []) {
  keys.forEach((key) => {
    queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key, workspaceId] });
  });
}

export const invalidationGroups = {
  activities: ['activities', 'activitySessions', 'activityEmployees', 'allActivityEmployees', 'attendanceRecords'],
  materials: ['materials', 'activityMaterials', 'allActivityMaterials', 'material_movements'],
  fieldLogs: ['fieldlogs', 'materials', 'material_movements', 'contracts'],
  appointments: ['appointments'],
  contracts: ['contracts'],
  teams: ['teams'],
  employees: ['employees'],
  registers: ['units', 'areas', 'serviceTypes'],
  operationalMaps: ['operationalMaps'],
  operationalReports: ['operationalReports'],
  operationalLogs: ['operationalLogs'],
  employeeProfile: ['employees', 'employee', 'equipments', 'inspections', 'checklists'],
};

export function invalidateGroup(queryClient, workspaceId, groupName, extraKeys = []) {
  invalidateWorkspaceQueries(queryClient, workspaceId, [
    ...(invalidationGroups[groupName] || []),
    ...extraKeys,
  ]);
}
