import { mergeEntityRecord, removeEntityRecord } from '@/services/realtimeService';
import { invalidateGroup, invalidateWorkspaceQueries } from '@/services/serviceUtils';

/**
 * Efeito incremental de cache (preserva realtime merge antes da invalidação).
 */
export function buildMergeEffect(entityName, record, keys = []) {
  if (!record?.id) return null;
  return { type: 'merge', entityName, record, keys };
}

export function buildRemoveEffect(entityName, record, keys = []) {
  if (!record?.id) return null;
  return { type: 'remove', entityName, record, keys };
}

export function applyCacheEffects(queryClient, workspaceId, effects = []) {
  if (!queryClient || !workspaceId) return;

  effects.filter(Boolean).forEach((effect) => {
    if (effect.type === 'merge') {
      mergeEntityRecord(queryClient, workspaceId, effect.entityName, effect.record, effect.keys);
      return;
    }
    if (effect.type === 'remove') {
      removeEntityRecord(queryClient, workspaceId, effect.entityName, effect.record, effect.keys);
    }
  });
}

export function resolveCacheEffects(cacheEffects, data, variables) {
  if (typeof cacheEffects === 'function') {
    return cacheEffects(data, variables) || [];
  }
  return cacheEffects || [];
}

/**
 * Padroniza invalidação por grupos + chaves extras após mutação de serviço.
 */
export function applyInvalidation(queryClient, workspaceId, {
  groups = [],
  keys = [],
} = {}) {
  groups.forEach((group) => invalidateGroup(queryClient, workspaceId, group));
  if (keys.length) invalidateWorkspaceQueries(queryClient, workspaceId, keys);
}

/**
 * Executa efeitos pós-mutação: merge incremental + invalidação de grupos.
 */
export function applyServiceMutationEffects(queryClient, workspaceId, {
  groups = [],
  keys = [],
  cacheEffects = [],
  data,
  variables,
} = {}) {
  applyCacheEffects(queryClient, workspaceId, resolveCacheEffects(cacheEffects, data, variables));
  applyInvalidation(queryClient, workspaceId, { groups, keys });
}

/**
 * Metadados para analytics / IA operacional (append-only friendly).
 */
export function buildOperationalAnalyticsMeta({
  domain,
  operation,
  workspaceId,
  entityType,
  entityId,
  extra = {},
}) {
  return {
    domain,
    operation,
    workspace_id: workspaceId || '',
    entity_type: entityType || '',
    entity_id: entityId || '',
    captured_at: new Date().toISOString(),
    ...extra,
  };
}
