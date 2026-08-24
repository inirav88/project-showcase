import { app, BrowserWindow, shell, protocol, net, Menu, MenuItemConstructorOptions, ipcMain, screen } from 'electron'
import path, { join } from 'path'
import fs from 'fs'
import { pathToFileURL } from 'url'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { kioskWindowOptions } from './windows/kioskWindow'
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

if (is.dev) {
  app.commandLine.appendSwitch('disable-http-cache')
  app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')
}

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
let presenterWin: BrowserWindow | null = null

function createWindows(): void {
  kioskWin = new BrowserWindow(kioskWindowOptions(isProd))

  kioskWin.on('ready-to-show', () => kioskWin?.show())

  kioskWin.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    kioskWin.loadURL(process.env['ELECTRON_RENDERER_URL'] + '#/kiosk')
  } else {
    kioskWin.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/kiosk' })
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.nirav.showcaseos')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Set custom application menu (disabled in production so Alt key does not trigger menu bar)
  if (isProd) {
    Menu.setApplicationMenu(null)
  } else {
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
  }

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

    // Register dialog (file picker) handlers � no DB dependency
    registerDialogHandlers()

    // Register system:secondDisplay IPC handler for presenter console
    ipcMain.handle('system:secondDisplay', async (_, data: any) => {
      const { action, projectId, moduleId, moduleType } = data || {}

      if (action === 'open') {
        if (presenterWin) {
          presenterWin.focus()
          return { success: true, alreadyOpen: true }
        }

        const displays = screen.getAllDisplays()
        const externalDisplay = displays.find((display) => {
          return display.bounds.x !== 0 || display.bounds.y !== 0
        })

        // Create presenter console window
        presenterWin = new BrowserWindow({
          width: 1100,
          height: 750,
          autoHideMenuBar: true,
          title: 'Sales Presenter Control Console',
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: join(__dirname, '../preload/index.js'),
          }
        })

        // If an external display is detected, put the Kiosk window on it fullscreen
        // and keep the presenter console on the laptop (primary display)
        if (externalDisplay && kioskWin) {
          kioskWin.setFullScreen(false)
          kioskWin.setBounds(externalDisplay.bounds)
          kioskWin.setFullScreen(true)

          const primaryDisplay = screen.getPrimaryDisplay()
          presenterWin.setBounds({
            x: primaryDisplay.bounds.x + 100,
            y: primaryDisplay.bounds.y + 100,
            width: 1100,
            height: 750
          })
        }

        presenterWin.on('closed', () => {
          presenterWin = null
          // Return kiosk window to primary monitor when presenter window closes
          if (kioskWin) {
            const primaryDisplay = screen.getPrimaryDisplay()
            kioskWin.setFullScreen(false)
            kioskWin.setBounds(primaryDisplay.bounds)
            kioskWin.setFullScreen(true)
          }
        })

        if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
          presenterWin.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/kiosk/presenter/${projectId}`)
        } else {
          presenterWin.loadFile(join(__dirname, '../renderer/index.html'), { hash: `/kiosk/presenter/${projectId}` })
        }

        return { success: true }
      }

      if (action === 'navigate') {
        if (kioskWin && moduleId) {
          kioskWin.webContents.send('system:navigateToModule', moduleId)
        }
        return { success: true }
      }

      if (action === 'sync') {
        if (presenterWin && moduleType) {
          presenterWin.webContents.send('system:kioskNavigated', moduleType)
        }
        return { success: true }
      }

      return { success: false, reason: 'Invalid action' }
    })

    // Helper to resolve MIME types for the media protocol.
    const getMimeType = (filePath: string): string => {
      const ext = path.extname(filePath).toLowerCase()
      switch (ext) {
        case '.mp4': return 'video/mp4'
        case '.webm': return 'video/webm'
        case '.m4a': return 'audio/mp4'
        case '.mp3': return 'audio/mpeg'
        case '.wav': return 'audio/wav'
        case '.jpg':
        case '.jpeg': return 'image/jpeg'
        case '.png': return 'image/png'
        case '.webp': return 'image/webp'
        case '.svg': return 'image/svg+xml'
        case '.pdf': return 'application/pdf'
        default: return 'application/octet-stream'
      }
    }

    // Register file protocol handler with full support for Range/Partial requests (FR-8).
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
        return new Response("File not found", { status: 404 })
      }

      const stat = fs.statSync(normalizedPath)
      const fileSize = stat.size
      const range = request.headers.get('range')

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-")
        const start = parseInt(parts[0], 10)
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
        const chunksize = (end - start) + 1

        const fileStream = fs.createReadStream(normalizedPath, { start, end })
        return new Response(fileStream as any, {
          status: 206,
          statusText: 'Partial Content',
          headers: {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize.toString(),
            'Content-Type': getMimeType(normalizedPath)
          }
        })
      } else {
        const fileStream = fs.createReadStream(normalizedPath)
        return new Response(fileStream as any, {
          status: 200,
          headers: {
            'Content-Length': fileSize.toString(),
            'Content-Type': getMimeType(normalizedPath)
          }
        })
      }
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






