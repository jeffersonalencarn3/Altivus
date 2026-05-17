import { describe, expect, it, vi } from 'vitest'
import {
  applyCacheEffects,
  applyServiceMutationEffects,
  buildMergeEffect,
  buildOperationalAnalyticsMeta,
} from '@/services/serviceLayer'

describe('serviceLayer', () => {
  it('monta metadados de analytics operacional', () => {
    expect(buildOperationalAnalyticsMeta({
      domain: 'activity',
      operation: 'activity.checkin',
      workspaceId: 'ws-alpha',
      entityType: 'Activity',
      entityId: 'act-1',
    })).toEqual(expect.objectContaining({
      domain: 'activity',
      operation: 'activity.checkin',
      workspace_id: 'ws-alpha',
      entity_type: 'Activity',
      entity_id: 'act-1',
    }))
  })

  it('aplica merge incremental antes da invalidacao', () => {
    const queryClient = {
      getQueriesData: vi.fn(() => [[['activities', 'ws-alpha'], [{ id: 'act-1', status: 'not_started' }]]]),
      setQueryData: vi.fn(),
      invalidateQueries: vi.fn(),
    }

    applyServiceMutationEffects(queryClient, 'ws-alpha', {
      groups: ['activities'],
      cacheEffects: [buildMergeEffect('Activity', { id: 'act-1', status: 'in_progress' }, ['activities'])],
    })

    expect(queryClient.setQueryData).toHaveBeenCalled()
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(expect.objectContaining({
      queryKey: ['activities', 'ws-alpha'],
    }))
  })

  it('resolve efeitos dinamicos de cache', () => {
    const queryClient = {
      getQueriesData: vi.fn(() => []),
      setQueryData: vi.fn(),
      invalidateQueries: vi.fn(),
    }

    applyCacheEffects(queryClient, 'ws-alpha', [
      buildMergeEffect('ActivitySession', { id: 'sess-1' }, ['activitySessions']),
    ])

    expect(queryClient.invalidateQueries).toHaveBeenCalled()
  })
})
