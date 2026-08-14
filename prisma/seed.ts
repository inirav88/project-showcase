import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import path from 'path'

async function main() {
  const dbPath = path.join(process.cwd(), 'dev.db')
  const libsql = createClient({ url: `file:${dbPath}` })
  const adapter = new PrismaLibSQL(libsql)
  const db = new PrismaClient({ adapter })

  // Clear existing
  await db.$executeRawUnsafe(`DELETE FROM "Unit"`)
  await db.$executeRawUnsafe(`DELETE FROM "Tower"`)
  await db.$executeRawUnsafe(`DELETE FROM "ProjectModule"`)
  await db.$executeRawUnsafe(`DELETE FROM "Project"`)
  await db.$executeRawUnsafe(`DELETE FROM "Settings"`)

  // Project 1 — Skyline Residences
  const p1 = await db.project.create({
    data: {
      name: 'Skyline Residences',
      developer: 'Ahmedabad Builders Ltd',
      reraNumber: 'RAJ/P/2024/001234',
      location: 'SG Highway, Ahmedabad',
      type: 'RESIDENTIAL',
      status: 'ACTIVE',
      possessionStatus: 'UNDER_CONSTRUCTION',
      possessionDate: 'December 2026',
      priceRangeMin: 6500000,
      priceRangeMax: 14000000,
      themeAccentColor: '#1B4FFF',
      themeFontPairing: 'Inter',
      isFeatured: true,
    },
  })

  await db.projectModule.createMany({
    data: [
      { projectId: p1.id, moduleType: 'OVERVIEW',       sortOrder: 0, config: '{"heroHeadline":"Urban Living Redefined"}' },
      { projectId: p1.id, moduleType: 'USP_SPOTLIGHT', sortOrder: 1, config: '{"headline":"Only High-Rise on SG Highway","body":"40-storey landmark with panoramic city views"}' },
      { projectId: p1.id, moduleType: 'GALLERY',       sortOrder: 2, config: '{}' },
      { projectId: p1.id, moduleType: 'MASTER_PLAN',   sortOrder: 3, config: '{}' },
      { projectId: p1.id, moduleType: 'PRICING',       sortOrder: 4, config: '{}' },
      { projectId: p1.id, moduleType: 'CALCULATORS',   sortOrder: 5, config: '{}' },
    ],
  })

  const tower1 = await db.tower.create({ data: { projectId: p1.id, name: 'Tower A' } })

  await db.unit.createMany({
    data: [
      { towerId: tower1.id, floor: 10, unitNumber: 'A-1001', configuration: '2BHK', carpetArea: 850, builtUpArea: 1050, facing: 'East', price: 7500000, priceLabel: 'OFFICIAL', status: 'AVAILABLE' },
      { towerId: tower1.id, floor: 10, unitNumber: 'A-1002', configuration: '3BHK', carpetArea: 1200, builtUpArea: 1480, facing: 'West', price: 11000000, priceLabel: 'OFFICIAL', status: 'HELD' },
      { towerId: tower1.id, floor: 20, unitNumber: 'A-2001', configuration: '2BHK', carpetArea: 850, builtUpArea: 1050, facing: 'East', price: 8200000, priceLabel: 'ESTIMATED', status: 'AVAILABLE' },
    ],
  })

  // Project 2 — Green Valley Villas
  const p2 = await db.project.create({
    data: {
      name: 'Green Valley Villas',
      developer: 'Serene Developers',
      reraNumber: 'RAJ/P/2024/005678',
      location: 'Gandhinagar, Gujarat',
      type: 'RESIDENTIAL',
      status: 'ACTIVE',
      possessionStatus: 'READY',
      possessionDate: 'Ready to Move',
      priceRangeMin: 18000000,
      priceRangeMax: 35000000,
      themeAccentColor: '#2E7D32',
      themeFontPairing: 'Lora',
      isFeatured: true,
    },
  })

  await db.projectModule.createMany({
    data: [
      { projectId: p2.id, moduleType: 'OVERVIEW',       sortOrder: 0, config: '{"heroHeadline":"Nature. Privacy. Home."}' },
      { projectId: p2.id, moduleType: 'USP_SPOTLIGHT',   sortOrder: 1, config: '{"headline":"5 Acres of Private Greenery","body":"Only 40 villa plots — never feel crowded"}' },
      { projectId: p2.id, moduleType: 'SUSTAINABILITY', sortOrder: 2, config: '{"features":["Solar rooftop","Rainwater harvesting","EV charging"]}' },
      { projectId: p2.id, moduleType: 'GALLERY',          sortOrder: 3, config: '{}' },
      { projectId: p2.id, moduleType: 'AMENITIES',        sortOrder: 4, config: '{}' },
      { projectId: p2.id, moduleType: 'PRICING',          sortOrder: 5, config: '{}' },
    ],
  })

  // Settings singleton
  await db.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      firmName: 'Nirav Real Estate',
      disclaimerText: 'RERA registered. Prices are indicative and subject to change. E&OE.',
    },
  })

  console.log('Seed complete.')
  await db.$disconnect()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
