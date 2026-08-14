import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Electron's ipcMain globally in the Node runtime to bypass binary checks
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}))

import { UnitHandlers } from '../units'

describe('UnitHandlers CSV Bulk Parser', () => {
  let mockDb: any
  let handlers: UnitHandlers

  beforeEach(() => {
    mockDb = {
      tower: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      unit: {
        upsert: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => cb(mockDb)),
    }
    handlers = new UnitHandlers(mockDb)
  })

  it('correctly processes valid CSV strings and resolves tower associations', async () => {
    const csvContent = `towerName,floor,unitNumber,configuration,carpetArea,builtUpArea,superBuiltUpArea,facing,price,priceLabel,status,notes
Tower B,12,B-1204,3BHK,1150,1450,1600,North-East,9500000,OFFICIAL,AVAILABLE,Luxury view`

    mockDb.tower.findFirst.mockResolvedValueOnce(null)
    mockDb.tower.create.mockResolvedValueOnce({ id: 't2', name: 'Tower B' })
    mockDb.unit.upsert.mockResolvedValueOnce({ id: 'u1' })

    const result = await handlers.bulkImport('p1', csvContent)

    expect(result.success).toBe(true)
    expect(result.count).toBe(1)
    expect(mockDb.tower.create).toHaveBeenCalledWith({
      data: { projectId: 'p1', name: 'Tower B' },
    })
    expect(mockDb.unit.upsert).toHaveBeenCalledWith({
      where: { id: 'new-import-stub' },
      update: expect.objectContaining({
        unitNumber: 'B-1204',
        floor: 12,
        price: 9500000,
        status: 'AVAILABLE',
      }),
      create: expect.objectContaining({
        unitNumber: 'B-1204',
        floor: 12,
        price: 9500000,
        status: 'AVAILABLE',
      }),
    })
  })

  it('rejects CSV rows with invalid schema types', async () => {
    const csvContent = `towerName,floor,unitNumber,configuration,carpetArea,builtUpArea,superBuiltUpArea,facing,price,priceLabel,status,notes
Tower B,not-a-number,B-1204,3BHK,1150,1450,1600,North-East,9500000,OFFICIAL,AVAILABLE,Luxury view`

    mockDb.tower.findFirst.mockResolvedValueOnce({ id: 't2' })

    await expect(handlers.bulkImport('p1', csvContent)).rejects.toThrow()
  })
})
