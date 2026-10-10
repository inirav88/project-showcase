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

  const tower3A = await db.tower.create({ data: { projectId: p3.id, name: 'Block A' } })
  const tower3B = await db.tower.create({ data: { projectId: p3.id, name: 'Block B' } })

  // Kumbh Avyanna Inventory: Block A (34 Units: 28 Available, 6 Booked/Sold)
  await db.unit.createMany({
    data: [
      // 01 series (Floors 2 to 18)
      { towerId: tower3A.id, floor: 2, unitNumber: 'A-201', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 14350000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 3, unitNumber: 'A-301', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 14350000, priceLabel: 'OFFICIAL', status: 'SOLD', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 4, unitNumber: 'A-401', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 14350000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 5, unitNumber: 'A-501', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 14350000, priceLabel: 'OFFICIAL', status: 'SOLD', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 6, unitNumber: 'A-601', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 15050000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 7, unitNumber: 'A-701', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 15050000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 8, unitNumber: 'A-801', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 15050000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 9, unitNumber: 'A-901', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 15050000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 10, unitNumber: 'A-1001', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 15050000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 11, unitNumber: 'A-1101', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 15750000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 12, unitNumber: 'A-1201', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 15750000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 13, unitNumber: 'A-1301', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 15750000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 14, unitNumber: 'A-1401', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 15750000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 15, unitNumber: 'A-1501', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 15750000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 16, unitNumber: 'A-1601', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 16450000, priceLabel: 'OFFICIAL', status: 'SOLD', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 17, unitNumber: 'A-1701', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 16450000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 18, unitNumber: 'A-1801', configuration: '4BHK', carpetArea: 6138, builtUpArea: 6138, price: 22437800, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '682 sqyd' },

      // 02 series (Floors 2 to 18)
      { towerId: tower3A.id, floor: 2, unitNumber: 'A-202', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 13300000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 3, unitNumber: 'A-302', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 13300000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 4, unitNumber: 'A-402', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 13300000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 5, unitNumber: 'A-502', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 13300000, priceLabel: 'OFFICIAL', status: 'SOLD', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 6, unitNumber: 'A-602', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 13650000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 7, unitNumber: 'A-702', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 13650000, priceLabel: 'OFFICIAL', status: 'SOLD', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 8, unitNumber: 'A-802', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 13650000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 9, unitNumber: 'A-902', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 13650000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 10, unitNumber: 'A-1002', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 13650000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 11, unitNumber: 'A-1102', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 14000000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 12, unitNumber: 'A-1202', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 14000000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 13, unitNumber: 'A-1302', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 14000000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 14, unitNumber: 'A-1402', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 14000000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 15, unitNumber: 'A-1502', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 14000000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 16, unitNumber: 'A-1602', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 14350000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 17, unitNumber: 'A-1702', configuration: '4BHK', carpetArea: 4500, builtUpArea: 4500, price: 14350000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '500 sqyd' },
      { towerId: tower3A.id, floor: 18, unitNumber: 'A-1802', configuration: '4BHK', carpetArea: 6138, builtUpArea: 6138, price: 21960400, priceLabel: 'OFFICIAL', status: 'SOLD', notes: '682 sqyd' },
    ],
  })

  // Kumbh Avyanna Inventory: Block B (38 Units: 26 Available, 12 Booked/Sold)
  await db.unit.createMany({
    data: [
      // 01 series (Floors 1 to 19)
      { towerId: tower3B.id, floor: 1, unitNumber: 'B-101', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 11970000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 2, unitNumber: 'B-201', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 11970000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 3, unitNumber: 'B-301', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 11970000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 4, unitNumber: 'B-401', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 11970000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 5, unitNumber: 'B-501', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 11970000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 6, unitNumber: 'B-601', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 12285000, priceLabel: 'OFFICIAL', status: 'SOLD', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 7, unitNumber: 'B-701', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 12285000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 8, unitNumber: 'B-801', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 12285000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 9, unitNumber: 'B-901', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 12285000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 10, unitNumber: 'B-1001', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 12285000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 11, unitNumber: 'B-1101', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 12600000, priceLabel: 'OFFICIAL', status: 'SOLD', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 12, unitNumber: 'B-1201', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 12600000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 13, unitNumber: 'B-1301', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 12600000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 14, unitNumber: 'B-1401', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 12600000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 15, unitNumber: 'B-1501', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 12600000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 16, unitNumber: 'B-1601', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 12915000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 17, unitNumber: 'B-1701', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 12915000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 18, unitNumber: 'B-1801', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 12915000, priceLabel: 'OFFICIAL', status: 'SOLD', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 19, unitNumber: 'B-1901', configuration: '4BHK', carpetArea: 6399, builtUpArea: 6399, price: 20405700, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '711 sqyd' },

      // 02 series (Floors 1 to 19)
      { towerId: tower3B.id, floor: 1, unitNumber: 'B-102', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 12285000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 2, unitNumber: 'B-202', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 12285000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 3, unitNumber: 'B-302', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 12285000, priceLabel: 'OFFICIAL', status: 'SOLD', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 4, unitNumber: 'B-402', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 12285000, priceLabel: 'OFFICIAL', status: 'SOLD', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 5, unitNumber: 'B-502', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 12285000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 6, unitNumber: 'B-602', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 12600000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 7, unitNumber: 'B-702', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 12600000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 8, unitNumber: 'B-802', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 12600000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 9, unitNumber: 'B-902', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 12600000, priceLabel: 'OFFICIAL', status: 'SOLD', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 10, unitNumber: 'B-1002', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 12600000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 11, unitNumber: 'B-1102', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 12915000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 12, unitNumber: 'B-1202', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 12915000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 13, unitNumber: 'B-1302', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 12915000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 14, unitNumber: 'B-1402', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 12915000, priceLabel: 'OFFICIAL', status: 'SOLD', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 15, unitNumber: 'B-1502', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 12915000, priceLabel: 'OFFICIAL', status: 'SOLD', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 16, unitNumber: 'B-1602', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 13230000, priceLabel: 'OFFICIAL', status: 'SOLD', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 17, unitNumber: 'B-1702', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 13230000, priceLabel: 'OFFICIAL', status: 'SOLD', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 18, unitNumber: 'B-1802', configuration: '4BHK', carpetArea: 4050, builtUpArea: 4050, price: 13230000, priceLabel: 'OFFICIAL', status: 'SOLD', notes: '450 sqyd' },
      { towerId: tower3B.id, floor: 19, unitNumber: 'B-1902', configuration: '4BHK', carpetArea: 6399, builtUpArea: 6399, price: 20903400, priceLabel: 'OFFICIAL', status: 'SOLD', notes: '711 sqyd' },
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

  // Project 5 — Aurelia (Atishay - Shivalay)
  const p5 = await db.project.create({
    data: {
      name: 'Aurelia',
      developer: 'Atishay - Shivalay',
      reraNumber: 'PR/GJ/GANDHINAGAR/GANDHINAGAR/Gandhinagar Municipal Corporation/RAA13145/190324/311227',
      location: 'GIFT City - PDPU Road near GNLU Campus, Koba, Gandhinagar',
      description: 'The Golden Era of Luxury. Exclusive 4 BHK lifestyle residences across three 19-storey towers with skydeck duplex penthouses, 31+ sports & recreation amenities, double-height squash & badminton courts, and instant access to GIFT City and Metro.',
      type: 'RESIDENTIAL',
      status: 'ACTIVE',
      possessionStatus: 'UNDER_CONSTRUCTION',
      possessionDate: 'December 2027',
      priceRangeMin: 22500000,
      priceRangeMax: 45000000,
      themeAccentColor: '#C5A059',
      themeFontPairing: 'Outfit',
      isFeatured: true,
    },
  })

  await db.projectModule.createMany({
    data: [
      { projectId: p5.id, moduleType: 'OVERVIEW', sortOrder: 0, config: '{"heroHeadline":"The Golden Era of Luxury","subHeadline":"Exclusive 4 BHK Lifestyle Residences & Skydeck Duplex Penthouses","stats":["4 BHK Luxury Homes","19 Storeys • 3 Towers","31+ Sports & Lifestyle Amenities","Double Height Penthouses","5 Mins from GIFT City","RERA Approved"],"ctaLabel":"Explore 4 BHK Units"}' },
      { projectId: p5.id, moduleType: 'USP_SPOTLIGHT', sortOrder: 1, config: '{"headline":"A Grandeur That Shines On You","subtext":"Step into the realm of opulence where timeless sophistication meets outdoor vitality."}' },
      { projectId: p5.id, moduleType: 'GALLERY', sortOrder: 2, config: '{}' },
      { projectId: p5.id, moduleType: 'SPORTS_CAROUSEL', sortOrder: 3, config: '{"headline":"A Sport Sanctuary Like Never Before","subtext":"Aurelia is home for luxurious living incorporated with outdoor vitality, offering sports excellence as a way of life."}' },
      { projectId: p5.id, moduleType: 'AMENITIES', sortOrder: 4, config: '{"headline":"31+ Curated Lifestyle Amenities","subtext":"Indulgence knows no bounds at Aurelia — crafted for wellness, leisure, and family joy."}' },
      { projectId: p5.id, moduleType: 'LOCATION', sortOrder: 5, config: '{"addressLine":"GIFT City - PDPU Road near GNLU Campus, Koba, Gandhinagar, Gujarat"}' },
      { projectId: p5.id, moduleType: 'MASTER_PLAN', sortOrder: 6, config: '{"description":"Campus Master Layout featuring 3 Grand Towers (19 Storeys), Central Park Lawn, 31 Numbered Amenities, Sports Sanctuary, and Double Basement Parking."}' },
      { projectId: p5.id, moduleType: 'PRICING', sortOrder: 7, config: '{"headline":"Transparent Luxury Pricing, No Hidden Charges"}' },
      { projectId: p5.id, moduleType: 'COMPARE_UNITS', sortOrder: 8, config: '{}' },
      { projectId: p5.id, moduleType: 'CALCULATORS', sortOrder: 9, config: '{"defaultLoanAmount":20000000,"defaultTenure":20,"defaultRate":8.5,"maxLoanAmount":50000000}' },
      { projectId: p5.id, moduleType: 'COMMUNITY_LIFESTYLE', sortOrder: 10, config: '{"headline":"Curated Opulence & Luxe Lifestyle","subtext":"Discover hidden pockets of tranquillity amidst lush gardens, where the fragrance of blossoms meets chic social living."}' },
      { projectId: p5.id, moduleType: 'RERA_TRUST', sortOrder: 11, config: '{"reraNo":"PR/GJ/GANDHINAGAR/GANDHINAGAR/Gandhinagar Municipal Corporation/RAA13145/190324/311227","validityDate":"December 2027","approvedBy":"GUJRERA (Gujarat Real Estate Regulatory Authority)"}' },
      { projectId: p5.id, moduleType: 'BROCHURE', sortOrder: 12, config: '{"buttonLabel":"Download Aurelia Official Brochure"}' },
    ],
  })

  const tower5A = await db.tower.create({ data: { projectId: p5.id, name: 'Block A' } })
  const tower5B = await db.tower.create({ data: { projectId: p5.id, name: 'Block B' } })
  const tower5C = await db.tower.create({ data: { projectId: p5.id, name: 'Block C' } })

  await db.unit.createMany({
    data: [
      { towerId: tower5A.id, floor: 2, unitNumber: 'A-202', configuration: '4BHK', carpetArea: 2450, builtUpArea: 3375, price: 26500000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', facing: 'East', notes: '500 sqyd • Personal Foyer • Servant Room' },
      { towerId: tower5A.id, floor: 18, unitNumber: 'A-1801', configuration: '4BHK Duplex', carpetArea: 4100, builtUpArea: 5500, price: 42500000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', facing: 'North-East', notes: 'Skydeck Duplex Penthouse • Double Height Living' },
      { towerId: tower5B.id, floor: 2, unitNumber: 'B-201', configuration: '4BHK', carpetArea: 2200, builtUpArea: 3037, price: 22800000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', facing: 'North', notes: '450 sqyd • 3 Allotted Car Parkings' },
      { towerId: tower5B.id, floor: 19, unitNumber: 'B-1901', configuration: '4BHK Duplex', carpetArea: 3950, builtUpArea: 5350, price: 41000000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', facing: 'North-East', notes: 'Skydeck Duplex Penthouse • Private Terrace' },
      { towerId: tower5C.id, floor: 2, unitNumber: 'C-201', configuration: '4BHK', carpetArea: 2200, builtUpArea: 3037, price: 22500000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', facing: 'East', notes: '450 sqyd • 3 Allotted Parkings' },
      { towerId: tower5C.id, floor: 18, unitNumber: 'C-1803', configuration: '4BHK Duplex', carpetArea: 4050, builtUpArea: 5450, price: 42000000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', facing: 'East', notes: 'Skydeck Duplex Penthouse • Double Height Living' },
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
