import { ipcMain, dialog, app } from 'electron'
import type { PrismaClient } from '@prisma/client/showcase-client'
import { IPC_CHANNELS } from '../channels'
import path from 'path'
import fs from 'fs'
import archiver from 'archiver'
import extract from 'extract-zip'

export class BackupHandlers {
  private mediaDir: string
  private dbPath: string

  constructor(private db: PrismaClient, appDataPath: string) {
    this.mediaDir = path.join(appDataPath, 'media')
    
    // Determine the path to the database
    const isDev = !app.isPackaged
    this.dbPath = isDev
      ? path.join(process.cwd(), 'dev.db')
      : path.join(app.getPath('userData'), 'showcaseos.db')
  }

  async exportBackup(window?: Electron.BrowserWindow) {
    if (!window) throw new Error('No window provided for dialog')

    const result = await dialog.showSaveDialog(window, {
      title: 'Export USB Backup Package',
      defaultPath: `ShowcaseOS_Backup_${new Date().toISOString().split('T')[0]}.zip`,
      filters: [{ name: 'Zip Archives', extensions: ['zip'] }],
      properties: ['createDirectory']
    })

    if (result.canceled || !result.filePath) return { success: false, reason: 'Export canceled' }

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(result.filePath!)
      const archive = archiver('zip', { zlib: { level: 9 } })

      output.on('close', () => {
        resolve({ success: true, filePath: result.filePath })
      })

      archive.on('error', (err) => {
        reject(err)
      })

      archive.pipe(output)

      // Add database
      if (fs.existsSync(this.dbPath)) {
        archive.file(this.dbPath, { name: 'database.db' })
      }

      // Add media folder
      if (fs.existsSync(this.mediaDir)) {
        archive.directory(this.mediaDir, 'media')
      }

      archive.finalize()
    })
  }

  async importBackup(window?: Electron.BrowserWindow) {
    if (!window) throw new Error('No window provided for dialog')

    const result = await dialog.showOpenDialog(window, {
      title: 'Import USB Backup Package',
      filters: [{ name: 'Zip Archives', extensions: ['zip'] }],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) return { success: false, reason: 'Import canceled' }

    const zipPath = result.filePaths[0]
    
    // Create a temporary extraction directory
    const tempDir = path.join(app.getPath('temp'), `showcaseos_import_${Date.now()}`)
    
    try {
      // 1. Extract zip to temp directory
      await extract(zipPath, { dir: tempDir })

      // 2. Validate contents
      const extractedDbPath = path.join(tempDir, 'database.db')
      const extractedMediaDir = path.join(tempDir, 'media')

      if (!fs.existsSync(extractedDbPath)) {
        throw new Error('Invalid backup package: missing database.db')
      }

      // 3. Disconnect active database connection, clean WAL/SHM artifacts, and safely replace database
      try {
        await this.db.$disconnect()
      } catch (err) {
        console.warn('[BackupRestore] Notice during DB disconnect:', err)
      }

      // Remove potential WAL / SHM write-ahead logs to avoid database state sync mismatch
      const walPath = `${this.dbPath}-wal`
      const shmPath = `${this.dbPath}-shm`
      if (fs.existsSync(walPath)) fs.rmSync(walPath, { force: true })
      if (fs.existsSync(shmPath)) fs.rmSync(shmPath, { force: true })

      fs.copyFileSync(extractedDbPath, this.dbPath)

      // Reconnect database client
      try {
        await this.db.$connect()
      } catch (err) {
        console.warn('[BackupRestore] Notice during DB reconnect:', err)
      }

      // 4. Replace media folder
      if (fs.existsSync(extractedMediaDir)) {
        // Clear existing media
        if (fs.existsSync(this.mediaDir)) {
          fs.rmSync(this.mediaDir, { recursive: true, force: true })
        }
        // Copy new media
        fs.cpSync(extractedMediaDir, this.mediaDir, { recursive: true })
      }

      // Clean up temp dir
      fs.rmSync(tempDir, { recursive: true, force: true })

      return { success: true, message: 'Backup restored successfully. Please restart the application.' }
    } catch (err: any) {
      // Clean up temp dir on error
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true })
      }
      throw err
    }
  }

  registerIpc() {
    ipcMain.handle(IPC_CHANNELS.EXPORT_USB_PACKAGE, (e) => {
      const window = require('electron').BrowserWindow.fromWebContents(e.sender)
      return this.exportBackup(window || undefined)
    })
    ipcMain.handle(IPC_CHANNELS.IMPORT_USB_PACKAGE, (e) => {
      const window = require('electron').BrowserWindow.fromWebContents(e.sender)
      return this.importBackup(window || undefined)
    })
  }
}

