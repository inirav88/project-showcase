import { ipcMain } from 'electron'
import type { PrismaClient } from '@prisma/client/showcase-client'
import { IPC_CHANNELS } from '../channels'

export class SyncHandlers {
  constructor(private db: PrismaClient) {}

  async getStatus() {
    const settings = await this.db.settings.findUnique({ where: { id: 1 } })
    if (!settings) return { configured: false, lastSyncedAt: null, contentVersion: '0' }
    return {
      configured: !!settings.vpsBaseUrl,
      lastSyncedAt: settings.lastSyncedAt,
      contentVersion: settings.contentVersion,
      vpsBaseUrl: settings.vpsBaseUrl,
    }
  }

  async syncNow() {
    const settings = await this.db.settings.findUnique({ where: { id: 1 } })
    if (!settings?.vpsBaseUrl) {
      return { success: false, reason: 'Cloud sync not configured. Add VPS URL in Settings.' }
    }

    try {
      const manifestUrl = `${settings.vpsBaseUrl.replace(/\/$/, '')}/api/manifest`
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (settings.vpsApiKey) headers['x-api-key'] = settings.vpsApiKey

      const res = await fetch(manifestUrl, { headers, signal: AbortSignal.timeout(10000) })
      if (!res.ok) {
        return { success: false, reason: `VPS returned ${res.status}: ${res.statusText}` }
      }

      const manifest = (await res.json()) as {
        contentVersion: string
        changedSince: string
      }

      if (manifest.contentVersion === settings.contentVersion) {
        return { success: true, message: 'Already up to date', contentVersion: settings.contentVersion }
      }

      // Fetch delta payload
      const syncUrl = `${settings.vpsBaseUrl.replace(/\/$/, '')}/api/sync?since=${settings.lastSyncedAt?.toISOString() ?? ''}`
      const syncRes = await fetch(syncUrl, { headers, signal: AbortSignal.timeout(30000) })
      if (!syncRes.ok) {
        return { success: false, reason: `Sync payload fetch failed: ${syncRes.status}` }
      }

      const delta = (await syncRes.json()) as {
        projects?: any[]
        towers?: any[]
        units?: any[]
        modules?: any[]
        highlights?: any[]
        amenities?: any[]
      }

      const cleanObj = (obj: any, keys: string[]) => {
        const cleaned = { ...obj }
        for (const k of keys) delete cleaned[k]
        return cleaned
      }

      // Apply in proper dependency order within transaction
      await this.db.$transaction(async (tx) => {
        // 1. Projects
        if (delta.projects) {
          for (const raw of delta.projects) {
            const p = cleanObj(raw, ['modules', 'highlightCards', 'media', 'towers', 'amenities', 'sessions', 'leads'])
            if (p.createdAt) p.createdAt = new Date(p.createdAt)
            if (p.updatedAt) p.updatedAt = new Date(p.updatedAt)
            await tx.project.upsert({ where: { id: p.id }, update: p, create: p })
          }
        }
        // 2. Towers (Must be created BEFORE units due to towerId foreign key!)
        if (delta.towers) {
          for (const raw of delta.towers) {
            const t = cleanObj(raw, ['project', 'units'])
            await tx.tower.upsert({ where: { id: t.id }, update: t, create: t })
          }
        }
        // 3. Units
        if (delta.units) {
          for (const raw of delta.units) {
            const u = cleanObj(raw, ['tower', 'floorPlanMedia'])
            if (u.updatedAt) u.updatedAt = new Date(u.updatedAt)
            await tx.unit.upsert({ where: { id: u.id }, update: u, create: u })
          }
        }
        // 4. Modules
        if (delta.modules) {
          for (const raw of delta.modules) {
            const m = cleanObj(raw, ['project'])
            if (m.createdAt) m.createdAt = new Date(m.createdAt)
            if (m.updatedAt) m.updatedAt = new Date(m.updatedAt)
            await tx.projectModule.upsert({ where: { id: m.id }, update: m, create: m })
          }
        }
        // 5. Highlights
        if (delta.highlights) {
          for (const raw of delta.highlights) {
            const h = cleanObj(raw, ['project'])
            await tx.highlightCard.upsert({ where: { id: h.id }, update: h, create: h })
          }
        }
        // 6. Amenities
        if (delta.amenities) {
          for (const raw of delta.amenities) {
            const a = cleanObj(raw, ['project'])
            await tx.amenity.upsert({ where: { id: a.id }, update: a, create: a })
          }
        }
      })

      // Update sync metadata
      await this.db.settings.update({
        where: { id: 1 },
        data: { lastSyncedAt: new Date(), contentVersion: manifest.contentVersion },
      })

      return { success: true, message: 'Sync complete', contentVersion: manifest.contentVersion }
    } catch (err: any) {
      console.error('[Sync] Error:', err?.message)
      return { success: false, reason: err?.message || 'Unknown error' }
    }
  }

  async publishNow() {
    const settings = await this.db.settings.findUnique({ where: { id: 1 } })
    if (!settings?.vpsBaseUrl) {
      return { success: false, reason: 'Cloud sync not configured. Add VPS URL in Settings.' }
    }

    try {
      const publishUrl = `${settings.vpsBaseUrl.replace(/\/$/, '')}/api/publish`
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (settings.vpsApiKey) headers['x-api-key'] = settings.vpsApiKey

      // Gather all local data to publish
      const projects = await this.db.project.findMany()
      const towers = await this.db.tower.findMany()
      const units = await this.db.unit.findMany()
      const modules = await this.db.projectModule.findMany()
      const highlights = await this.db.highlightCard.findMany()
      const amenities = await this.db.amenity.findMany()

      const payload = {
        projects,
        towers,
        units,
        modules,
        highlights,
        amenities,
        contentVersion: Date.now().toString()
      }

      const res = await fetch(publishUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000)
      })

      if (!res.ok) {
        return { success: false, reason: `VPS returned ${res.status}: ${res.statusText}` }
      }

      const reply = (await res.json()) as { success: boolean; contentVersion: string }

      // Update local content version to match the published version
      await this.db.settings.update({
        where: { id: 1 },
        data: { contentVersion: reply.contentVersion || payload.contentVersion }
      })

      return { success: true, message: 'Published successfully', contentVersion: reply.contentVersion || payload.contentVersion }
    } catch (err: any) {
      console.error('[Sync] Publish error:', err?.message)
      return { success: false, reason: err?.message || 'Unknown error' }
    }
  }

  registerIpc() {
    ipcMain.handle(IPC_CHANNELS.SYNC_STATUS, () => this.getStatus())
    ipcMain.handle(IPC_CHANNELS.SYNC_NOW, () => this.syncNow())
    ipcMain.handle(IPC_CHANNELS.SYNC_PUBLISH_NOW, () => this.publishNow())
  }
}
