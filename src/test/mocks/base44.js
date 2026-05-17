import { vi } from 'vitest'

export function createEntityMock(initial = []) {
  const rows = new Map(initial.map((row) => [row.id, { ...row }]))
  const subscribers = new Set()

  return {
    rows,
    list: vi.fn(async () => Array.from(rows.values())),
    filter: vi.fn(async (query = {}) => Array.from(rows.values()).filter((row) =>
      Object.entries(query).every(([key, value]) => row[key] === value)
    )),
    get: vi.fn(async (id) => rows.get(id) || null),
    create: vi.fn(async (data) => {
      const next = { id: data.id || `id-${rows.size + 1}`, ...data }
      rows.set(next.id, next)
      return next
    }),
    bulkCreate: vi.fn(async (items) => Promise.all(items.map((item) => {
      const next = { id: item.id || `id-${rows.size + 1}`, ...item }
      rows.set(next.id, next)
      return next
    }))),
    update: vi.fn(async (id, data) => {
      const current = rows.get(id) || { id }
      const next = { ...current, ...data }
      rows.set(id, next)
      return next
    }),
    delete: vi.fn(async (id) => rows.delete(id)),
    schema: vi.fn(() => ({})),
    subscribe: vi.fn((callback) => {
      subscribers.add(callback)
      return () => subscribers.delete(callback)
    }),
    emit(event) {
      subscribers.forEach((callback) => callback(event))
    },
  }
}

export function createBase44Mock(seed = {}) {
  return {
    auth: {
      me: vi.fn(),
      logout: vi.fn(),
      redirectToLogin: vi.fn(),
    },
    entities: new Proxy({}, {
      get(target, name) {
        if (!target[name]) target[name] = createEntityMock(seed[name] || [])
        return target[name]
      },
    }),
  }
}
