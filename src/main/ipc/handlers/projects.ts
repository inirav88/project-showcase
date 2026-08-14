import { ipcMain } from 'electron'
import type { PrismaClient } from '@prisma/client'
import { IPC_CHANNELS } from '../channels'
import { z } from 'zod'

// Zod schemas to enforce SQLite fields match PRD constraints
export const ProjectCreateSchema = z.object({
  name: z.string().min(1),
  developer: z.string().min(1),
  reraNumber: z.string(),
  location: z.string().min(1),
  description: z.string().optional().default(''),
  type: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'MIXED_USE', 'PLOTTED_DEVELOPMENT']).default('RESIDENTIAL'),
  status: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
  possessionStatus: z.enum(['READY', 'UNDER_CONSTRUCTION']).default('UNDER_CONSTRUCTION'),
  possessionDate: z.string().optional().default(''),
  priceRangeMin: z.number().nonnegative().default(0),
  priceRangeMax: z.number().nonnegative().default(0),
  isFeatured: z.boolean().default(false),
  themeAccentColor: z.string().default('#1A73E8'),
  themeFontPairing: z.string().default('Inter'),
})

export const ProjectUpdateSchema = ProjectCreateSchema.partial()

export class ProjectHandlers {
  constructor(private db: PrismaClient) {}

  async list() {
    return this.db.project.findMany({
      where: { status: 'ACTIVE' },
      include: {
        towers: {
          include: {
            units: true,
          },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
    })
  }

  async get(id: string) {
    return this.db.project.findUnique({
      where: { id },
      include: {
        modules: { orderBy: { sortOrder: 'asc' } },
        towers: { include: { units: true } },
        amenities: { orderBy: { sortOrder: 'asc' } },
        highlightCards: { orderBy: { sortOrder: 'asc' } },
        media: { orderBy: { sortOrder: 'asc' } },
      },
    })
  }

  async create(data: unknown) {
    const parsed = ProjectCreateSchema.parse(data)
    return this.db.project.create({
      data: parsed,
    })
  }

  async update(id: string, data: unknown) {
    const parsed = ProjectUpdateSchema.parse(data)
    return this.db.project.update({
      where: { id },
      data: parsed,
    })
  }

  async archive(id: string) {
    return this.db.project.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    })
  }

  registerIpc() {
    ipcMain.handle(IPC_CHANNELS.PROJECT_LIST, () => this.list())
    ipcMain.handle(IPC_CHANNELS.PROJECT_GET, (_, id: string) => this.get(id))
    ipcMain.handle(IPC_CHANNELS.PROJECT_CREATE, (_, data: any) => this.create(data))
    ipcMain.handle(IPC_CHANNELS.PROJECT_UPDATE, (_, { id, data }: any) => this.update(id, data))
    ipcMain.handle(IPC_CHANNELS.PROJECT_ARCHIVE, (_, id: string) => this.archive(id))
  }
}
