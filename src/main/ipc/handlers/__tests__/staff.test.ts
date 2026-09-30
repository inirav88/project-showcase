import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}))

import { StaffHandlers } from '../staff'

describe('StaffHandlers Security & Pin Hash Leak Prevention', () => {
  let mockDb: any
  let handlers: StaffHandlers

  beforeEach(() => {
    mockDb = {
      staffProfile: {
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
    }
    handlers = new StaffHandlers(mockDb)
  })

  it('never exposes pinHash in list()', async () => {
    // Return mock data that includes pinHash in DB
    mockDb.staffProfile.findMany.mockImplementation(async (args?: any) => {
      // If select is used properly, DB returns only selected fields
      if (args?.select) {
        expect(args.select.pinHash).toBeUndefined()
        return [
          {
            id: 'staff-1',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '9876543210',
            role: 'AGENT',
            isActive: true,
            createdAt: new Date(),
          },
        ]
      }
      // If full record was fetched, simulating old vulnerable behavior
      return [
        {
          id: 'staff-1',
          name: 'John Doe',
          pinHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          role: 'AGENT',
          isActive: true,
        },
      ]
    })

    const profiles = await handlers.list()
    expect(profiles.length).toBe(1)
    expect((profiles[0] as any).pinHash).toBeUndefined()
  })

  it('rate limits failed verifyPin attempts to prevent brute force', async () => {
    mockDb.staffProfile.findUnique.mockResolvedValue({
      id: 'staff-1',
      name: 'Agent Smith',
      pinHash: handlers.hashPin('1234'),
      isActive: true,
    })

    // First 4 attempts return false
    for (let i = 0; i < 4; i++) {
      const res = await handlers.verifyPin('staff-1', '0000')
      expect(res).toBe(false)
    }

    // 5th failed attempt triggers lockout
    const fifthRes = await handlers.verifyPin('staff-1', '0000')
    expect(fifthRes).toEqual({
      valid: false,
      locked: true,
      reason: expect.stringContaining('Too many failed attempts'),
    })

    // Subsequent attempt is blocked even if correct PIN is provided
    const lockedRes = await handlers.verifyPin('staff-1', '1234')
    expect(lockedRes).toEqual({
      valid: false,
      locked: true,
      reason: expect.stringContaining('Too many failed attempts'),
    })
  })
})
