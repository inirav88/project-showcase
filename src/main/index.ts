import { app, BrowserWindow, shell, protocol, net, Menu, MenuItemConstructorOptions } from 'electron'
import path, { join } from 'path'
import fs from 'fs'
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
import { StaffHandlers } from './ipc/handlers/staff'
import { AppointmentHandlers } from './ipc/handlers/appointments'
import { UsbHandlers } from './ipc/handlers/usb'
import { SyncHandlers } from './ipc/handlers/sync'
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

  // Set custom application menu
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'Showcase OS',
      submenu: [
        { role: 'quit', label: 'Exit Showcase OS' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ]
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  // Initialize DB and register IPC handlers
  try {
    const db = await getDb()
    const appDataPath = app.getPath('userData')
    const isDev = !isProd
    const dbPath = isDev
      ? path.join(process.cwd(), 'dev.db')
      : path.join(appDataPath, 'showcaseos.db')

    // Instantiate and register handler namespaces
    new ModuleHandlers(db).registerIpc()
    new ProjectHandlers(db).registerIpc()
    new UnitHandlers(db).registerIpc()
    new MediaHandlers(db, appDataPath).registerIpc()
    new PdfHandlers(db).registerIpc()
    new SettingsHandlers(db).registerIpc()
    new SessionHandlers(db).registerIpc()
    new LeadHandlers(db).registerIpc()
    new StaffHandlers(db).registerIpc()
    new AppointmentHandlers(db).registerIpc()
    new UsbHandlers(db, appDataPath, dbPath).registerIpc()
    new SyncHandlers(db).registerIpc()

    // Register dialog (file picker) handlers — no DB dependency
    registerDialogHandlers()

    // Register file protocol handler for local media loading.
    protocol.handle('media', (request) => {
      const parsed = new URL(request.url)
      let filePath = decodeURIComponent(parsed.pathname)
      const host = decodeURIComponent(parsed.host)

      if (host && /^[A-Za-z]:?$/.test(host)) {
        const drive = host.endsWith(':') ? host : host + ':'
        filePath = drive + filePath
      } else if (process.platform === 'win32' && /^\/[A-Za-z]:/.test(filePath)) {
        filePath = filePath.slice(1)
      }

      const normalizedPath = path.normalize(filePath)
      if (!fs.existsSync(normalizedPath)) {
        console.warn(`[Media Protocol] WARNING: File does not exist at: ${normalizedPath}`)
      }
      return net.fetch(pathToFileURL(normalizedPath).toString())
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
