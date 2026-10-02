import { ipcMain } from 'electron'
import type { PrismaClient } from '@prisma/client/showcase-client'
import { IPC_CHANNELS } from '../channels'
import crypto from 'crypto'
import { PinRateLimiter, timingSafeHashVerify, hashPin } from '../../security/authGuard'

export class StaffHandlers {
  private rateLimiter = new PinRateLimiter(5, 30000)

  constructor(private db: PrismaClient) {}

  hashPin(pin: string): string {
    return hashPin(pin)
  }

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
        const pinHash = hashPin('0000')
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
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async create(data: { name: string; pin: string; email?: string; phone?: string; role?: string }) {
    const pinHash = hashPin(data.pin || '0000')
    const created = await this.db.staffProfile.create({
      data: {
        name: data.name,
        email: data.email || '',
        phone: data.phone || '',
        pinHash,
        role: data.role || 'AGENT',
        isActive: true
      },
    })
    const { pinHash: _, ...safeProfile } = created
    return safeProfile
  }

  async update(data: { id: string; name?: string; email?: string; phone?: string; pin?: string; role?: string; isActive?: boolean }) {
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.email !== undefined) updateData.email = data.email
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.role !== undefined) updateData.role = data.role
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.pin) {
      updateData.pinHash = hashPin(data.pin)
    }

    const updated = await this.db.staffProfile.update({
      where: { id: data.id },
      data: updateData
    })
    const { pinHash: _, ...safeProfile } = updated
    return safeProfile
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
    const lock = this.rateLimiter.isLocked()
    if (lock.locked) {
      return {
        valid: false,
        locked: true,
        reason: `Too many failed attempts. Try again in ${lock.remainingSec}s.`,
      }
    }

    const staff = await this.db.staffProfile.findUnique({ where: { id } })
    if (!staff || !staff.isActive) {
      this.rateLimiter.recordFailure()
      return false
    }

    const isValid = timingSafeHashVerify(pin, staff.pinHash)
    if (isValid) {
      this.rateLimiter.recordSuccess()
      const { pinHash: _, ...safeStaff } = staff
      return { valid: true, staff: safeStaff }
    }

    const failureLock = this.rateLimiter.recordFailure()
    if (failureLock.locked) {
      return {
        valid: false,
        locked: true,
        reason: `Too many failed attempts. Try again in ${failureLock.remainingSec}s.`,
      }
    }

    return false
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

