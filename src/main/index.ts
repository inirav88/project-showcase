import { app, BrowserWindow, shell, protocol, net } from 'electron'
import { join } from 'path'
import { pathToFileURL } from 'url'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { kioskWindowOptions, adminWindowOptions } from './windows/kioskWindow'
import { getDb } from './db/client'
import { ModuleHandlers } from './ipc/handlers/modules'
import { ProjectHandlers } from './ipc/handlers/projects'
import { UnitHandlers } from './ipc/handlers/units'
import { MediaHandlers } from './ipc/handlers/media'
import { PdfHandlers } from './ipc/handlers/pdf'
import { SettingsHandlers } from './ipc/handlers/settings'
import { SessionHandlers } from './ipc/handlers/sessions'
import { LeadHandlers } from './ipc/handlers/leads'
import { registerDialogHandlers } from './ipc/handlers/dialog'

// Register privileged custom media scheme before app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: {
      secure: true,
      bypassCSP: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
])

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

    const settingsHandlers = new SettingsHandlers(db)
    settingsHandlers.registerIpc()

    const sessionHandlers = new SessionHandlers(db)
    sessionHandlers.registerIpc()

    const leadHandlers = new LeadHandlers(db)
    leadHandlers.registerIpc()

    // Register dialog (file picker) handlers — no DB dependency
    registerDialogHandlers()

    // Register file protocol handler for local media loading
    protocol.handle('media', (request) => {
      // request.url is e.g. "media://c%3A/Users/dazed/AppData/Local/..." or "media://C:/..."
      const urlPath = request.url.replace(/^\/?media:\/\//, '')
      const decodedPath = decodeURIComponent(urlPath)
      const fileUrl = pathToFileURL(decodedPath).toString()
      return net.fetch(fileUrl)
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
