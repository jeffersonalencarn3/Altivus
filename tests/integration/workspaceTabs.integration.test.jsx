import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('workspace multi-tab integration', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('sincroniza workspace entre abas e troca o cache ativo sem vazamento entre empresas', async () => {
    const materialsByWorkspace = {
      'ws-alpha': [{ id: 'mat-alpha', workspace_id: 'ws-alpha', name: 'Corda Alpha' }],
      'ws-beta': [{ id: 'mat-beta', workspace_id: 'ws-beta', name: 'Capacete Beta' }],
    }
    const materialFilter = vi.fn(async ({ workspace_id }) => materialsByWorkspace[workspace_id] || [])

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
            filter: vi.fn(async () => [
              { id: 'mem-alpha', workspace_id: 'ws-alpha', user_email: 'ana@altivus.com', role: 'workspace_admin', status: 'active' },
              { id: 'mem-beta', workspace_id: 'ws-beta', user_email: 'ana@altivus.com', role: 'visualizador', status: 'active' },
            ]),
            update: vi.fn(async () => ({})),
            create: vi.fn(),
          },
          Workspace: {
            get: vi.fn(async (id) => ({ id, name: id })),
          },
          Material: {
            filter: materialFilter,
          },
          OperationalLog: { create: vi.fn() },
        },
      },
    }))
    vi.doMock('@base44/sdk/dist/utils/axios-client', () => ({
      createAxiosClient: () => ({ get: vi.fn().mockResolvedValue({ id: 'app-1', public_settings: {} }) }),
    }))

    const { AuthProvider } = await import('@/lib/AuthContext')
    const { WorkspaceProvider, useWorkspaceContext } = await import('@/lib/WorkspaceContext')
    const { useMaterials } = await import('@/lib/useAppData')

    function Probe() {
      const workspace = useWorkspaceContext()
      const materials = useMaterials()
      return (
        <>
          <span data-testid="workspace">{workspace.workspaceId || 'none'}</span>
          <span data-testid="material">{materials.data?.[0]?.name || 'none'}</span>
        </>
      )
    }

    const queryClient = new QueryClient()
    localStorage.setItem('altivus_active_workspace', 'ws-alpha')

    render(
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <WorkspaceProvider>
            <Probe />
          </WorkspaceProvider>
        </QueryClientProvider>
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByTestId('workspace')).toHaveTextContent('ws-alpha'))
    await waitFor(() => expect(screen.getByTestId('material')).toHaveTextContent('Corda Alpha'))

    window.dispatchEvent(new StorageEvent('storage', {
      key: 'altivus_active_workspace',
      newValue: 'ws-beta',
    }))

    await waitFor(() => expect(screen.getByTestId('workspace')).toHaveTextContent('ws-beta'))
    await waitFor(() => expect(screen.getByTestId('material')).toHaveTextContent('Capacete Beta'))

    expect(materialFilter).toHaveBeenNthCalledWith(1, { workspace_id: 'ws-alpha' }, undefined, undefined)
    expect(materialFilter).toHaveBeenNthCalledWith(2, { workspace_id: 'ws-beta' }, undefined, undefined)
    expect(queryClient.getQueryData(['materials', 'ws-alpha'])).toEqual(materialsByWorkspace['ws-alpha'])
    expect(queryClient.getQueryData(['materials', 'ws-beta'])).toEqual(materialsByWorkspace['ws-beta'])
    expect(queryClient.getQueryData(['materials', 'ws-beta'])).not.toEqual(materialsByWorkspace['ws-alpha'])
  })
})
