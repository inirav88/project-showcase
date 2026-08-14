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

  // Project 3 — Avyanna (Kumbh Infrastructure)
  const p3 = await db.project.create({
    data: {
      name: 'Avyanna',
      developer: 'Kumbh Infrastructure',
      reraNumber: 'PR/GJ/GANDHINAGAR/GANDHINAGAR/Gandhinagar Municipal Corporation/RAA13022/A1R/081024/311226',
      location: 'Koba, Gandhinagar',
      description: 'Luxury 4 BHK apartments strategically located near PDPU - K Raheja 80-meter road, opposite Koba Metro Station. Offers G+18 and G+19 residential towers with premium high-speed lifts and 3 allotted parkings per unit.',
      type: 'RESIDENTIAL',
      status: 'ACTIVE',
      possessionStatus: 'UNDER_CONSTRUCTION',
      possessionDate: 'December 2026',
      priceRangeMin: 16200000,
      priceRangeMax: 18200000,
      themeAccentColor: '#8B5CF6',
      themeFontPairing: 'Outfit',
      isFeatured: true,
    },
  })

  await db.projectModule.createMany({
    data: [
      { projectId: p3.id, moduleType: 'OVERVIEW',       sortOrder: 0, config: '{"heroHeadline":"Luxury 4 BHK Residences in Gandhinagar"}' },
      { projectId: p3.id, moduleType: 'USP_SPOTLIGHT',   sortOrder: 1, config: '{"headline":"Super Premium 4 BHK Living","body":"Opposite Koba Metro Station, Koba Gandhinagar"}' },
      { projectId: p3.id, moduleType: 'GALLERY',          sortOrder: 2, config: '{}' },
      { projectId: p3.id, moduleType: 'AMENITIES',        sortOrder: 3, config: '{}' },
      { projectId: p3.id, moduleType: 'PRICING',          sortOrder: 4, config: '{}' },
    ],
  })

  const tower3A = await db.tower.create({ data: { projectId: p3.id, name: 'Tower A' } })
  const tower3B = await db.tower.create({ data: { projectId: p3.id, name: 'Tower B' } })

  await db.unit.createMany({
    data: [
      { towerId: tower3A.id, floor: 5, unitNumber: 'A-501', configuration: '4BHK', carpetArea: 2450, builtUpArea: 4050, price: 16500000, priceLabel: 'OFFICIAL', status: 'AVAILABLE' },
      { towerId: tower3A.id, floor: 12, unitNumber: 'A-1201', configuration: '4BHK', carpetArea: 2500, builtUpArea: 4100, price: 17200000, priceLabel: 'OFFICIAL', status: 'AVAILABLE' },
      { towerId: tower3B.id, floor: 8, unitNumber: 'B-802', configuration: '4BHK', carpetArea: 2450, builtUpArea: 4050, price: 16800000, priceLabel: 'OFFICIAL', status: 'AVAILABLE' },
    ],
  })

  // Project 4 — The Stately (Mahadev Buildcon)
  const p4 = await db.project.create({
    data: {
      name: 'The Stately',
      developer: 'Mahadev Buildcon',
      reraNumber: 'PR/GJ/GANDHINAGAR/GANDHINAGAR/Gandhinagar Municipal Corporation/MAA14924/100325/311230',
      location: 'Kudasan, Gandhinagar',
      description: 'Roman-themed luxury mixed-development featuring flats, shops, and premium bungalows. Boasts 3-side open spacious homes with 55% green spaces, high-end clubhouse, swimming pool, and earthquake-resistant R.C.C. construction.',
      type: 'MIXED_USE',
      status: 'ACTIVE',
      possessionStatus: 'UNDER_CONSTRUCTION',
      possessionDate: 'December 2030',
      priceRangeMin: 10400000,
      priceRangeMax: 13900000,
      themeAccentColor: '#D97706', // Roman Gold / Amber
      themeFontPairing: 'Lora',
      isFeatured: false,
    },
  })

  await db.projectModule.createMany({
    data: [
      { projectId: p4.id, moduleType: 'OVERVIEW',       sortOrder: 0, config: '{"heroHeadline":"Roman-Themed Luxury Mixed Living"}' },
      { projectId: p4.id, moduleType: 'USP_SPOTLIGHT',   sortOrder: 1, config: '{"headline":"3-Side Open Homes","body":"Roman arches, extensive gardens, and premium amenities"}' },
      { projectId: p4.id, moduleType: 'GALLERY',          sortOrder: 2, config: '{}' },
      { projectId: p4.id, moduleType: 'PRICING',          sortOrder: 3, config: '{}' },
      { projectId: p4.id, moduleType: 'AMENITIES',        sortOrder: 4, config: '{}' },
    ],
  })

  const tower4A = await db.tower.create({ data: { projectId: p4.id, name: 'Block A' } })
  const tower4B = await db.tower.create({ data: { projectId: p4.id, name: 'Block B' } })

  await db.unit.createMany({
    data: [
      { towerId: tower4A.id, floor: 3, unitNumber: 'A-302', configuration: '3BHK', carpetArea: 1550, builtUpArea: 2150, price: 10500000, priceLabel: 'OFFICIAL', status: 'AVAILABLE' },
      { towerId: tower4A.id, floor: 9, unitNumber: 'A-902', configuration: '4BHK', carpetArea: 1980, builtUpArea: 2750, price: 13500000, priceLabel: 'OFFICIAL', status: 'AVAILABLE' },
      { towerId: tower4B.id, floor: 4, unitNumber: 'B-401', configuration: '3BHK', carpetArea: 1550, builtUpArea: 2150, price: 10800000, priceLabel: 'OFFICIAL', status: 'AVAILABLE' },
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
