import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { kioskWindowOptions, adminWindowOptions } from './windows/kioskWindow'
import { getDb } from './db/client'
import { ModuleHandlers } from './ipc/handlers/modules'
import { IPC_CHANNELS } from './ipc/channels'

const isProd = !is.dev

let kioskWin: BrowserWindow | null = null
let adminWin: BrowserWindow | null = null

function createWindows(): void {
  kioskWin = new BrowserWindow(kioskWindowOptions(isProd))
  adminWin = new BrowserWindow(adminWindowOptions())

  kioskWin.on('ready-to-show', () => kioskWin?.show())
  adminWin.on('ready-to-show', () => adminWin?.show())

  kioskWin.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    kioskWin.loadURL(process.env['ELECTRON_RENDERER_URL'] + '#/kiosk')
    adminWin.loadURL(process.env['ELECTRON_RENDERER_URL'] + '#/admin')
  } else {
    kioskWin.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/kiosk' })
    adminWin.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/admin' })
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.nirav.showcaseos')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize DB and register IPC handlers
  try {
    const db = await getDb()

    // Module handlers
    const moduleHandlers = new ModuleHandlers(db)
    moduleHandlers.registerIpc()

    // Baseline Project listing IPC handlers
    ipcMain.handle(IPC_CHANNELS.PROJECT_LIST, async () => {
      return db.project.findMany({
        orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
      })
    })

    ipcMain.handle(IPC_CHANNELS.PROJECT_GET, async (_, id: string) => {
      return db.project.findUnique({
        where: { id },
      })
    })

  } catch (error) {
    console.error('Failed to initialize database and IPC handlers:', error)
    process.exit(1)
  }

  createWindows()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindows()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
