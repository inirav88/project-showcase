import { ipcMain } from 'electron'
import type { PrismaClient } from '@prisma/client'
import { IPC_CHANNELS } from '../channels'

export class LeadHandlers {
  constructor(private db: PrismaClient) {}

  async create(data: any) {
    return this.db.lead.create({
      data: {
        interestedProjectId: data.projectId || null,
        name: data.name,
        phone: data.phone,
        email: data.email || '',
        budgetMin: data.budgetMin !== undefined ? Number(data.budgetMin) : null,
        budgetMax: data.budgetMax !== undefined ? Number(data.budgetMax) : null,
        notes: data.notes || '',
      },
    })
  }

  async list() {
    return this.db.lead.findMany({
      include: {
        project: { select: { name: true } },
      },
      orderBy: { capturedAt: 'desc' },
    })
  }

  registerIpc() {
    ipcMain.handle(IPC_CHANNELS.LEAD_CREATE, (_, data: any) => this.create(data))
    ipcMain.handle(IPC_CHANNELS.LEAD_LIST, () => this.list())
  }
}
