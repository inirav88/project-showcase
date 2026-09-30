import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
  dialog: {
    showSaveDialog: vi.fn(),
  },
}))

import { dialog } from 'electron'
import { LeadHandlers } from '../leads'

describe('LeadHandlers Security & CSV Formula Injection Protection', () => {
  const testCsvDir = path.join(process.cwd(), 'scratch', 'csv_test_tmp')
  const testCsvPath = path.join(testCsvDir, 'test_export.csv')
  let mockDb: any
  let handlers: LeadHandlers

  beforeEach(() => {
    fs.mkdirSync(testCsvDir, { recursive: true })
    mockDb = {
      lead: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'l1',
            name: '=cmd|\' /C calc\'!A0',
            phone: '+919999999999',
            email: '-test@example.com',
            project: { name: '@DangerousProject' },
            budgetMin: 1000,
            budgetMax: 2000,
            notes: '=1+1',
            capturedAt: new Date('2026-09-30T10:00:00Z'),
          },
        ]),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    }
    handlers = new LeadHandlers(mockDb)
  })

  afterEach(() => {
    if (fs.existsSync(testCsvDir)) {
      fs.rmSync(testCsvDir, { recursive: true, force: true })
    }
    vi.clearAllMocks()
  })

  it('escapes cells starting with =, +, -, @ to prevent spreadsheet formula injection', async () => {
    vi.mocked(dialog.showSaveDialog).mockResolvedValueOnce({
      canceled: false,
      filePath: testCsvPath,
    } as any)

    const res = await handlers.exportCsv()
    expect(res.success).toBe(true)

    const content = fs.readFileSync(testCsvPath, 'utf-8')
    const lines = content.trim().split(/\r?\n/)

    // Row 1 is header, Row 2 is data
    const dataRow = lines[1]
    // Dangerous formula starters must be prefixed with a single quote (')
    expect(dataRow).toContain('\'=cmd|\' /C calc\'!A0')
    expect(dataRow).toContain('\'+919999999999')
    expect(dataRow).toContain('\'-test@example.com')
    expect(dataRow).toContain('\'@DangerousProject')
    expect(dataRow).toContain('\'=1+1')
  })
})
