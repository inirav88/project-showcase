/// <reference types="vite/client" />

interface Window {
  api: {
    invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
    on: (channel: string, cb: (...args: unknown[]) => void) => () => void
  }
  electron: {
    ipcRenderer: {
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
    }
  }
}
