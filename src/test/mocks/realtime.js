import { vi } from 'vitest'

export function createRealtimeEvent(record, type = 'update') {
  return { type, data: record }
}

export function createRealtimeEntity(records = []) {
  const callbacks = new Set()
  return {
    records,
    subscribe: vi.fn((callback) => {
      callbacks.add(callback)
      return () => callbacks.delete(callback)
    }),
    emit(event) {
      callbacks.forEach((callback) => callback(event))
    },
    subscriberCount() {
      return callbacks.size
    },
  }
}
