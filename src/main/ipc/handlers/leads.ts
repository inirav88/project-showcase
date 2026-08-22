import { ipcMain, dialog } from 'electron'
import type { PrismaClient } from '@prisma/client'
import { IPC_CHANNELS } from '../channels'
import fs from 'fs'
import path from 'path'

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

  async exportCsv() {
    const leads = await this.db.lead.findMany({
      include: { project: { select: { name: true } } },
      orderBy: { capturedAt: 'desc' },
    })

    const { filePath } = await dialog.showSaveDialog({
      title: 'Export Leads as CSV',
      defaultPath: path.join(
        require('os').homedir(),
        `showcaseos_leads_${new Date().toISOString().slice(0, 10)}.csv`,
      ),
      filters: [{ name: 'CSV File', extensions: ['csv'] }],
    })

    if (!filePath) return { success: false, reason: 'Cancelled' }

    const headers = ['Name', 'Phone', 'Email', 'Project', 'Budget Min', 'Budget Max', 'Notes', 'Captured At']
    const rows = leads.map((l) => [
      l.name,
      l.phone,
      l.email || '',
      l.project?.name || '',
      l.budgetMin != null ? String(l.budgetMin) : '',
      l.budgetMax != null ? String(l.budgetMax) : '',
      l.notes || '',
      new Date(l.capturedAt).toLocaleString(),
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n')

    fs.writeFileSync(filePath, '\uFEFF' + csv, 'utf-8') // BOM for Excel UTF-8

    // Mark leads as exported
    await this.db.lead.updateMany({
      where: { id: { in: leads.map((l) => l.id) } },
      data: { exported: true },
    })

    return { success: true, count: leads.length, filePath }
  }

  registerIpc() {
    ipcMain.handle(IPC_CHANNELS.LEAD_CREATE, (_, data: any) => this.create(data))
    ipcMain.handle(IPC_CHANNELS.LEAD_LIST, () => this.list())
    ipcMain.handle(IPC_CHANNELS.LEAD_EXPORT_CSV, () => this.exportCsv())
  }
}
