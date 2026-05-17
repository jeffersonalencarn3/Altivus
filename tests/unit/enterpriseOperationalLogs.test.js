import { describe, expect, it, vi } from 'vitest'
import { operationalLogService, OPERATIONAL_LOG_EVENTS } from '@/services/operationalLogService'
import { fieldLogService } from '@/services/fieldLogService'
import { materialService } from '@/services/materialService'
import { appointmentService } from '@/services/appointmentService'
import { createBase44Mock } from '@/test/mocks/base44'

describe('enterprise operational logs', () => {
  it('registra troca de workspace com before/after', async () => {
    const create = vi.fn(async payload => payload)
    const db = { OperationalLog: { create } }

    await operationalLogService.recordWorkspaceSwitch(db, {
      workspaceId: 'ws-beta',
      previousWorkspaceId: 'ws-alpha',
      user: { id: 'user-1', email: 'ana@altivus.com' },
    })

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      workspace_id: 'ws-beta',
      event_type: OPERATIONAL_LOG_EVENTS.WORKSPACE_SWITCH,
      action: 'switch_workspace',
      before: { workspace_id: 'ws-alpha' },
      after: { workspace_id: 'ws-beta' },
      user_id: 'user-1',
    }))
  })

  it('ignora troca de workspace quando ids sao iguais', async () => {
    const create = vi.fn()
    const db = { OperationalLog: { create } }

    await operationalLogService.recordWorkspaceSwitch(db, {
      workspaceId: 'ws-alpha',
      previousWorkspaceId: 'ws-alpha',
      user: { id: 'user-1' },
    })

    expect(create).not.toHaveBeenCalled()
  })

  it('registra baixa de estoque com evento canonico', async () => {
    const db = createBase44Mock({
      Material: [{ id: 'mat-1', name: 'Corda', quantity_available: 8, workspace_id: 'ws-alpha' }],
    }).entities

    await materialService.consumeMaterials(db, {
      materials: [{ id: 'mat-1', name: 'Corda', quantity_available: 8, workspace_id: 'ws-alpha' }],
      consumption: [{ material_id: 'mat-1', quantity_used: 2 }],
      source: { workspaceId: 'ws-alpha', activityId: 'act-1', user: { id: 'user-1', email: 'ana@altivus.com' } },
    })

    const logs = Array.from(db.OperationalLog.rows.values())
    expect(logs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        workspace_id: 'ws-alpha',
        event_type: OPERATIONAL_LOG_EVENTS.MATERIAL_STOCK_EXIT,
        action: 'consume_material',
        material_id: 'mat-1',
        activity_id: 'act-1',
        user_id: 'user-1',
      }),
    ]))
  })

  it('registra fechamento e aprovacao do diario de campo', async () => {
    const db = createBase44Mock({
      FieldLog: [{ id: 'log-1', workspace_id: 'ws-alpha', stock_committed: false, audit_trail: [] }],
      Material: [{ id: 'mat-1', quantity_available: 5, name: 'Corda', workspace_id: 'ws-alpha' }],
      Contract: [{ id: 'contract-1', total_descidas_executadas: 0, total_descidas_previstas: 10 }],
      MaterialMovement: [],
    }).entities

    await fieldLogService.saveFieldLog(db, {
      data: {
        id: 'log-1',
        workspace_id: 'ws-alpha',
        date: '2026-05-17',
        status: 'closed',
        contract_id: 'contract-1',
        descidas_realizadas: 1,
        material_consumption: [{ material_id: 'mat-1', quantity_used: 1 }],
      },
      isClose: true,
      user: { id: 'user-1', email: 'ana@altivus.com' },
      materials: [{ id: 'mat-1', quantity_available: 5, name: 'Corda' }],
      contracts: [{ id: 'contract-1', total_descidas_executadas: 0, total_descidas_previstas: 10 }],
    })

    await fieldLogService.approveFieldLog(db, {
      log: { id: 'log-1', workspace_id: 'ws-alpha', audit_trail: [] },
      decision: 'approved',
      user: { id: 'supervisor-1', email: 'supervisor@altivus.com' },
      movements: [],
    })

    const logs = Array.from(db.OperationalLog.rows.values())
    expect(logs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        workspace_id: 'ws-alpha',
        event_type: 'field_log.close',
        category: 'field_log',
      }),
      expect.objectContaining({
        workspace_id: 'ws-alpha',
        event_type: 'field_log.approval',
        category: 'approval',
        action: 'approved',
        user_id: 'supervisor-1',
      }),
    ]))
  })

  it('registra aprovacao de apontamento', async () => {
    const db = createBase44Mock({
      Appointment: [{ id: 'apt-1', workspace_id: 'ws-alpha', audit_trail: [] }],
    }).entities

    await appointmentService.approveAppointment(db, {
      appointment: { id: 'apt-1', workspace_id: 'ws-alpha', audit_trail: [] },
      decision: 'approved',
      user: { id: 'supervisor-1', email: 'supervisor@altivus.com' },
      notes: 'ok',
    })

    const logs = Array.from(db.OperationalLog.rows.values())
    expect(logs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        workspace_id: 'ws-alpha',
        event_type: OPERATIONAL_LOG_EVENTS.APPOINTMENT_APPROVAL,
        category: 'approval',
        action: 'approved',
        entity_type: 'Appointment',
        entity_id: 'apt-1',
      }),
    ]))
  })
})
