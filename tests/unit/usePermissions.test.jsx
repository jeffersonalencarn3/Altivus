import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const workspaceState = { role: 'visualizador' }
const authState = { user: { role: 'user' } }

vi.mock('@/lib/useWorkspace', () => ({ useWorkspace: () => workspaceState }))
vi.mock('@/lib/AuthContext', () => ({ useAuth: () => authState }))

import { usePermissions } from '@/lib/usePermissions'

describe('usePermissions', () => {
  beforeEach(() => {
    workspaceState.role = 'visualizador'
    authState.user = { role: 'user' }
  })

  it('mantem visualizador em modo leitura', () => {
    const { result } = renderHook(() => usePermissions())
    expect(result.current.isReadOnly).toBe(true)
    expect(result.current.canApprove).toBe(false)
  })

  it('permite aprovacoes para supervisor', () => {
    workspaceState.role = 'supervisor'
    const { result } = renderHook(() => usePermissions())
    expect(result.current.canApprove).toBe(true)
    expect(result.current.canManageMaterials).toBe(false)
  })

  it('eleva admin de plataforma para workspace_admin', () => {
    authState.user = { role: 'admin' }
    const { result } = renderHook(() => usePermissions())
    expect(result.current.role).toBe('workspace_admin')
    expect(result.current.canManageWorkspace).toBe(true)
  })
})
