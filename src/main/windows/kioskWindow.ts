import type { BrowserWindowConstructorOptions } from 'electron'
import { join } from 'path'

const iconPath = join(__dirname, '../../build/icon.png')

export function kioskWindowOptions(isProduction: boolean): BrowserWindowConstructorOptions {
  return {
    fullscreen: true,
    autoHideMenuBar: true,
    kiosk: isProduction,
    frame: !isProduction,
    resizable: false,
    show: false,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: join(__dirname, '../preload/index.js'),
    },
  }
}

export function adminWindowOptions(): BrowserWindowConstructorOptions {
  return {
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    autoHideMenuBar: true,
    frame: true,
    show: false,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: join(__dirname, '../preload/index.js'),
    },
  }
}
