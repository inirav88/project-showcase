import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'fs'
import path from 'path'

// Mock electron globally to avoid dialog/prompt runtime exceptions
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
  dialog: {
    showSaveDialog: vi.fn(async () => ({
      filePath: path.join(process.cwd(), 'scratch', 'test_brochure.pdf'),
    })),
  },
}))

import { PdfHandlers } from '../pdf'

describe('PdfHandlers brochure compiler', () => {
  let mockDb: any
  let handlers: PdfHandlers
  const testOutputDir = path.join(process.cwd(), 'scratch')

  beforeEach(() => {
    mockDb = {
      project: {
        findUnique: vi.fn(() => ({
          id: 'p1',
          name: 'Skyline Residences',
          developer: 'Ahmedabad Builders Ltd',
          reraNumber: 'RAJ/P/24/1',
          location: 'Ahmedabad',
        })),
      },
      unit: {
        findMany: vi.fn(() => [
          {
            id: 'u1',
            unitNumber: 'A-101',
            configuration: '3BHK',
            carpetArea: 1200,
            price: 11000000,
            facing: 'East',
            tower: { name: 'Tower A' },
          },
        ]),
      },
      settings: {
        findUnique: vi.fn(() => ({
          id: 1,
          firmName: 'Test Firm',
          firmLogo: null,
        })),
      },
    }
    handlers = new PdfHandlers(mockDb)

    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true })
    }
  })

  it('compiles PDF doc offline adding title cover, custom variables metadata, and inventory list', async () => {
    const targetFile = path.join(testOutputDir, 'test_brochure.pdf')
    if (fs.existsSync(targetFile)) {
      fs.unlinkSync(targetFile)
    }

    const res = await handlers.exportBrochure('p1', 'Nirav Patel', ['u1'])

    expect(res.success).toBe(true)
    expect(fs.existsSync(targetFile)).toBe(true)

    // Clean up
    fs.unlinkSync(targetFile)
  })
})
