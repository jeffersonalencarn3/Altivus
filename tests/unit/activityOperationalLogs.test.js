import { describe, expect, it } from 'vitest'
import { activityService } from '@/services/activityService'
import { createBase44Mock } from '@/test/mocks/base44'

describe('activityService operational logs', () => {
  it('registra inicio de atividade e check-in com identidade enterprise', async () => {
    const db = createBase44Mock({
      Activity: [{ id: 'act-1', workspace_id: 'ws-alpha', status: 'not_started', title: 'Atividade Alpha', team_id: 'team-1', contract_id: 'contract-1' }],
    }).entities

    await activityService.checkin(db, {
      activity: { id: 'act-1', workspace_id: 'ws-alpha', status: 'not_started', title: 'Atividade Alpha', team_id: 'team-1', contract_id: 'contract-1' },
      today: '2026-05-17',
      checklist: { epis: true },
      descidas_planejadas_hoje: 2,
      user: { id: 'user-1', email: 'ana@altivus.com' },
    })

    const logs = Array.from(db.OperationalLog.rows.values())
    expect(logs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        event_type: 'activity.start',
        action: 'start_activity',
        workspace_id: 'ws-alpha',
        user_id: 'user-1',
        activity_id: 'act-1',
        entity_type: 'Activity',
        entity_id: 'act-1',
      }),
      expect.objectContaining({
        event_type: 'activity.checkin',
        action: 'checkin_activity',
        workspace_id: 'ws-alpha',
        user_id: 'user-1',
        activity_id: 'act-1',
        entity_type: 'ActivitySession',
      }),
    ]))
  })

  it('registra finalizacao de atividade e check-out', async () => {
    const db = createBase44Mock({
      Activity: [{ id: 'act-1', workspace_id: 'ws-alpha', descents_completed: 1, descents_planned: 4, title: 'Atividade Alpha', team_id: 'team-1', contract_id: 'contract-1' }],
      ActivitySession: [{ id: 'sess-1', workspace_id: 'ws-alpha', hora_inicio: '2026-05-17T08:00:00.000Z', status: 'em_execucao' }],
    }).entities

    await activityService.checkout(db, {
      activity: { id: 'act-1', workspace_id: 'ws-alpha', descents_completed: 1, descents_planned: 4, title: 'Atividade Alpha', team_id: 'team-1', contract_id: 'contract-1' },
      activeSession: { id: 'sess-1', hora_inicio: '2026-05-17T08:00:00.000Z', status: 'em_execucao' },
      checkoutData: { descidas_realizadas: 1 },
      user: { id: 'user-1', email: 'ana@altivus.com' },
    })

    const logs = Array.from(db.OperationalLog.rows.values())
    expect(logs).toEqual(expect.arrayContaining([
      expect.objectContaining({ event_type: 'activity.finish', action: 'finish_activity', user_id: 'user-1', entity_type: 'Activity' }),
      expect.objectContaining({ event_type: 'activity.checkout', action: 'checkout_activity', user_id: 'user-1', entity_type: 'ActivitySession' }),
    ]))
  })
})
