import { ipcMain } from 'electron'
import type { PrismaClient } from '@prisma/client/showcase-client'
import { IPC_CHANNELS } from '../channels'

export class SessionHandlers {
  constructor(private db: PrismaClient) {}

  async start(projectId: string, staffId?: string, personaMode?: string) {
    return this.db.sessionLog.create({
      data: {
        projectId,
        staffId: staffId || null,
        personaMode: personaMode || null,
        sectionsViewed: '[]',
        unitsShortlisted: '[]',
      },
    })
  }

  async end(id: string, sectionsViewed?: string[]) {
    const updateData: any = { endedAt: new Date() }
    if (sectionsViewed) {
      updateData.sectionsViewed = JSON.stringify(sectionsViewed)
    }
    return this.db.sessionLog.update({
      where: { id },
      data: updateData,
    })
  }

  async shortlist(id: string, unitIds: string[]) {
    return this.db.sessionLog.update({
      where: { id },
      data: {
        unitsShortlisted: JSON.stringify(unitIds),
      },
    })
  }

  async logList() {
    return this.db.sessionLog.findMany({
      include: {
        project: { select: { name: true } },
        staff: { select: { name: true } },
      },
      orderBy: { startedAt: 'desc' },
    })
  }

  registerIpc() {
    ipcMain.handle(IPC_CHANNELS.SESSION_START, (_, { projectId, staffId, personaMode }: any) =>
      this.start(projectId, staffId, personaMode)
    )
    ipcMain.handle(IPC_CHANNELS.SESSION_END, (_, { id, sectionsViewed }: any) =>
      this.end(id, sectionsViewed)
    )
    ipcMain.handle(IPC_CHANNELS.SESSION_SHORTLIST, (_, { id, unitIds }: any) =>
      this.shortlist(id, unitIds)
    )
    ipcMain.handle(IPC_CHANNELS.SESSION_LOG_LIST, () => this.logList())
  }
}

