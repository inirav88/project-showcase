import { PrismaClient } from './generated'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import path from 'path'
import { app } from 'electron'

let _client: PrismaClient | null = null

export function getDb(): PrismaClient {
  if (!_client) {
    const dbPath = app
      ? path.join(app.getPath('userData'), 'showcaseos.db')
      : path.join(process.cwd(), 'dev.db')

    const libsql = createClient({
      url: `file:${dbPath}`,
    })
    const adapter = new PrismaLibSQL(libsql)
    _client = new PrismaClient({ adapter })
  }
  return _client
}
