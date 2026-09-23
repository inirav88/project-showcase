import { ipcMain } from 'electron'
import type { PrismaClient } from '@prisma/client/showcase-client'
import { IPC_CHANNELS } from '../channels'

export class ModuleHandlers {
  constructor(private db: PrismaClient) {}

  async list(projectId: string) {
    return this.db.projectModule.findMany({
      where: { projectId },
      orderBy: { sortOrder: 'asc' },
    })
  }

  async upsert(input: {
    id?: string
    projectId: string
    moduleType: string
    config: string
    sortOrder: number
    isVisible: boolean
  }) {
    if (input.id) {
      return this.db.projectModule.update({
        where: { id: input.id },
        data: input,
      })
    }
    return this.db.projectModule.create({
      data: input,
    })
  }

  async delete(id: string) {
    return this.db.projectModule.delete({
      where: { id },
    })
  }

  registerIpc() {
    ipcMain.handle(IPC_CHANNELS.MODULE_LIST, (_, projectId: string) => this.list(projectId))
    ipcMain.handle(IPC_CHANNELS.MODULE_UPSERT, (_, data: any) => this.upsert(data))
    ipcMain.handle(IPC_CHANNELS.MODULE_DELETE, (_, id: string) => this.delete(id))
  }
}

