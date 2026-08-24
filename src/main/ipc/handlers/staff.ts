import { ipcMain } from 'electron'
import type { PrismaClient } from '@prisma/client/showcase-client'
import { IPC_CHANNELS } from '../channels'
import crypto from 'crypto'

export class StaffHandlers {
  constructor(private db: PrismaClient) {}

  async list() {
    return this.db.staffProfile.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }

  async create(data: { name: string; pin: string }) {
    const pinHash = crypto.createHash('sha256').update(data.pin).digest('hex')
    return this.db.staffProfile.create({
      data: {
        name: data.name,
        pinHash,
      },
    })
  }

  async toggleActive(id: string) {
    const current = await this.db.staffProfile.findUnique({ where: { id } })
    if (!current) throw new Error('Staff member not found')
    return this.db.staffProfile.update({
      where: { id },
      data: { isActive: !current.isActive },
    })
  }

  async verifyPin(id: string, pin: string) {
    const staff = await this.db.staffProfile.findUnique({ where: { id } })
    if (!staff || !staff.isActive) return false
    const hash = crypto.createHash('sha256').update(pin).digest('hex')
    return hash === staff.pinHash
  }

  async remove(id: string) {
    return this.db.staffProfile.delete({ where: { id } })
  }

  registerIpc() {
    ipcMain.handle(IPC_CHANNELS.STAFF_LIST, () => this.list())
    ipcMain.handle(IPC_CHANNELS.STAFF_CREATE, (_, data: any) => this.create(data))
    ipcMain.handle(IPC_CHANNELS.STAFF_TOGGLE_ACTIVE, (_, id: string) => this.toggleActive(id))
    ipcMain.handle(IPC_CHANNELS.STAFF_VERIFY_PIN, (_, { id, pin }: any) => this.verifyPin(id, pin))
    ipcMain.handle(IPC_CHANNELS.STAFF_DELETE, (_, id: string) => this.remove(id))
  }
}

