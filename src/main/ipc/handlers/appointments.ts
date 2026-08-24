import { ipcMain } from 'electron'
import type { PrismaClient } from '@prisma/client/showcase-client'
import { IPC_CHANNELS } from '../channels'

export class AppointmentHandlers {
  constructor(private db: PrismaClient) {}

  async list() {
    return this.db.appointmentSlot.findMany({
      orderBy: { scheduledAt: 'asc' },
    })
  }

  async create(data: { clientName: string; scheduledAt: string; projectId?: string; notes?: string }) {
    return this.db.appointmentSlot.create({
      data: {
        clientName: data.clientName,
        scheduledAt: new Date(data.scheduledAt),
        projectId: data.projectId || '',
        notes: data.notes || '',
      },
    })
  }

  async remove(id: string) {
    return this.db.appointmentSlot.delete({ where: { id } })
  }

  /**
   * Find an appointment within ±15 minutes of now for a given project.
   * Used to personalise the kiosk welcome screen.
   */
  async findUpcoming(projectId: string) {
    const now = new Date()
    const windowMs = 15 * 60 * 1000
    const from = new Date(now.getTime() - windowMs)
    const to = new Date(now.getTime() + windowMs)
    const appointments = await this.db.appointmentSlot.findMany({
      where: {
        scheduledAt: { gte: from, lte: to },
      },
    })
    // Prefer exact project match, fallback to any appointment in window
    return appointments.find((a) => a.projectId === projectId) || appointments[0] || null
  }

  registerIpc() {
    ipcMain.handle(IPC_CHANNELS.APPOINTMENT_LIST, () => this.list())
    ipcMain.handle(IPC_CHANNELS.APPOINTMENT_CREATE, (_, data: any) => this.create(data))
    ipcMain.handle(IPC_CHANNELS.APPOINTMENT_DELETE, (_, id: string) => this.remove(id))
    ipcMain.handle(IPC_CHANNELS.APPOINTMENT_FIND_UPCOMING, (_, projectId: string) =>
      this.findUpcoming(projectId)
    )
  }
}

