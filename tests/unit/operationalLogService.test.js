import { describe, expect, it, vi } from 'vitest'
import { operationalLogService, OPERATIONAL_LOG_EVENTS } from '@/services/operationalLogService'

describe('operationalLogService', () => {
  it('normaliza payload enterprise com created_at e identidade completa', () => {
    const payload = operationalLogService.normalizeLog({
      workspace_id: 'ws-alpha',
      event_type: OPERATIONAL_LOG_EVENTS.ACTIVITY_START,
      action: 'start_activity',
      description: 'Atividade iniciada',
      entity_type: 'Activity',
      entity_id: 'act-1',
      activity_id: 'act-1',
      user: { id: 'user-1', email: 'ana@altivus.com', full_name: 'Ana', role: 'supervisor' },
      metadata: { session_id: 'sess-1' },
      occurred_at: '2026-05-17T10:00:00.000Z',
    })

    expect(payload).toEqual(expect.objectContaining({
      workspace_id: 'ws-alpha',
      user_id: 'user-1',
      activity_id: 'act-1',
      entity_type: 'Activity',
      entity_id: 'act-1',
      action: 'start_activity',
      description: 'Atividade iniciada',
      created_at: '2026-05-17T10:00:00.000Z',
      metadata: { session_id: 'sess-1' },
    }))
  })

  it('nao quebra a operacao principal quando a escrita do log falha', async () => {
    const db = { OperationalLog: { create: vi.fn(async () => { throw new Error('offline') }) } }

    await expect(operationalLogService.record(db, {
      workspace_id: 'ws-alpha',
      event_type: OPERATIONAL_LOG_EVENTS.ACTIVITY_START,
    })).resolves.toBeNull()
  })

  it('registra bloqueio e expiracao com metadados do workspace', async () => {
    const create = vi.fn(async payload => payload)
    const db = { OperationalLog: { create } }

    await operationalLogService.recordWorkspaceAccessRestriction(db, {
      workspace: { id: 'ws-blocked', account_status: 'blocked' },
      user: { id: 'user-1', email: 'ana@altivus.com' },
      status: 'blocked',
    })
    await operationalLogService.recordWorkspaceAccessRestriction(db, {
      workspace: { id: 'ws-expired', account_status: 'expired', trial_end: '2026-05-16T00:00:00.000Z' },
      user: { id: 'user-1', email: 'ana@altivus.com' },
      status: 'expired',
    })

    expect(create).toHaveBeenNthCalledWith(1, expect.objectContaining({
      workspace_id: 'ws-blocked',
      event_type: OPERATIONAL_LOG_EVENTS.WORKSPACE_BLOCKED,
      action: 'block_workspace_access',
      entity_type: 'Workspace',
      entity_id: 'ws-blocked',
      user_id: 'user-1',
      metadata: expect.objectContaining({ access_limited: true }),
    }))
    expect(create).toHaveBeenNthCalledWith(2, expect.objectContaining({
      workspace_id: 'ws-expired',
      event_type: OPERATIONAL_LOG_EVENTS.WORKSPACE_EXPIRED,
      action: 'expire_workspace_access',
      entity_type: 'Workspace',
      entity_id: 'ws-expired',
      user_id: 'user-1',
      metadata: expect.objectContaining({ access_limited: true }),
    }))
  })
})
