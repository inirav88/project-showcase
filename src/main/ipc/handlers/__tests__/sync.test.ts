import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}))

import { SyncHandlers } from '../sync'

describe('SyncHandlers', () => {
  let mockDb: any
  let handlers: SyncHandlers

  beforeEach(() => {
    mockDb = {
      settings: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      project: { findMany: vi.fn(), upsert: vi.fn() },
      tower: { findMany: vi.fn(), upsert: vi.fn() },
      unit: { findMany: vi.fn(), upsert: vi.fn() },
      projectModule: { findMany: vi.fn(), upsert: vi.fn() },
      highlightCard: { findMany: vi.fn(), upsert: vi.fn() },
      amenity: { findMany: vi.fn(), upsert: vi.fn() },
      $transaction: vi.fn(async (cb) => cb(mockDb)),
    }
    handlers = new SyncHandlers(mockDb)
  })

  it('returns configured = false when settings or vpsBaseUrl is missing', async () => {
    mockDb.settings.findUnique.mockResolvedValueOnce(null)
    const status = await handlers.getStatus()
    expect(status.configured).toBe(false)
    expect(status.contentVersion).toBe('0')
  })

  it('returns configured status when vpsBaseUrl is set', async () => {
    mockDb.settings.findUnique.mockResolvedValueOnce({
      vpsBaseUrl: 'https://sync.example.com',
      lastSyncedAt: new Date('2026-01-01'),
      contentVersion: '42',
    })
    const status = await handlers.getStatus()
    expect(status.configured).toBe(true)
    expect(status.vpsBaseUrl).toBe('https://sync.example.com')
    expect(status.contentVersion).toBe('42')
  })

  it('handles syncNow when VPS URL is missing gracefully', async () => {
    mockDb.settings.findUnique.mockResolvedValueOnce({ vpsBaseUrl: '' })
    const res = await handlers.syncNow()
    expect(res.success).toBe(false)
    expect(res.reason).toContain('Cloud sync not configured')
  })
})
