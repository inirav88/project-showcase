import { ipcMain } from 'electron'
import type { PrismaClient } from '@prisma/client'
import { IPC_CHANNELS } from '../channels'
import { parse } from 'csv-parse/sync'
import { z } from 'zod'

export const UnitUpsertSchema = z.object({
  id: z.string().optional(),
  towerId: z.string(),
  floor: z.number().int(),
  unitNumber: z.string().min(1),
  configuration: z.string().min(1),
  carpetArea: z.number().nonnegative(),
  builtUpArea: z.number().nonnegative(),
  superBuiltUpArea: z.number().nonnegative().default(0),
  facing: z.string().optional().default(''),
  price: z.number().nonnegative(),
  priceLabel: z.enum(['OFFICIAL', 'ESTIMATED', 'INDICATIVE', 'SUBJECT_TO_CONFIRMATION']).default('OFFICIAL'),
  status: z.enum(['AVAILABLE', 'HELD', 'SOLD']).default('AVAILABLE'),
  floorPlanMediaId: z.string().nullable().optional(),
  notes: z.string().optional().default(''),
})

export class UnitHandlers {
  constructor(private db: PrismaClient) {}

  async list(towerId: string) {
    return this.db.unit.findMany({
      where: { towerId },
      orderBy: [{ floor: 'asc' }, { unitNumber: 'asc' }],
    })
  }

  async upsert(data: unknown) {
    const parsed = UnitUpsertSchema.parse(data)
    if (parsed.id) {
      return this.db.unit.update({
        where: { id: parsed.id },
        data: parsed,
      })
    }
    return this.db.unit.create({
      data: parsed,
    })
  }

  async bulkImport(projectId: string, csvContent: string) {
    // Parse CSV records
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })

    const importedUnits: any[] = []

    // Atomic transaction for bulk inventory insert
    await this.db.$transaction(async (tx) => {
      for (const record of records) {
        const towerName = record.towerName?.trim()
        if (!towerName) throw new Error('Missing towerName column in CSV')

        // 1. Resolve or create Tower
        let tower = await tx.tower.findFirst({
          where: { projectId, name: towerName },
        })
        if (!tower) {
          tower = await tx.tower.create({
            data: { projectId, name: towerName },
          })
        }

        // 2. Parse and validate record fields
        const payload = {
          towerId: tower.id,
          floor: parseInt(record.floor, 10),
          unitNumber: record.unitNumber?.trim(),
          configuration: record.configuration?.trim() || '2BHK',
          carpetArea: parseFloat(record.carpetArea || '0'),
          builtUpArea: parseFloat(record.builtUpArea || '0'),
          superBuiltUpArea: parseFloat(record.superBuiltUpArea || '0'),
          facing: record.facing?.trim() || '',
          price: parseFloat(record.price || '0'),
          priceLabel: (record.priceLabel?.toUpperCase() || 'OFFICIAL') as any,
          status: (record.status?.toUpperCase() || 'AVAILABLE') as any,
          notes: record.notes?.trim() || '',
        }

        const validated = UnitUpsertSchema.parse(payload)

        // 3. Upsert Unit in inventory
        const unit = await tx.unit.upsert({
          where: {
            // Check uniqueness via unique constraint or manual match
            id: record.id || 'new-import-stub',
          },
          update: validated,
          create: validated,
        })
        importedUnits.push(unit)
      }
    })

    return { success: true, count: importedUnits.length }
  }

  registerIpc() {
    ipcMain.handle(IPC_CHANNELS.UNIT_LIST, (_, towerId: string) => this.list(towerId))
    ipcMain.handle(IPC_CHANNELS.UNIT_UPSERT, (_, data: any) => this.upsert(data))
    ipcMain.handle(IPC_CHANNELS.UNIT_BULK_IMPORT, (_, { projectId, csvContent }: any) =>
      this.bulkImport(projectId, csvContent)
    )
  }
}
