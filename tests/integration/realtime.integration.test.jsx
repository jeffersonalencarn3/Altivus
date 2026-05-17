import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { createRealtimeEntity } from '@/test/mocks/realtime'

const materialRealtime = createRealtimeEntity()
const db = new Proxy({}, {
  get(_, name) {
    if (name === 'Material') return materialRealtime
    return { subscribe: vi.fn(() => () => {}) }
  },
})

vi.mock('@/lib/useWorkspace', () => ({ useWorkspace: () => ({ workspaceId: 'ws-alpha' }) }))
vi.mock('@/lib/workspaceClient', () => ({ createWorkspaceClient: () => db }))

import { useWorkspaceRealtime } from '@/lib/useWorkspaceRealtime'

describe('useWorkspaceRealtime integration', () => {
  it('assina eventos e atualiza cache do workspace ativo', async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(['materials', 'ws-alpha'], [{ id: 'mat-1', quantity_available: 10 }])

    const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    const { unmount } = renderHook(() => useWorkspaceRealtime(), { wrapper })

    expect(materialRealtime.subscriberCount()).toBe(1)

    materialRealtime.emit({ type: 'update', data: { id: 'mat-1', quantity_available: 8 } })

    await waitFor(() => expect(queryClient.getQueryData(['materials', 'ws-alpha'])).toEqual([
      { id: 'mat-1', quantity_available: 8 },
    ]))

    unmount()
    expect(materialRealtime.subscriberCount()).toBe(0)
  })
})
