import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { IpcChannel } from '../main/ipc/channels'

// Custom APIs for renderer
const api = {
  invoke: (channel: IpcChannel, ...args: unknown[]): Promise<unknown> =>
    ipcRenderer.invoke(channel, ...args),
  on: (channel: IpcChannel, cb: (...args: unknown[]) => void): (() => void) => {
    const sub = (_: Electron.IpcRendererEvent, ...a: unknown[]): void => cb(...a)
    ipcRenderer.on(channel, sub)
    return () => ipcRenderer.off(channel, sub)
  },
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
try {
  contextBridge.exposeInMainWorld('electron', electronAPI)
  contextBridge.exposeInMainWorld('api', api)
} catch (error) {
  console.error('Failed to expose APIs via contextBridge:', error)
  // Fallback if context isolation is disabled
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
