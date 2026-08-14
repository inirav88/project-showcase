import { ipcMain, dialog } from 'electron'
import { IPC_CHANNELS } from '../channels'

export function registerDialogHandlers(): void {
  // Opens a native OS file picker and returns the selected absolute path (or null)
  ipcMain.handle(
    IPC_CHANNELS.DIALOG_OPEN_FILE,
    async (
      _,
      opts: { title?: string; filters?: { name: string; extensions: string[] }[] } = {}
    ) => {
      const result = await dialog.showOpenDialog({
        title: opts.title ?? 'Select File',
        properties: ['openFile'],
        filters: opts.filters ?? [{ name: 'All Files', extensions: ['*'] }]
      })
      return result.canceled ? null : result.filePaths[0]
    }
  )

  // Opens a native OS folder picker and returns the selected absolute path (or null)
  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_FOLDER, async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Folder',
      properties: ['openDirectory']
    })
    return result.canceled ? null : result.filePaths[0]
  })
}
