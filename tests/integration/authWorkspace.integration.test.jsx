import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('auth + workspace integration', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('autentica e seleciona workspace salvo do usuario', async () => {
    const workspaceRows = new Map([
      ['ws-alpha', { id: 'ws-alpha', name: 'Alpha' }],
      ['ws-beta', { id: 'ws-beta', name: 'Beta' }],
    ])
    const membershipRows = [
      { id: 'mem-alpha', workspace_id: 'ws-alpha', user_email: 'ana@altivus.com', role: 'workspace_admin', status: 'active' },
      { id: 'mem-beta', workspace_id: 'ws-beta', user_email: 'ana@altivus.com', role: 'visualizador', status: 'active' },
    ]

    vi.doMock('@/lib/app-params', () => ({ appParams: { appId: 'app-1', token: 'token-1' } }))
    vi.doMock('@/api/base44Client', () => ({
      base44: {
        auth: {
          me: vi.fn(async () => ({ id: 'user-ana', email: 'ana@altivus.com', full_name: 'Ana Altivus', role: 'user' })),
          logout: vi.fn(),
          redirectToLogin: vi.fn(),
        },
        entities: {
          WorkspaceMember: {
            filter: vi.fn(async () => membershipRows),
            update: vi.fn(async () => ({})),
            create: vi.fn(),
          },
          Workspace: {
            get: vi.fn(async (id) => workspaceRows.get(id) || null),
          },
          OperationalLog: { create: vi.fn() },
        },
      },
    }))
    vi.doMock('@base44/sdk/dist/utils/axios-client', () => ({
      createAxiosClient: () => ({ get: vi.fn().mockResolvedValue({ id: 'app-1', public_settings: {} }) }),
    }))

    const { AuthProvider, useAuth } = await import('@/lib/AuthContext')
    const { WorkspaceProvider, useWorkspaceContext } = await import('@/lib/WorkspaceContext')

    function Probe() {
      const auth = useAuth()
      const workspace = useWorkspaceContext()
      return (
        <>
          <span data-testid="auth">{String(auth.isAuthenticated)}</span>
          <span data-testid="workspace">{workspace.workspaceId || 'none'}</span>
          <span data-testid="role">{workspace.role || 'none'}</span>
        </>
      )
    }

    localStorage.setItem('altivus_active_workspace', 'ws-beta')

    render(
      <AuthProvider>
        <WorkspaceProvider>
          <Probe />
        </WorkspaceProvider>
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByTestId('auth')).toHaveTextContent('true'))
    await waitFor(() => expect(screen.getByTestId('workspace')).toHaveTextContent('ws-beta'))
    expect(screen.getByTestId('role')).toHaveTextContent('visualizador')
  })
})
