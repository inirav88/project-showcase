import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

let _client: PrismaClient | null = null

export function getDb(): PrismaClient {
  if (!_client) {
    const isDev = app ? !app.isPackaged : true
    const dbPath = isDev
      ? path.join(process.cwd(), 'dev.db')
      : path.join(app.getPath('userData'), 'showcaseos.db')

    // Initialize production database from the bundled template on first app startup
    if (!isDev && !fs.existsSync(dbPath)) {
      const dbDir = path.dirname(dbPath)
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true })
      }
      const templateDbPath = path.join(process.resourcesPath, 'dev.db')
      if (fs.existsSync(templateDbPath)) {
        fs.copyFileSync(templateDbPath, dbPath)
      } else {
        console.warn(`Template database not found at resourcesPath: ${templateDbPath}`)
      }
    }

    const libsql = createClient({
      url: `file:${dbPath}`,
    })
    const adapter = new PrismaLibSQL(libsql)
    _client = new PrismaClient({ adapter })
  }
  return _client
}
