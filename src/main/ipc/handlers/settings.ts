import { ipcMain } from 'electron'
import type { PrismaClient } from '@prisma/client'
import { IPC_CHANNELS } from '../channels'
import crypto from 'crypto'

export class SettingsHandlers {
  constructor(private db: PrismaClient) {}

  async get() {
    return this.db.settings.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        firmName: 'Nirav Real Estate',
        disclaimerText: 'RERA registered. Prices are indicative and subject to change. E&OE.',
      },
    })
  }

  async set(data: any) {
    const { adminPin, ...rest } = data
    const updateData: any = { ...rest }
    if (adminPin) {
      updateData.adminPinHash = crypto.createHash('sha256').update(adminPin).digest('hex')
    }
    return this.db.settings.update({
      where: { id: 1 },
      data: updateData,
    })
  }

  async verifyPin(pin: string) {
    const s = await this.db.settings.findUnique({ where: { id: 1 } })
    if (!s) return false
    const hash = crypto.createHash('sha256').update(pin).digest('hex')
    const expectedHash = s.adminPinHash || crypto.createHash('sha256').update('0000').digest('hex')
    return hash === expectedHash
  }

  registerIpc() {
    ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => this.get())
    ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, (_, data: any) => this.set(data))
    ipcMain.handle(IPC_CHANNELS.SETTINGS_VERIFY_PIN, (_, pin: string) => this.verifyPin(pin))
  }
}
