import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { kioskWindowOptions, adminWindowOptions } from './windows/kioskWindow'
import { getDb } from './db/client'
import { ModuleHandlers } from './ipc/handlers/modules'
import { ProjectHandlers } from './ipc/handlers/projects'
import { UnitHandlers } from './ipc/handlers/units'
import { MediaHandlers } from './ipc/handlers/media'
import { PdfHandlers } from './ipc/handlers/pdf'

const isProd = !is.dev

let kioskWin: BrowserWindow | null = null
let adminWin: BrowserWindow | null = null

function createWindows(): void {
  const preloadKioskPath = join(__dirname, '../preload/index.js')
  console.log('--- SHOWCASEOS PRELOAD PATHS ---')
  console.log('Preload Kiosk Path:', preloadKioskPath)
  console.log('Preload exists:', require('fs').existsSync(preloadKioskPath))
  console.log('--- SHOWCASEOS PRELOAD PATHS ---')

  kioskWin = new BrowserWindow(kioskWindowOptions(isProd))
  adminWin = new BrowserWindow(adminWindowOptions())

  kioskWin.on('ready-to-show', () => {
    kioskWin?.show()
    kioskWin?.webContents.openDevTools()
  })
  adminWin.on('ready-to-show', () => {
    adminWin?.show()
    adminWin?.webContents.openDevTools()
  })

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
    const appDataPath = app.getPath('userData')

    // Instantiate and register handler namespaces
    const moduleHandlers = new ModuleHandlers(db)
    moduleHandlers.registerIpc()

    const projectHandlers = new ProjectHandlers(db)
    projectHandlers.registerIpc()

    const unitHandlers = new UnitHandlers(db)
    unitHandlers.registerIpc()

    const mediaHandlers = new MediaHandlers(db, appDataPath)
    mediaHandlers.registerIpc()

    const pdfHandlers = new PdfHandlers(db)
    pdfHandlers.registerIpc()

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
