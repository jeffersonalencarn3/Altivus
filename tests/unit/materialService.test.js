import { describe, expect, it } from 'vitest'
import { materialService } from '@/services/materialService'
import { createBase44Mock } from '@/test/mocks/base44'

describe('materialService', () => {
  it('consome estoque e cria movimento de saida', async () => {
    const db = createBase44Mock({
      Material: [{ id: 'mat-1', name: 'Corda', quantity_available: 10 }],
    }).entities

    await materialService.consumeMaterials(db, {
      materials: [{ id: 'mat-1', name: 'Corda', quantity_available: 10 }],
      consumption: [{ material_id: 'mat-1', material_name: 'Corda', quantity_used: 4 }],
      source: {
        createMovement: true,
        fieldLogId: 'log-1',
        activityId: 'act-1',
        contractId: 'contract-1',
        collaborator: 'ana@altivus.com',
        notes: 'Diario 2026-05-17',
        movementAt: '2026-05-17T10:00:00.000Z',
      },
    })

    expect(db.Material.update).toHaveBeenCalledWith('mat-1', { quantity_available: 6 })
    expect(db.MaterialMovement.create).toHaveBeenCalledWith(expect.objectContaining({
      material_id: 'mat-1',
      quantity: 4,
      type: 'exit',
      field_log_id: 'log-1',
      confirmed: false,
    }))
  })
})
