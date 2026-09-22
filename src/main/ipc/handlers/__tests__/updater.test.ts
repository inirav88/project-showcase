import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('electron', () => ({
  app: {
    getVersion: vi.fn().mockReturnValue('0.0.1')
  },
  BrowserWindow: {
    getAllWindows: vi.fn().mockReturnValue([])
  },
  ipcMain: {
    handle: vi.fn()
  }
}))

vi.mock('electron-updater', () => {
  const listeners: Record<string, Function[]> = {}
  return {
    autoUpdater: {
      autoDownload: true,
      autoInstallOnAppQuit: true,
      on: vi.fn((event: string, cb: Function) => {
        if (!listeners[event]) listeners[event] = []
        listeners[event].push(cb)
      }),
      checkForUpdates: vi.fn().mockResolvedValue({}),
      quitAndInstall: vi.fn(),
      __emit: (event: string, data?: any) => {
        if (listeners[event]) {
          listeners[event].forEach((fn) => fn(data))
        }
      }
    }
  }
})

vi.mock('@electron-toolkit/utils', () => ({
  is: {
    dev: true
  }
}))

import { UpdaterHandlers } from '../updater'
import { IPC_CHANNELS } from '../../channels'
import { ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'

describe('UpdaterHandlers', () => {
  let handlers: UpdaterHandlers

  beforeEach(() => {
    vi.clearAllMocks()
    handlers = new UpdaterHandlers()
  })

  it('initializes with IDLE state and app version', () => {
    const status = handlers.getStatus()
    expect(status.status).toBe('IDLE')
    expect(status.currentVersion).toBe('0.0.1')
    expect(status.error).toBeNull()
  })

  it('registers IPC handlers for check, quitAndInstall, and getStatus', () => {
    handlers.registerIpc()
    expect(ipcMain.handle).toHaveBeenCalledWith(IPC_CHANNELS.UPDATER_CHECK, expect.any(Function))
    expect(ipcMain.handle).toHaveBeenCalledWith(IPC_CHANNELS.UPDATER_QUIT_AND_INSTALL, expect.any(Function))
    expect(ipcMain.handle).toHaveBeenCalledWith(IPC_CHANNELS.UPDATER_GET_STATUS, expect.any(Function))
  })

  it('updates state on checking-for-update event', () => {
    ;(autoUpdater as any).__emit('checking-for-update')
    const status = handlers.getStatus()
    expect(status.status).toBe('CHECKING')
    expect(status.lastCheckedAt).not.toBeNull()
  })

  it('updates state on update-available event', () => {
    const info = { version: '0.0.2', releaseNotes: 'New feature release' }
    ;(autoUpdater as any).__emit('update-available', info)
    const status = handlers.getStatus()
    expect(status.status).toBe('AVAILABLE')
    expect(status.updateInfo).toEqual(info)
  })

  it('updates state on download-progress event', () => {
    const prog = { percent: 45.6, bytesPerSecond: 1048576, transferred: 4500000, total: 10000000 }
    ;(autoUpdater as any).__emit('download-progress', prog)
    const status = handlers.getStatus()
    expect(status.status).toBe('DOWNLOADING')
    expect(status.downloadProgress).toEqual({
      percent: 46,
      bytesPerSecond: 1048576,
      transferred: 4500000,
      total: 10000000
    })
  })

  it('updates state on update-downloaded event', () => {
    const info = { version: '0.0.2' }
    ;(autoUpdater as any).__emit('update-downloaded', info)
    const status = handlers.getStatus()
    expect(status.status).toBe('DOWNLOADED')
    expect(status.updateInfo).toEqual(info)
  })

  it('updates state on error event', () => {
    ;(autoUpdater as any).__emit('error', new Error('Network connection timeout'))
    const status = handlers.getStatus()
    expect(status.status).toBe('ERROR')
    expect(status.error).toContain('Network connection timeout')
  })
})
