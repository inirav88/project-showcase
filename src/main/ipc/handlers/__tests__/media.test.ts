import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'fs'
import path from 'path'

// Mock Electron globally to avoid environment check crashes
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}))

// Mock fluent-ffmpeg and sharp to avoid native dependencies triggering hardware writes during tests
vi.mock('fluent-ffmpeg', () => {
  const ffMock = () => ({
    output: vi.fn().mockReturnThis(),
    audioCodec: vi.fn().mockReturnThis(),
    audioBitrate: vi.fn().mockReturnThis(),
    on: vi.fn((event, cb) => {
      if (event === 'end') setTimeout(cb, 10)
      return ffMock()
    }),
    run: vi.fn(),
  })
  ffMock.setFfmpegPath = vi.fn()
  ffMock.ffprobe = vi.fn((_path, cb) => {
    cb(null, { format: { duration: 120.5 } })
  })
  return { default: ffMock }
})

vi.mock('sharp', () => {
  return {
    default: vi.fn(() => ({
      resize: vi.fn().mockReturnThis(),
      toFormat: vi.fn().mockReturnThis(),
      toFile: vi.fn().mockResolvedValue({}),
    })),
  }
})

import { MediaHandlers } from '../media'

describe('MediaHandlers Pipeline', () => {
  let mockDb: any
  let handlers: MediaHandlers
  const testTmpDir = path.join(process.cwd(), 'scratch', 'media_test_tmp')

  beforeEach(() => {
    mockDb = {
      media: {
        create: vi.fn(data => ({ id: 'm1', ...data.data })),
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
    }
    // Set up mock physical storage directory
    if (!fs.existsSync(testTmpDir)) {
      fs.mkdirSync(testTmpDir, { recursive: true })
    }
    handlers = new MediaHandlers(mockDb, testTmpDir)
  })

  it('correctly handles images by copying and triggering Sharp thumbnail resize', async () => {
    const dummyImage = path.join(testTmpDir, 'dummy_test.png')
    fs.writeFileSync(dummyImage, 'PNG DATA STUB')

    const result = await handlers.upload({
      projectId: 'p1',
      category: 'EXTERIOR',
      filePath: dummyImage,
    })

    expect(result.originalName).toBe('dummy_test.png')
    expect(result.thumbnailPath).toContain('_thumb.webp')
    expect(fs.existsSync(result.filePath)).toBe(true)

    // Clean up
    fs.unlinkSync(dummyImage)
  })
})
