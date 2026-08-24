import { ipcMain, dialog } from 'electron'
import type { PrismaClient } from '@prisma/client/showcase-client'
import { IPC_CHANNELS } from '../channels'
import path from 'path'
import fs from 'fs'
import os from 'os'
import archiver from 'archiver'
import AdmZip from 'adm-zip'

export class UsbHandlers {
  constructor(
    private db: PrismaClient,
    private appDataPath: string,
    private dbPath: string,
  ) {}

  // --- EXPORT --------------------------------------------------------------

  async exportPackage() {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Export ShowcaseOS Backup',
      defaultPath: path.join(
        os.homedir(),
        `showcaseos_backup_${new Date().toISOString().slice(0, 10)}.zip`,
      ),
      filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
    })
    if (!filePath) return { success: false, reason: 'Cancelled' }

    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(filePath)
      const archive = archiver('zip', { zlib: { level: 6 } })
      archive.on('error', reject)
      output.on('close', resolve)
      archive.pipe(output)

      if (fs.existsSync(this.dbPath)) {
        archive.file(this.dbPath, { name: 'showcaseos.db' })
      }
      const mediaDir = path.join(this.appDataPath, 'media')
      if (fs.existsSync(mediaDir)) {
        archive.directory(mediaDir, 'media')
      }

      archive.finalize()
    })

    try {
      await this.db.settings.upsert({
        where: { id: 1 },
        update: { lastBackupAt: new Date() },
        create: { id: 1, lastBackupAt: new Date() },
      })
    } catch (_) { /* ignore */ }

    return { success: true, filePath }
  }

  // --- IMPORT (SAFE: auto-backup before overwrite) -------------------------

  async importPackage() {
    const { filePaths } = await dialog.showOpenDialog({
      title: 'Import ShowcaseOS Backup Package',
      filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
      properties: ['openFile'],
    })
    if (!filePaths || filePaths.length === 0) return { success: false, reason: 'Cancelled' }

    const zipPath = filePaths[0]
    let zip: AdmZip
    try {
      zip = new AdmZip(zipPath)
    } catch {
      return { success: false, reason: 'Invalid or corrupted ZIP file' }
    }

    const entries = zip.getEntries().map((e) => e.entryName)
    if (!entries.some((e) => e === 'showcaseos.db')) {
      return { success: false, reason: 'Invalid backup: showcaseos.db not found inside the ZIP' }
    }

    // -- SAFETY STEP: auto-backup current data before overwriting ----------
    const safetyBackupPath = path.join(
      os.homedir(),
      `showcaseos_BEFORE_IMPORT_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.zip`,
    )
    try {
      await new Promise<void>((resolve, reject) => {
        const output = fs.createWriteStream(safetyBackupPath)
        const archive = archiver('zip', { zlib: { level: 5 } })
        archive.on('error', reject)
        output.on('close', resolve)
        archive.pipe(output)
        if (fs.existsSync(this.dbPath)) archive.file(this.dbPath, { name: 'showcaseos.db' })
        const mediaDir = path.join(this.appDataPath, 'media')
        if (fs.existsSync(mediaDir)) archive.directory(mediaDir, 'media')
        archive.finalize()
      })
    } catch (err) {
      // Safety backup failed — abort import, don't touch anything
      return {
        success: false,
        reason: `Safety backup failed before import. Import aborted. No data was changed. (${String(err)})`,
      }
    }

    // -- EXTRACT DB --------------------------------------------------------
    const dbDir = path.dirname(this.dbPath)
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })
    const dbEntry = zip.getEntry('showcaseos.db')
    if (dbEntry) fs.writeFileSync(this.dbPath, dbEntry.getData())

    // -- EXTRACT MEDIA -----------------------------------------------------
    const mediaEntries = entries.filter((e) => e.startsWith('media/'))
    for (const entry of mediaEntries) {
      const outPath = path.join(this.appDataPath, entry)
      const outDir = path.dirname(outPath)
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
      const entryObj = zip.getEntry(entry)
      if (entryObj && !entryObj.isDirectory) {
        fs.writeFileSync(outPath, entryObj.getData())
      }
    }

    return {
      success: true,
      importedEntries: entries.length,
      safetyBackupPath,
      message: `Import complete. Your previous data was auto-backed up to: ${safetyBackupPath}`,
    }
  }

  registerIpc() {
    ipcMain.handle(IPC_CHANNELS.EXPORT_USB_PACKAGE, () => this.exportPackage())
    ipcMain.handle(IPC_CHANNELS.IMPORT_USB_PACKAGE, () => this.importPackage())
  }
}

