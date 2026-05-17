import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('AppLayout workspace access logs', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('registra bloqueio do workspace sem depender de nova tela', async () => {
    const db = { OperationalLog: { create: vi.fn(async payload => payload) } }

    vi.doMock('@/lib/useWorkspace', () => ({
      useWorkspace: () => ({
        isLoading: false,
        workspaceId: 'ws-blocked',
        currentWorkspace: { id: 'ws-blocked', account_status: 'blocked' },
      }),
    }))
    vi.doMock('@/lib/useWorkspaceEntities', () => ({ useWorkspaceEntities: () => db }))
    vi.doMock('@/lib/useWorkspaceRealtime', () => ({ useWorkspaceRealtime: () => undefined }))
    vi.doMock('@/lib/AuthContext', () => ({ useAuth: () => ({ user: { id: 'user-1', email: 'ana@altivus.com' } }) }))
    vi.doMock('react-router-dom', () => ({
      Outlet: () => <div>outlet</div>,
      useNavigate: () => vi.fn(),
    }))
    vi.doMock('@/components/ErrorBoundary', () => ({ default: ({ children }) => children }))
    vi.doMock('@/components/layout/Sidebar.jsx', () => ({ default: () => null }))
    vi.doMock('@/components/layout/AppHeader.jsx', () => ({ default: () => null }))
    vi.doMock('@/components/layout/NavBar.jsx', () => ({ default: () => null }))
    vi.doMock('@/components/layout/RecentActivitiesPanel.jsx', () => ({ default: () => null }))
    vi.doMock('@/components/layout/TrialBanner.jsx', () => ({ default: () => null }))
    vi.doMock('@/components/ui/MobileBottomNav.jsx', () => ({ default: () => null }))

    const { default: AppLayout } = await import('@/components/layout/AppLayout')
    render(<AppLayout />)

    await waitFor(() => expect(db.OperationalLog.create).toHaveBeenCalledWith(expect.objectContaining({
      workspace_id: 'ws-blocked',
      event_type: 'workspace.blocked',
      action: 'block_workspace_access',
      user_id: 'user-1',
    })))
  })
})
