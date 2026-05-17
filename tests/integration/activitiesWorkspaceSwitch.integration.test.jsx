import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('Activities workspace switch regression', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('descarta atividade selecionada ao trocar workspace para nao manter activity_id antigo', async () => {
    const workspaceState = { workspaceId: 'ws-alpha' }
    const activitiesByWorkspace = {
      'ws-alpha': [{ id: 'act-alpha', title: 'Atividade Alpha', status: 'not_started' }],
      'ws-beta': [{ id: 'act-beta', title: 'Atividade Beta', status: 'not_started' }],
    }

    vi.doMock('@/lib/useWorkspace', () => ({ useWorkspace: () => workspaceState }))
    vi.doMock('@/lib/useWorkspaceEntities', () => ({ useWorkspaceEntities: () => ({}) }))
    vi.doMock('@/lib/AuthContext', () => ({ useAuth: () => ({ user: { email: 'ana@altivus.com' } }) }))
    vi.doMock('@/lib/usePermissions', () => ({
      usePermissions: () => ({ canCreateActivity: true, canEditActivity: true, canDeleteActivity: true }),
    }))
    vi.doMock('@/lib/useAppData', () => ({
      useActivities: () => ({ data: activitiesByWorkspace[workspaceState.workspaceId], isLoading: false }),
      useTeams: () => ({ data: [] }),
      useContracts: () => ({ data: [] }),
      useActivitySessions: () => ({ data: [] }),
    }))
    vi.doMock('@/components/activities/ActivityBlockCard', () => ({
      default: ({ activity, onOpen }) => <button onClick={onOpen}>Abrir {activity.id}</button>,
    }))
    vi.doMock('@/components/activities/ActivityDetailPanel', () => ({
      default: ({ activity }) => <div data-testid="selected-activity">{activity.id}</div>,
    }))
    vi.doMock('@/components/activities/PlanningCalculator', () => ({ default: () => null }))
    vi.doMock('@/components/activities/ActivityDeleteModal', () => ({ default: () => null }))
    vi.doMock('@/components/activities/ActivityRescheduleModal', () => ({ default: () => null }))
    vi.doMock('@/components/activities/RecalcButton', () => ({ default: () => null }))
    vi.doMock('@/components/ui/LoadingSkeleton', () => ({ default: () => null }))
    vi.doMock('@/components/ui/EmptyState', () => ({ default: () => null }))
    vi.doMock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

    const { default: Activities } = await import('@/pages/Activities')
    const queryClient = new QueryClient()
    const view = render(
      <QueryClientProvider client={queryClient}>
        <Activities />
      </QueryClientProvider>
    )

    fireEvent.click(screen.getByText('Abrir act-alpha'))
    expect(screen.getByTestId('selected-activity')).toHaveTextContent('act-alpha')

    workspaceState.workspaceId = 'ws-beta'
    view.rerender(
      <QueryClientProvider client={queryClient}>
        <Activities />
      </QueryClientProvider>
    )

    expect(screen.queryByTestId('selected-activity')).not.toBeInTheDocument()
    expect(screen.getByText('Abrir act-beta')).toBeInTheDocument()
  })
})
