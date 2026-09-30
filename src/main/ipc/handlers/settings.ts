import { ipcMain } from 'electron'
import type { PrismaClient } from '@prisma/client/showcase-client'
import { IPC_CHANNELS } from '../channels'
import crypto from 'crypto'
import { PinRateLimiter, timingSafeHashVerify, hashPin } from '../../security/authGuard'

export class SettingsHandlers {
  private rateLimiter = new PinRateLimiter(5, 30000)

  constructor(private db: PrismaClient) {}

  async get() {
    const res = await this.db.settings.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        firmName: 'Nirav Real Estate',
        disclaimerText: 'RERA registered. Prices are indicative and subject to change. E&OE.',
        showExitButton: true,
        exitRequiresPin: false,
      },
    })
    return {
      ...res,
      showExitButton: (res as any).showExitButton === false || (res as any).showExitButton === 0 ? false : true,
      exitRequiresPin: Boolean((res as any).exitRequiresPin),
      isDefaultPin: !res.adminPinHash,
      hasCustomPin: Boolean(res.adminPinHash),
    }
  }

  async set(data: any) {
    const { adminPin, ...rest } = data
    const updateData: any = { ...rest }
    if (adminPin) {
      updateData.adminPinHash = hashPin(adminPin)
    }
    return this.db.settings.update({
      where: { id: 1 },
      data: updateData,
    })
  }

  async verifyPin(pin: string) {
    const lock = this.rateLimiter.isLocked()
    if (lock.locked) {
      return {
        valid: false,
        locked: true,
        reason: `Too many failed attempts. Try again in ${lock.remainingSec}s.`,
      }
    }

    const s = await this.db.settings.findUnique({ where: { id: 1 } })
    if (!s) {
      this.rateLimiter.recordFailure()
      return false
    }

    const expectedHash = s.adminPinHash || hashPin('0000')
    const matchesAdmin = timingSafeHashVerify(pin, expectedHash)

    if (matchesAdmin) {
      this.rateLimiter.recordSuccess()
      if (!s.adminPinHash) {
        console.warn('[Security] Admin action authenticated with default fallback PIN (0000). Setting a custom PIN is strongly recommended.')
      }
      return true
    }

    // Check if PIN matches any active staff member's PIN
    const activeStaff = await this.db.staffProfile.findMany({
      where: { isActive: true },
    })

    const matchesStaff = activeStaff.some((staff) => timingSafeHashVerify(pin, staff.pinHash))
    if (matchesStaff) {
      this.rateLimiter.recordSuccess()
      return true
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

  registerIpc() {
    ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => this.get())
    ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, (_, data: any) => this.set(data))
    ipcMain.handle(IPC_CHANNELS.SETTINGS_VERIFY_PIN, (_, pin: string) => this.verifyPin(pin))
  }
}

