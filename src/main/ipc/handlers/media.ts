import { ipcMain } from 'electron'
import type { PrismaClient } from '@prisma/client'
import { IPC_CHANNELS } from '../channels'
import path from 'path'
import fs from 'fs'
import ffmpegStatic from 'ffmpeg-static'
import ffmpeg from 'fluent-ffmpeg'
import sharp from 'sharp'

// Wire up the static path for fluent-ffmpeg wrapper
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic)
}

export class MediaHandlers {
  private mediaDir: string

  constructor(private db: PrismaClient, appDataPath: string) {
    this.mediaDir = path.join(appDataPath, 'media')
    if (!fs.existsSync(this.mediaDir)) {
      fs.mkdirSync(this.mediaDir, { recursive: true })
    }
  }

  /**
   * Import and optimize media file
   */
  async upload(input: {
    projectId: string
    category: string // 'EXTERIOR' | 'INTERIOR' | 'VIDEO' | 'AUDIO' | etc.
    filePath: string // Absolute path of file to copy/optimize
    tags?: string
  }) {
    const { projectId, category, filePath } = input
    if (!fs.existsSync(filePath)) {
      throw new Error(`Source file does not exist: ${filePath}`)
    }

    const fileExt = path.extname(filePath).toLowerCase()
    const fileBase = path.basename(filePath, fileExt)
    const uniqueName = `${projectId}_${category}_${Date.now()}_${fileBase}`
    const targetFilePath = path.join(this.mediaDir, `${uniqueName}${fileExt}`)

    let thumbnailPath = ''
    let durationSecs: number | null = null

    // 1. Process Audio Conversion (compress wav/mp3 to AAC m4a for performance)
    if (category === 'AUDIO' && ['.wav', '.mp3', '.ogg'].includes(fileExt)) {
      const convertedPath = path.join(this.mediaDir, `${uniqueName}.m4a`)
      await new Promise<void>((resolve, reject) => {
        ffmpeg(filePath)
          .output(convertedPath)
          .audioCodec('aac')
          .audioBitrate('128k')
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .run()
      })
      input.filePath = convertedPath
    } else {
      // Copy source file to app storage
      fs.copyFileSync(filePath, targetFilePath)
    }

    // Resolve final file size
    const finalFilePath = category === 'AUDIO' && ['.wav', '.mp3', '.ogg'].includes(fileExt)
      ? path.join(this.mediaDir, `${uniqueName}.m4a`)
      : targetFilePath
    const sizeBytes = fs.statSync(finalFilePath).size

    // 2. Process Video Duration Metadata Extraction
    if (['VIDEO', 'INTRO_VIDEO'].includes(category) || ['.mp4', '.mov', '.mkv'].includes(fileExt)) {
      durationSecs = await new Promise<number>((resolve) => {
        ffmpeg.ffprobe(finalFilePath, (err, metadata) => {
          if (err || !metadata.format || !metadata.format.duration) {
            resolve(0)
          } else {
            resolve(metadata.format.duration)
          }
        })
      })
    }

    // 3. Process Image Thumbnails (using sharp to downscale previews)
    if (['EXTERIOR', 'INTERIOR', 'LANDSCAPE', 'FLOOR_PLAN'].includes(category) || ['.jpg', '.jpeg', '.png', '.webp'].includes(fileExt)) {
      thumbnailPath = path.join(this.mediaDir, `${uniqueName}_thumb.webp`)
      await sharp(finalFilePath)
        .resize(320, 240, { fit: 'cover' })
        .toFormat('webp')
        .toFile(thumbnailPath)
    }

    // 4. Save metadata record to db
    const mediaRecord = await this.db.media.create({
      data: {
        projectId,
        category,
        originalName: path.basename(filePath),
        filePath: finalFilePath,
        thumbnailPath,
        tags: input.tags || '',
        sizeBytes,
        durationSecs,
      },
    })

    return mediaRecord
  }

  async list(projectId: string, category?: string) {
    return this.db.media.findMany({
      where: {
        projectId,
        ...(category ? { category } : {}),
      },
      orderBy: { sortOrder: 'asc' },
    })
  }

  async reorder(orderedIds: string[]) {
    await this.db.$transaction(
      orderedIds.map((id, index) =>
        this.db.media.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    )
    return { success: true }
  }

  async delete(id: string) {
    const record = await this.db.media.findUnique({ where: { id } })
    if (record) {
      // Delete local physical files
      if (fs.existsSync(record.filePath)) {
        fs.unlinkSync(record.filePath)
      }
      if (record.thumbnailPath && fs.existsSync(record.thumbnailPath)) {
        fs.unlinkSync(record.thumbnailPath)
      }
      await this.db.media.delete({ where: { id } })
    }
    return { success: true }
  }

  registerIpc() {
    ipcMain.handle(IPC_CHANNELS.MEDIA_UPLOAD, (_, data: any) => this.upload(data))
    ipcMain.handle(IPC_CHANNELS.MEDIA_LIST, (_, { projectId, category }: any) => this.list(projectId, category))
    ipcMain.handle(IPC_CHANNELS.MEDIA_REORDER, (_, orderedIds: string[]) => this.reorder(orderedIds))
    ipcMain.handle(IPC_CHANNELS.MEDIA_DELETE, (_, id: string) => this.delete(id))
  }
}
