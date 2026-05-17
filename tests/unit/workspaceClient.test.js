import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('workspaceClient', () => {
  let material
  let createWorkspaceClient

  beforeEach(async () => {
    vi.resetModules()
    const rows = new Map([
      ['mat-1', { id: 'mat-1', workspace_id: 'ws-alpha', name: 'Corda' }],
      ['mat-2', { id: 'mat-2', workspace_id: 'ws-beta', name: 'Capacete' }],
    ])
    material = {
      filter: vi.fn(async (query = {}) => Array.from(rows.values()).filter((row) =>
        Object.entries(query).every(([key, value]) => row[key] === value)
      )),
      get: vi.fn(async (id) => rows.get(id) || null),
      create: vi.fn(async (data) => data),
      update: vi.fn(async (id, data) => ({ id, ...data })),
      delete: vi.fn(async (id) => id),
      bulkCreate: vi.fn(),
      schema: vi.fn(),
      subscribe: vi.fn(),
    }
    vi.doMock('@/api/base44Client', () => ({ base44: { entities: { Material: material } } }))
    ;({ createWorkspaceClient } = await import('@/lib/workspaceClient'))
  })

  it('falha fechado quando nao ha workspace ativo', () => {
    const db = createWorkspaceClient(null)
    expect(() => db.Material.list()).toThrow(/Workspace ativo/)
  })

  it('injeta workspace_id em leituras e criacoes', async () => {
    const db = createWorkspaceClient('ws-alpha')
    await db.Material.list()
    await db.Material.filter({ name: 'Corda' })
    await db.Material.create({ name: 'Luva', workspace_id: 'ws-beta' })

    expect(material.filter).toHaveBeenNthCalledWith(1, { workspace_id: 'ws-alpha' }, undefined, undefined)
    expect(material.filter).toHaveBeenNthCalledWith(2, { name: 'Corda', workspace_id: 'ws-alpha' }, undefined, undefined)
    expect(material.create).toHaveBeenCalledWith({ name: 'Luva', workspace_id: 'ws-alpha' })
  })

  it('bloqueia update/delete de registros de outro workspace', async () => {
    const db = createWorkspaceClient('ws-alpha')
    await expect(db.Material.update('mat-2', { name: 'Outro' })).rejects.toThrow(/Acesso negado/)
    await expect(db.Material.delete('mat-2')).rejects.toThrow(/Acesso negado/)
  })
})
