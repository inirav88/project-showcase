import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
  dialog: {
    showSaveDialog: vi.fn(),
    showOpenDialog: vi.fn(),
  },
}))

import { dialog } from 'electron'
import { UsbHandlers } from '../usb'

describe('UsbHandlers Security & Zip Slip Protection', () => {
  const testBaseDir = path.join(process.cwd(), 'scratch', 'usb_test_tmp')
  const testAppData = path.join(testBaseDir, 'appData')
  const testDbPath = path.join(testAppData, 'showcaseos.db')
  const testMediaDir = path.join(testAppData, 'media')
  let mockDb: any
  let handlers: UsbHandlers

  beforeEach(() => {
    fs.mkdirSync(testMediaDir, { recursive: true })
    fs.writeFileSync(testDbPath, 'ORIGINAL DB')

    mockDb = {
      settings: {
        upsert: vi.fn().mockResolvedValue({}),
      },
    }
    handlers = new UsbHandlers(mockDb, testAppData, testDbPath)
  })

  afterEach(() => {
    if (fs.existsSync(testBaseDir)) {
      fs.rmSync(testBaseDir, { recursive: true, force: true })
    }
    vi.clearAllMocks()
  })

  it('blocks Zip Slip path traversal during importPackage', async () => {
    // Generate a raw zip using python zipfile with actual traversal entry
    const maliciousZipPath = path.join(testBaseDir, 'malicious.zip')
    const pyScript = `import zipfile; z = zipfile.ZipFile(r'${maliciousZipPath}', 'w'); z.writestr('showcaseos.db', 'NEW DB CONTENT'); z.writestr('media/valid_pic.jpg', 'VALID IMAGE'); z.writestr('media/../escaped_evil.txt', 'EVIL CONTENT'); z.close()`
    execSync(`python -c "${pyScript}"`)

    vi.mocked(dialog.showOpenDialog).mockResolvedValueOnce({
      canceled: false,
      filePaths: [maliciousZipPath],
    } as any)

    const result = await handlers.importPackage()
    expect(result.success).toBe(true)

    // Verify legitimate files were extracted
    expect(fs.existsSync(path.join(testMediaDir, 'valid_pic.jpg'))).toBe(true)

    // Verify escaped traversal file was BLOCKED and NOT written into testAppData
    const escapedFileLocation = path.join(testAppData, 'escaped_evil.txt')
    expect(fs.existsSync(escapedFileLocation)).toBe(false)
  })
})
