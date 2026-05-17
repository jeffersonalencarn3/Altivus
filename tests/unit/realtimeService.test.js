import { describe, expect, it } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { applyRealtimeEntityEvent } from '@/services/realtimeService'

describe('realtimeService', () => {
  it('mescla atualizacoes na cache do workspace correto', () => {
    const qc = new QueryClient()
    qc.setQueryData(['materials', 'ws-alpha'], [{ id: 'mat-1', name: 'Corda', quantity_available: 10 }])

    const handled = applyRealtimeEntityEvent(qc, 'ws-alpha', 'Material', {
      type: 'update',
      data: { id: 'mat-1', name: 'Corda', quantity_available: 7 },
    }, ['materials'])

    expect(handled).toBe(true)
    expect(qc.getQueryData(['materials', 'ws-alpha'])).toEqual([
      { id: 'mat-1', name: 'Corda', quantity_available: 7 },
    ])
  })

  it('remove registros deletados da cache', () => {
    const qc = new QueryClient()
    qc.setQueryData(['fieldlogs', 'ws-alpha'], [{ id: 'log-1' }, { id: 'log-2' }])

    applyRealtimeEntityEvent(qc, 'ws-alpha', 'FieldLog', {
      type: 'delete',
      data: { id: 'log-1' },
    }, ['fieldlogs'])

    expect(qc.getQueryData(['fieldlogs', 'ws-alpha'])).toEqual([{ id: 'log-2' }])
  })

  it('mantem uma unica atividade sob atualizacoes concorrentes', () => {
    const qc = new QueryClient()
    qc.setQueryData(['activities', 'ws-alpha'], [{ id: 'act-1', progress: 10, descents_completed: 1 }])

    applyRealtimeEntityEvent(qc, 'ws-alpha', 'Activity', {
      type: 'update',
      data: { id: 'act-1', progress: 30, descents_completed: 3, updated_by: 'ana' },
    }, ['activities'])
    applyRealtimeEntityEvent(qc, 'ws-alpha', 'Activity', {
      type: 'update',
      data: { id: 'act-1', progress: 40, descents_completed: 4, updated_by: 'bia' },
    }, ['activities'])

    expect(qc.getQueryData(['activities', 'ws-alpha'])).toEqual([
      { id: 'act-1', progress: 40, descents_completed: 4, updated_by: 'bia' },
    ])
  })
})
