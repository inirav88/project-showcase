import type { BrowserWindowConstructorOptions } from 'electron'
import { join } from 'path'

export function kioskWindowOptions(isProduction: boolean): BrowserWindowConstructorOptions {
  return {
    fullscreen: true,
    kiosk: isProduction,
    frame: !isProduction,
    resizable: false,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: join(__dirname, '../../preload/index.js'),
    },
  }
}

export function adminWindowOptions(): BrowserWindowConstructorOptions {
  return {
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    frame: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, '../../preload/index.js'),
    },
  }
}
