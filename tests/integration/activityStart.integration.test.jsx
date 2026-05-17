import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('ActivityDetailPanel start flow', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('inicia atividade a partir do botao e atualiza sessao/cache do workspace ativo', async () => {
    const activity = {
      id: 'act-1',
      workspace_id: 'ws-alpha',
      title: 'Atividade Alpha',
      status: 'not_started',
      team_id: 'team-1',
      descents_planned: 5,
      area_m2: 100,
    }
    const session = {
      id: 'sess-1',
      workspace_id: 'ws-alpha',
      activity_id: 'act-1',
      team_id: 'team-1',
      date: '2026-05-17',
      status: 'em_execucao',
      descidas_realizadas: 0,
      descidas_planejadas_hoje: 2,
    }
    const db = {
      ActivitySession: { create: vi.fn(async (payload) => ({ ...session, ...payload })) },
      Activity: { update: vi.fn(async (id, payload) => ({ ...activity, id, ...payload })) },
      OperationalLog: { create: vi.fn(async () => ({})) },
    }
    const onRefresh = vi.fn()

    vi.doMock('@/lib/useWorkspace', () => ({ useWorkspace: () => ({ workspaceId: 'ws-alpha' }) }))
    vi.doMock('@/lib/useWorkspaceEntities', () => ({ useWorkspaceEntities: () => db }))
    vi.doMock('@/lib/AuthContext', () => ({ useAuth: () => ({ user: { id: 'user-1', email: 'ana@altivus.com' } }) }))
    vi.doMock('@/lib/usePermissions', () => ({
      usePermissions: () => ({
        canCheckin: true,
        canCheckout: true,
        canAddDescida: true,
        canUploadPhoto: true,
        isReadOnly: false,
      }),
    }))
    vi.doMock('@/lib/useAppData', () => ({
      useMaterials: () => ({ data: [] }),
      useEmployees: () => ({ data: [] }),
    }))
    vi.doMock('@/lib/useOperationalExecution', () => ({
      useOperationalExecution: () => ({
        sessions: [],
        attendanceRecords: [],
        activeSession: null,
        todaySession: null,
        today: '2026-05-17',
        metrics: {
          elapsedMinutes: 0,
          executedToday: 0,
          plannedToday: 0,
          executedTotal: 0,
          plannedTotal: 5,
          completionPct: 0,
          presence: { total: 0, present: 0, absent: 0, pending: 0, assigned: 0 },
          facadeProgress: { label: 'Frente', pct: 0, executedArea: 0, totalArea: 100, visible: true },
          remainingToday: 0,
          remainingTotal: 5,
        },
      }),
    }))
    vi.doMock('@/api/base44Client', () => ({ base44: { integrations: { Core: { UploadFile: vi.fn() } } } }))
    vi.doMock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
    vi.doMock('@/components/activities/CheckinModal', () => ({
      default: ({ open, onConfirm }) => open
        ? <button onClick={() => onConfirm({ checklist: { epis: true }, descidas_planejadas_hoje: 2 })}>Confirmar início</button>
        : null,
    }))
    vi.doMock('@/components/activities/CheckoutModal', () => ({ default: () => null }))
    vi.doMock('@/components/activities/ExecutionTimer', () => ({ default: () => null }))
    vi.doMock('@/components/activities/OperationalBar', () => ({ default: () => null }))
    vi.doMock('@/components/activities/PlanningTab', () => ({ default: () => null }))
    vi.doMock('@/components/operationalmap/OperationalMapTab', () => ({ default: () => null }))
    vi.doMock('@/components/activities/AttendanceTab', () => ({ default: () => null }))
    vi.doMock('@/components/activities/ActivityHistoryTab', () => ({ default: () => null }))
    vi.doMock('@/components/reports/GenerateReportModal', () => ({ default: () => null }))

    const { default: ActivityDetailPanel } = await import('@/components/activities/ActivityDetailPanel')
    const queryClient = new QueryClient()
    queryClient.setQueryData(['activities', 'ws-alpha'], [activity])
    queryClient.setQueryData(['activitySessions', 'ws-alpha', 'act-1'], [])

    render(
      <QueryClientProvider client={queryClient}>
        <ActivityDetailPanel activity={activity} teams={[{ id: 'team-1', name: 'Equipe Alpha' }]} onClose={vi.fn()} onRefresh={onRefresh} />
      </QueryClientProvider>
    )

    fireEvent.click(screen.getByText(/Iniciar Atividade do Dia/))
    fireEvent.click(await screen.findByText('Confirmar início'))

    await waitFor(() => expect(db.ActivitySession.create).toHaveBeenCalledWith(expect.objectContaining({
      activity_id: 'act-1',
      team_id: 'team-1',
      date: '2026-05-17',
    })))
    expect(db.Activity.update).toHaveBeenCalledWith('act-1', { status: 'in_progress' })
    expect(queryClient.getQueryData(['activitySessions', 'ws-alpha', 'act-1'])).toEqual([
      expect.objectContaining({ id: 'sess-1', activity_id: 'act-1' }),
    ])
    expect(queryClient.getQueryData(['activities', 'ws-alpha'])).toEqual([
      expect.objectContaining({ id: 'act-1', status: 'in_progress' }),
    ])
    expect(onRefresh).toHaveBeenCalled()
  })
})
