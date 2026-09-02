import { ipcMain } from 'electron'
import type { PrismaClient } from '@prisma/client/showcase-client'
import { IPC_CHANNELS } from '../channels'
import crypto from 'crypto'

export class StaffHandlers {
  constructor(private db: PrismaClient) {}

  async ensureSuperadmin() {
    const existing = await this.db.staffProfile.findMany()
    const superadmin = existing.find((s) => s.role === 'SUPERADMIN')
    if (!superadmin) {
      if (existing.length > 0) {
        // Upgrade the first profile to SUPERADMIN
        await this.db.staffProfile.update({
          where: { id: existing[0].id },
          data: { role: 'SUPERADMIN' }
        })
      } else {
        // Create default Superadmin account
        const pinHash = crypto.createHash('sha256').update('0000').digest('hex')
        await this.db.staffProfile.create({
          data: {
            name: 'Super Admin',
            role: 'SUPERADMIN',
            pinHash,
            isActive: true
          }
        })
      }
    }
  }

  async list() {
    await this.ensureSuperadmin()
    return this.db.staffProfile.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }

  async create(data: { name: string; pin: string; email?: string; phone?: string; role?: string }) {
    const pinHash = crypto.createHash('sha256').update(data.pin || '0000').digest('hex')
    return this.db.staffProfile.create({
      data: {
        name: data.name,
        email: data.email || '',
        phone: data.phone || '',
        pinHash,
        role: data.role || 'AGENT',
        isActive: true
      },
    })
  }

  async update(data: { id: string; name?: string; email?: string; phone?: string; pin?: string; role?: string; isActive?: boolean }) {
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.email !== undefined) updateData.email = data.email
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.role !== undefined) updateData.role = data.role
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.pin) {
      updateData.pinHash = crypto.createHash('sha256').update(data.pin).digest('hex')
    }

    return this.db.staffProfile.update({
      where: { id: data.id },
      data: updateData
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
    const isValid = hash === staff.pinHash
    return isValid ? { valid: true, staff } : false
  }

  async remove(id: string) {
    return this.db.staffProfile.delete({ where: { id } })
  }

  registerIpc() {
    ipcMain.handle(IPC_CHANNELS.STAFF_LIST, () => this.list())
    ipcMain.handle(IPC_CHANNELS.STAFF_CREATE, (_, data: any) => this.create(data))
    ipcMain.handle(IPC_CHANNELS.STAFF_UPDATE, (_, data: any) => this.update(data))
    ipcMain.handle(IPC_CHANNELS.STAFF_TOGGLE_ACTIVE, (_, id: string) => this.toggleActive(id))
    ipcMain.handle(IPC_CHANNELS.STAFF_VERIFY_PIN, (_, { id, pin }: any) => this.verifyPin(id, pin))
    ipcMain.handle(IPC_CHANNELS.STAFF_DELETE, (_, id: string) => this.remove(id))
  }
}

