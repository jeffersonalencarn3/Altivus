import { describe, expect, it } from 'vitest'
import { fieldLogService } from '@/services/fieldLogService'
import { createBase44Mock } from '@/test/mocks/base44'

describe('fieldLogService', () => {
  it('valida fechamento contra saldo do contrato', () => {
    expect(fieldLogService.validateClose({
      contract_id: 'contract-1',
      descidas_realizadas: 3,
      material_consumption: [{ material_id: 'mat-1', quantity_used: 6 }],
    }, {
      contracts: [{ id: 'contract-1', total_descidas_previstas: 10, total_descidas_executadas: 8 }],
      materials: [{ id: 'mat-1', name: 'Corda', quantity_available: 5 }],
    })).toBe('Descidas excedem o saldo do contrato.')
  })

  it('fecha diario, baixa estoque uma vez e marca commit', async () => {
    const db = createBase44Mock({
      FieldLog: [{ id: 'log-1', stock_committed: false, audit_trail: [] }],
      Material: [{ id: 'mat-1', quantity_available: 10, name: 'Corda' }],
      Contract: [{ id: 'contract-1', total_descidas_executadas: 1, total_descidas_previstas: 10 }],
    }).entities

    const data = {
      id: 'log-1',
      date: '2026-05-17',
      status: 'closed',
      activity_id: 'act-1',
      contract_id: 'contract-1',
      descidas_realizadas: 2,
      material_consumption: [{ material_id: 'mat-1', material_name: 'Corda', quantity_used: 3 }],
    }

    await fieldLogService.saveFieldLog(db, {
      data,
      isClose: true,
      user: { email: 'ana@altivus.com' },
      materials: [{ id: 'mat-1', quantity_available: 10, name: 'Corda' }],
      contracts: [{ id: 'contract-1', total_descidas_executadas: 1, total_descidas_previstas: 10 }],
    })

    expect(db.Material.update).toHaveBeenCalledWith('mat-1', { quantity_available: 7 })
    expect(db.MaterialMovement.create).toHaveBeenCalled()
    expect(db.Contract.update).toHaveBeenCalledWith('contract-1', {
      total_descidas_executadas: 3,
      progresso_descidas: 30,
    })
    expect(db.FieldLog.update).toHaveBeenLastCalledWith('log-1', { stock_committed: true })
  })

  it('nao duplica baixa de estoque nem movimento ao fechar o mesmo diario duas vezes', async () => {
    const db = createBase44Mock({
      FieldLog: [{ id: 'log-1', stock_committed: false, audit_trail: [] }],
      Material: [{ id: 'mat-1', quantity_available: 10, name: 'Corda' }],
      Contract: [{ id: 'contract-1', total_descidas_executadas: 1, total_descidas_previstas: 10 }],
    }).entities

    const data = {
      id: 'log-1',
      date: '2026-05-17',
      status: 'closed',
      activity_id: 'act-1',
      contract_id: 'contract-1',
      descidas_realizadas: 2,
      material_consumption: [{ material_id: 'mat-1', material_name: 'Corda', quantity_used: 3 }],
    }
    const args = {
      data,
      isClose: true,
      user: { email: 'ana@altivus.com' },
      materials: [{ id: 'mat-1', quantity_available: 10, name: 'Corda' }],
      contracts: [{ id: 'contract-1', total_descidas_executadas: 1, total_descidas_previstas: 10 }],
    }

    await fieldLogService.saveFieldLog(db, args)
    await fieldLogService.saveFieldLog(db, args)

    expect(db.Material.update).toHaveBeenCalledTimes(1)
    expect(db.MaterialMovement.create).toHaveBeenCalledTimes(1)
    expect(db.Contract.update).toHaveBeenCalledTimes(1)
    expect(db.Material.rows.get('mat-1').quantity_available).toBe(7)
    expect(db.FieldLog.rows.get('log-1').stock_committed).toBe(true)
  })

  it('confirma movimentos ao aprovar diario', async () => {
    const db = createBase44Mock({
      FieldLog: [{ id: 'log-1' }],
      MaterialMovement: [{ id: 'mov-1', field_log_id: 'log-1', confirmed: false }],
    }).entities

    await fieldLogService.approveFieldLog(db, {
      log: { id: 'log-1', audit_trail: [] },
      decision: 'approved',
      user: { email: 'supervisor@altivus.com' },
      movements: [{ id: 'mov-1', field_log_id: 'log-1', confirmed: false }],
    })

    expect(db.MaterialMovement.update).toHaveBeenCalledWith('mov-1', { confirmed: true })
  })
})
