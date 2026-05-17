import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('ApprovalPanel regression', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  async function renderPanel({ logs, canApproveReport, approveImpl = vi.fn(async () => {}) }) {
    const db = {
      FieldLog: { list: vi.fn(async () => logs) },
      Contract: { list: vi.fn(async () => [{ id: 'contract-1', name: 'Contrato Alpha' }]) },
      MaterialMovement: { list: vi.fn(async () => []) },
    }

    vi.doMock('@/lib/useWorkspaceEntities', () => ({ useWorkspaceEntities: () => db }))
    vi.doMock('@/lib/useWorkspace', () => ({ useWorkspace: () => ({ workspaceId: 'ws-alpha' }) }))
    vi.doMock('@/lib/AuthContext', () => ({ useAuth: () => ({ user: { email: 'supervisor@altivus.com' } }) }))
    vi.doMock('@/lib/usePermissions', () => ({ usePermissions: () => ({ canApproveReport }) }))
    vi.doMock('@/services/fieldLogService', () => ({ fieldLogService: { approveFieldLog: approveImpl } }))

    const { default: ApprovalPanel } = await import('@/components/fieldlog/ApprovalPanel')
    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <ApprovalPanel />
      </QueryClientProvider>
    )

    return { approveImpl }
  }

  it('nega acesso de aprovacao para perfis sem RBAC adequado', async () => {
    await renderPanel({
      logs: [],
      canApproveReport: false,
    })

    expect(await screen.findByText(/Painel de aprova/)).toBeInTheDocument()
    expect(screen.queryByText('Aprovar')).not.toBeInTheDocument()
  })

  it('nao oferece nova acao para diario ja aprovado', async () => {
    await renderPanel({
      logs: [{
        id: 'log-1',
        contract_id: 'contract-1',
        date: '2026-05-17',
        status: 'closed',
        approval_status: 'approved',
        approval_by: 'supervisor@altivus.com',
        approval_at: '2026-05-17T10:00:00.000Z',
      }],
      canApproveReport: true,
    })

    fireEvent.click(await screen.findByText('Contrato Alpha'))
    expect(screen.getByText(/Aprovado por supervisor@altivus.com/)).toBeInTheDocument()
    expect(screen.queryByText('Aprovar')).not.toBeInTheDocument()
    expect(screen.queryByText('Reprovar')).not.toBeInTheDocument()
  })

  it('mantem aprovacao pendente idempotente enquanto a primeira mutacao esta em voo', async () => {
    let resolveApproval
    const approveImpl = vi.fn(() => new Promise((resolve) => {
      resolveApproval = resolve
    }))

    await renderPanel({
      logs: [{
        id: 'log-1',
        contract_id: 'contract-1',
        date: '2026-05-17',
        status: 'closed',
        approval_status: 'pending',
      }],
      canApproveReport: true,
      approveImpl,
    })

    fireEvent.click(await screen.findByText('Contrato Alpha'))
    const approveButton = screen.getByText('Aprovar')

    fireEvent.click(approveButton)
    await waitFor(() => expect(approveButton).toBeDisabled())
    fireEvent.click(approveButton)

    expect(approveImpl).toHaveBeenCalledTimes(1)
    resolveApproval()
  })
})
