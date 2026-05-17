import React, { useEffect } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { WorkspaceAccountGate } from '@/components/layout/AppLayout'

function CriticalMutation({ onRun }) {
  useEffect(() => {
    onRun()
  }, [onRun])
  return <div>rota operacional</div>
}

describe('WorkspaceAccountGate', () => {
  it('permite conteudo operacional para workspace ativo', () => {
    const onRun = vi.fn()
    render(
      <WorkspaceAccountGate workspace={{ id: 'ws-alpha', account_status: 'active' }}>
        <CriticalMutation onRun={onRun} />
      </WorkspaceAccountGate>
    )

    expect(screen.getByText('rota operacional')).toBeInTheDocument()
    expect(onRun).toHaveBeenCalledTimes(1)
  })

  it('bloqueia workspace expirado e nao monta mutacoes criticas', () => {
    const onRun = vi.fn()
    render(
      <WorkspaceAccountGate workspace={{ id: 'ws-expired', account_status: 'expired' }}>
        <CriticalMutation onRun={onRun} />
      </WorkspaceAccountGate>
    )

    expect(screen.getByText(/Per/)).toBeInTheDocument()
    expect(screen.queryByText('rota operacional')).not.toBeInTheDocument()
    expect(onRun).not.toHaveBeenCalled()
  })

  it('bloqueia workspace suspenso e nao monta mutacoes criticas', () => {
    const onRun = vi.fn()
    render(
      <WorkspaceAccountGate workspace={{ id: 'ws-blocked', account_status: 'blocked' }}>
        <CriticalMutation onRun={onRun} />
      </WorkspaceAccountGate>
    )

    expect(screen.getByText(/Acesso bloqueado/)).toBeInTheDocument()
    expect(screen.queryByText('rota operacional')).not.toBeInTheDocument()
    expect(onRun).not.toHaveBeenCalled()
  })
})
