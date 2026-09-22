import { app, BrowserWindow, ipcMain } from 'electron'
import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater'
import { is } from '@electron-toolkit/utils'
import { IPC_CHANNELS } from '../channels'

export type UpdaterStatus =
  | 'IDLE'
  | 'CHECKING'
  | 'AVAILABLE'
  | 'NOT_AVAILABLE'
  | 'DOWNLOADING'
  | 'DOWNLOADED'
  | 'ERROR'

export interface DownloadProgress {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

export interface UpdaterState {
  status: UpdaterStatus
  currentVersion: string
  updateInfo: UpdateInfo | null
  downloadProgress: DownloadProgress | null
  error: string | null
  lastCheckedAt: string | null
}

export class UpdaterHandlers {
  private state: UpdaterState = {
    status: 'IDLE',
    currentVersion: app.getVersion(),
    updateInfo: null,
    downloadProgress: null,
    error: null,
    lastCheckedAt: null,
  }

  constructor() {
    // Disable autoDownload so we can control or notify explicitly
    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true

    this.setupListeners()
  }

  private broadcastState() {
    const windows = BrowserWindow.getAllWindows()
    windows.forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send(IPC_CHANNELS.UPDATER_STATUS_CHANGED, this.state)
      }
    })
  }

  private broadcastProgress(progress: DownloadProgress) {
    const windows = BrowserWindow.getAllWindows()
    windows.forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send(IPC_CHANNELS.UPDATER_DOWNLOAD_PROGRESS, progress)
      }
    })
  }

  private setupListeners() {
    autoUpdater.on('checking-for-update', () => {
      this.state.status = 'CHECKING'
      this.state.error = null
      this.state.lastCheckedAt = new Date().toISOString()
      this.broadcastState()
    })

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      this.state.status = 'AVAILABLE'
      this.state.updateInfo = info
      this.state.error = null
      this.broadcastState()
    })

    autoUpdater.on('update-not-available', (info: UpdateInfo) => {
      this.state.status = 'NOT_AVAILABLE'
      this.state.updateInfo = info
      this.state.error = null
      this.broadcastState()
    })

    autoUpdater.on('download-progress', (progressObj: ProgressInfo) => {
      this.state.status = 'DOWNLOADING'
      const progress: DownloadProgress = {
        percent: Math.round(progressObj.percent),
        bytesPerSecond: progressObj.bytesPerSecond,
        transferred: progressObj.transferred,
        total: progressObj.total,
      }
      this.state.downloadProgress = progress
      this.broadcastProgress(progress)
    })

    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      this.state.status = 'DOWNLOADED'
      this.state.updateInfo = info
      this.state.error = null
      this.broadcastState()
    })

    autoUpdater.on('error', (err: Error) => {
      this.state.status = 'ERROR'
      this.state.error = err.message || 'Error occurred while checking for update'
      this.broadcastState()
    })
  }

  public registerIpc() {
    ipcMain.handle(IPC_CHANNELS.UPDATER_CHECK, async () => {
      return this.checkForUpdates()
    })

    ipcMain.handle(IPC_CHANNELS.UPDATER_QUIT_AND_INSTALL, () => {
      autoUpdater.quitAndInstall()
      return { success: true }
    })

    ipcMain.handle(IPC_CHANNELS.UPDATER_GET_STATUS, () => {
      return this.getStatus()
    })

    // Automatically check for updates on startup if in production
    if (!is.dev) {
      setTimeout(() => {
        this.checkForUpdates().catch((err) => {
          console.warn('[Updater] Auto update check failed:', err)
        })
      }, 5000)
    }
  }

  public async checkForUpdates() {
    if (is.dev) {
      // In dev mode, return friendly mock response if check fails
      try {
        await autoUpdater.checkForUpdates()
      } catch (err: any) {
        this.state.status = 'ERROR'
        this.state.error = `Dev Mode: Cannot check updates without dev update config (${err.message})`
        this.broadcastState()
      }
    } else {
      await autoUpdater.checkForUpdates()
    }
    return this.getStatus()
  }

  public getStatus(): UpdaterState {
    return { ...this.state, currentVersion: app.getVersion() }
  }
}
