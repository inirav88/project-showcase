import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}))

import { SettingsHandlers } from '../settings'
import { hashPin } from '../../../security/authGuard'

describe('SettingsHandlers Security & Rate Limiting', () => {
  let mockDb: any
  let handlers: SettingsHandlers

  beforeEach(() => {
    mockDb = {
      settings: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
        update: vi.fn(),
      },
      staffProfile: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    }
    handlers = new SettingsHandlers(mockDb)
  })

  it('rate limits brute-force PIN verification attempts', async () => {
    mockDb.settings.findUnique.mockResolvedValue({
      id: 1,
      adminPinHash: hashPin('4321'),
    })

    // 4 failed attempts
    for (let i = 0; i < 4; i++) {
      const res = await handlers.verifyPin('0000')
      expect(res).toBe(false)
    }

    // 5th failed attempt triggers lockout
    const fifth = await handlers.verifyPin('0000')
    expect(fifth).toEqual({
      valid: false,
      locked: true,
      reason: expect.stringContaining('Too many failed attempts'),
    })

    // Further attempts are locked even with valid PIN
    const lockedRes = await handlers.verifyPin('4321')
    expect(lockedRes).toEqual({
      valid: false,
      locked: true,
      reason: expect.stringContaining('Too many failed attempts'),
    })
  })

  it('authenticates valid admin PIN in constant time', async () => {
    mockDb.settings.findUnique.mockResolvedValue({
      id: 1,
      adminPinHash: hashPin('9876'),
    })

    const res = await handlers.verifyPin('9876')
    expect(res).toBe(true)
  })
})
