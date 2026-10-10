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

  // Project 4 — The Stately (Samved Group)
  const p4 = await db.project.create({
    data: {
      name: 'The Stately',
      developer: 'Samved Group',
      reraNumber: 'PR/GJ/GANDHINAGAR/GANDHINAGAR/Gandhinagar Municipal Corporation/MAA14924/100325/311230',
      location: 'Nr. Hari Heights, Kudasan Road, Kudasan, Gandhinagar - 382421',
      description: 'Neoclassical Roman-themed architectural landmark offering palatial 3 & 4 BHK residences, skydeck penthouses, and 24 ground-level commercial showrooms. Spanning three 14-storey blocks with grand arched elevations, triangular pediments, Roman sculpture entrance foyer, 24-foot panoramic balconies, Italian marble finishes, and 30 curated royal club and wellness amenities.',
      type: 'MIXED_USE',
      status: 'ACTIVE',
      possessionStatus: 'UNDER_CONSTRUCTION',
      possessionDate: 'December 2030',
      priceRangeMin: 11500000,
      priceRangeMax: 26500000,
      themeAccentColor: '#8B263E', // Imperial Roman Burgundy
      themeFontPairing: 'Lora',
      isFeatured: true,
    },
  })

  await db.projectModule.createMany({
    data: [
      { projectId: p4.id, moduleType: 'OVERVIEW', sortOrder: 0, config: '{"heroHeadline":"The Stately — Neoclassical Roman Living","subHeadline":"Palatial 3 & 4 BHK Residences, Skydeck Penthouses & Boutique Showrooms in Kudasan","stats":["14 Storeys • 3 Regal Blocks","Spacious 3 & 4 BHK Homes","24ft Panoramic Balconies","30+ Curated Royal Amenities","750+ sq.m Central Floral Garden","RERA Approved: MAA14924"],"ctaLabel":"Explore Residences & Layouts"}' },
      { projectId: p4.id, moduleType: 'USP_SPOTLIGHT', sortOrder: 1, config: '{"headline":"Neoclassical Grandeur Meets Contemporary Living","subtext":"Designed with Roman columns, triangular pediments, and royal floral landscapes for an uncompromising luxury lifestyle."}' },
      { projectId: p4.id, moduleType: 'GALLERY', sortOrder: 2, config: '{}' },
      { projectId: p4.id, moduleType: 'AMENITIES', sortOrder: 3, config: '{"headline":"30+ Curated Royal Club & Wellness Amenities","subtext":"A world of fitness, culture, relaxation, and entertainment conceived for every generation of your family."}' },
      { projectId: p4.id, moduleType: 'MASTER_PLAN', sortOrder: 4, config: '{"description":"Thoughtfully planned 14-storey layout encompassing 3 residential blocks (Block A for 4 BHK, Block B & C for 3 BHK), 24 ground-level double-height commercial showrooms, 750+ sq.m central vehicle-free podium garden, and basement parking."}' },
      { projectId: p4.id, moduleType: 'LOCATION', sortOrder: 5, config: '{"addressLine":"THE STATELY, Nr. Hari Heights, Kudasan Road, Kudasan, Gandhinagar - 382421","mapEmbedUrl":"https://maps.google.com/?q=Kudasan+Gandhinagar"}' },
      { projectId: p4.id, moduleType: 'PRICING', sortOrder: 6, config: '{"headline":"Transparent Value Proposition & Flexible Terms"}' },
      { projectId: p4.id, moduleType: 'COMPARE_UNITS', sortOrder: 7, config: '{}' },
      { projectId: p4.id, moduleType: 'CALCULATORS', sortOrder: 8, config: '{"defaultLoanAmount":12000000,"defaultTenure":20,"defaultRate":8.5,"maxLoanAmount":30000000}' },
      { projectId: p4.id, moduleType: 'COMMUNITY_LIFESTYLE', sortOrder: 9, config: '{"headline":"A Harmonious Life Beyond Four Walls","subtext":"Where timeless classical aesthetics blend with modern community camaraderie and wellness."}' },
      { projectId: p4.id, moduleType: 'RERA_TRUST', sortOrder: 10, config: '{"reraNo":"PR/GJ/GANDHINAGAR/GANDHINAGAR/Gandhinagar Municipal Corporation/MAA14924/100325/311230","validityDate":"December 2030","approvedBy":"GUJRERA (Gujarat Real Estate Regulatory Authority)"}' },
      { projectId: p4.id, moduleType: 'BROCHURE', sortOrder: 11, config: '{"buttonLabel":"Download The Stately Official Brochure (PDF)"}' },
    ],
  })

  await db.highlightCard.createMany({
    data: [
      { projectId: p4.id, icon: '🏛️', shortText: 'Roman-Themed Neoclassical Architecture', sortOrder: 0 },
      { projectId: p4.id, icon: '👑', shortText: '3 & 4 BHK Palatial Homes & Penthouses', sortOrder: 1 },
      { projectId: p4.id, icon: '🌅', shortText: '24ft Huge Panoramic Balconies', sortOrder: 2 },
      { projectId: p4.id, icon: '🌳', shortText: '750+ sq.m Central Floral Garden & Fountains', sortOrder: 3 },
      { projectId: p4.id, icon: '🎭', shortText: '30+ Curated Royal Lifestyle Amenities', sortOrder: 4 },
      { projectId: p4.id, icon: '📍', shortText: 'Prime Kudasan Gandhinagar • Near Raysan Metro', sortOrder: 5 },
    ],
  })

  const tower4A = await db.tower.create({ data: { projectId: p4.id, name: 'Block A (4 BHK Residences)' } })
  const tower4B = await db.tower.create({ data: { projectId: p4.id, name: 'Block B (3 BHK Residences)' } })
  const tower4C = await db.tower.create({ data: { projectId: p4.id, name: 'Block C (3 BHK Residences)' } })

  await db.unit.createMany({
    data: [
      { towerId: tower4A.id, floor: 2, unitNumber: 'A-201', configuration: '4BHK', carpetArea: 1980, builtUpArea: 2750, superBuiltUpArea: 3500, price: 17100000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', facing: 'East', notes: "Personal Foyer (8'4\" x 12'7\") • 24'10\" Balcony • 4 Attached Toilets" },
      { towerId: tower4A.id, floor: 6, unitNumber: 'A-601', configuration: '4BHK', carpetArea: 1980, builtUpArea: 2750, superBuiltUpArea: 3500, price: 17700000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', facing: 'East', notes: "Overlooking Central Floral Garden & Cascades" },
      { towerId: tower4A.id, floor: 13, unitNumber: 'A-1301', configuration: '4BHK Penthouse', carpetArea: 2650, builtUpArea: 3850, superBuiltUpArea: 4800, price: 26500000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', facing: 'East', notes: "Palatial Penthouse • Massive 34'6\" x 56'10\" Private Terrace" },
      { towerId: tower4B.id, floor: 3, unitNumber: 'B-301', configuration: '3BHK', carpetArea: 1520, builtUpArea: 2150, superBuiltUpArea: 2720, price: 12100000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', facing: 'North', notes: "Corner Layout • 24'10\" Balcony • Living-Dining (18'10\" x 17'6\")" },
      { towerId: tower4B.id, floor: 8, unitNumber: 'B-802', configuration: '3BHK', carpetArea: 1480, builtUpArea: 2080, superBuiltUpArea: 2650, price: 12300000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', facing: 'East', notes: "Garden Facing • 17' Balcony • Grand Living Lounge" },
      { towerId: tower4B.id, floor: 13, unitNumber: 'B-1301', configuration: '3BHK Penthouse', carpetArea: 1850, builtUpArea: 2600, superBuiltUpArea: 3300, price: 18500000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', facing: 'North', notes: "Exclusive Penthouse with 22'5\" x 30'6\" Open-Air Terrace" },
      { towerId: tower4C.id, floor: 4, unitNumber: 'C-401', configuration: '3BHK', carpetArea: 1520, builtUpArea: 2150, superBuiltUpArea: 2720, price: 12200000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', facing: 'East', notes: "Corner Unit • 24'10\" Wide Balcony • Personal Vestibule" },
      { towerId: tower4C.id, floor: 13, unitNumber: 'C-1301', configuration: '3BHK Penthouse', carpetArea: 1850, builtUpArea: 2600, superBuiltUpArea: 3300, price: 18500000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', facing: 'East', notes: "Exclusive Penthouse with 19'6\" x 30'6\" Open-Air Terrace" },
    ],
  })

  await db.amenity.createMany({
    data: [
      { projectId: p4.id, name: 'Attractive Entrance Foyer', description: 'Double-height grand entrance foyer adorned with classical Roman sculptures and Italian marble medallion.', icon: 'Building', sortOrder: 0 },
      { projectId: p4.id, name: 'Pickup - Drop Off Zone', description: 'Covered, convenient vehicular arrival porch ensuring smooth transit for residents and visitors.', icon: 'Car', sortOrder: 1 },
      { projectId: p4.id, name: 'High-Tech Gymnasium', description: 'Comprehensive fitness center with state-of-the-art cardio machines, free weights, and cross-training zone.', icon: 'Dumbbell', sortOrder: 2 },
      { projectId: p4.id, name: 'Music / Tuition Room', description: 'Dedicated acoustically insulated classroom for personal music practice, instrument lessons, and tuitions.', icon: 'Music', sortOrder: 3 },
      { projectId: p4.id, name: 'Automatic Boom Barrier', description: 'Intelligent RFID/tag sensor barrier gate providing seamless authorized vehicular access control.', icon: 'ShieldCheck', sortOrder: 4 },
      { projectId: p4.id, name: 'Senior Citizen Seating', description: 'Serene, shaded seating alcoves amidst tranquil gardens crafted for restful elderly socialization.', icon: 'Armchair', sortOrder: 5 },
      { projectId: p4.id, name: 'Common Wash Area / Restrooms', description: 'Hygienic and well-ventilated ground floor restroom facilities for maintenance staff and guests.', icon: 'Bath', sortOrder: 6 },
      { projectId: p4.id, name: 'Toddlers Play Area', description: 'Cushioned, baby-proofed indoor discovery playroom with vibrant developmental toys and soft flooring.', icon: 'Baby', sortOrder: 7 },
      { projectId: p4.id, name: 'Society Administration Office', description: 'Fully equipped executive boardroom and administrative office for resident society management.', icon: 'Briefcase', sortOrder: 8 },
      { projectId: p4.id, name: 'Jula Court & Sitting Area', description: 'Traditional Gujarati brass-chain swings nestled in scenic courtyard for evening leisure.', icon: 'Sun', sortOrder: 9 },
      { projectId: p4.id, name: 'Floral Landscaped Garden', description: '751.61 sq.m central green oasis featuring flowering shrubs, manicured lawns, and palm courts.', icon: 'Trees', sortOrder: 10 },
      { projectId: p4.id, name: 'Children\'s Outdoor Play Arena', description: 'Safe outdoor multi-play jungle gym, slides, swings, and sand pit over shock-absorbent turf.', icon: 'Gamepad2', sortOrder: 11 },
      { projectId: p4.id, name: 'Reading Library & Study Nook', description: 'Quiet, sunlit reading sanctuary with arched bookshelves and comfortable reading armchairs.', icon: 'BookOpen', sortOrder: 12 },
      { projectId: p4.id, name: 'Multipurpose Gathering Hall', description: 'Air-conditioned banquet venue equipped with audio-visual setups for family celebrations and festivals.', icon: 'Users', sortOrder: 13 },
      { projectId: p4.id, name: 'Outdoor Badminton Court', description: 'Standard-dimension outdoor badminton court with anti-skid surface and perimeter floodlights.', icon: 'Trophy', sortOrder: 14 },
      { projectId: p4.id, name: 'Piped Natural Gas (PNG)', description: 'Safe, metered piped natural gas supply integrated directly into every apartment kitchen.', icon: 'Flame', sortOrder: 15 },
      { projectId: p4.id, name: 'Advanced Fire Fighting Safety', description: 'Comprehensive fire safety network with wet risers, sprinklers, hose reels, and smoke detectors.', icon: 'ShieldAlert', sortOrder: 16 },
      { projectId: p4.id, name: 'Rainwater Harvesting System', description: 'Eco-conscious rainwater collection network recharging local groundwater aquifers.', icon: 'Droplets', sortOrder: 17 },
      { projectId: p4.id, name: 'Fully Automatic Premium Elevators', description: 'High-speed automatic elevators from Kone / Schindler with ARD rescue device and power backup.', icon: 'ArrowUpDown', sortOrder: 18 },
      { projectId: p4.id, name: 'Indoor Games Lounge', description: 'Recreational lounge featuring full-size billiards/pool table, table tennis, carrom, and board games.', icon: 'Dices', sortOrder: 19 },
      { projectId: p4.id, name: '24x7 Manned Security', description: 'Round-the-clock trained security guards monitoring entry, exit, and campus perimeter.', icon: 'Shield', sortOrder: 20 },
      { projectId: p4.id, name: '24x7 Continuous Water Supply', description: 'Pressurized dual-source water supply supported by high-capacity underground and overhead reservoirs.', icon: 'Waves', sortOrder: 21 },
      { projectId: p4.id, name: 'Royal Water Cascade & Fountains', description: 'Cascading architectural fountains with ambient lighting creating a soothing acoustic environment.', icon: 'Sparkles', sortOrder: 22 },
      { projectId: p4.id, name: 'CCTV Surveillance Network', description: 'Comprehensive high-definition CCTV coverage across all gates, basements, lobbies, and elevators.', icon: 'Camera', sortOrder: 23 },
      { projectId: p4.id, name: 'Allotted Covered Car Parking', description: 'Guaranteed numbered covered car parking bays in basement and ground levels.', icon: 'ParkingSquare', sortOrder: 24 },
      { projectId: p4.id, name: 'Solar Panels for Common Areas', description: 'Green rooftop solar photovoltaic panels generating clean renewable energy for common utilities.', icon: 'SunMedium', sortOrder: 25 },
      { projectId: p4.id, name: 'Door-to-Door Garbage Collection', description: 'Daily segregated household waste collection system ensuring pristine sanitation.', icon: 'Trash2', sortOrder: 26 },
      { projectId: p4.id, name: '100% DG Power Backup', description: 'Heavy-duty diesel generator providing automatic power backup for lifts, water pumps, and lighting.', icon: 'Zap', sortOrder: 27 },
      { projectId: p4.id, name: 'DTH & High-Speed Telecom Cabling', description: 'Pre-installed concealed conduits for high-speed fiber internet and multi-operator satellite TV.', icon: 'Wifi', sortOrder: 28 },
      { projectId: p4.id, name: 'Indoor Private Cinema Theater', description: 'Boutique private mini-theater with plush recliner seating and Dolby surround acoustics.', icon: 'Film', sortOrder: 29 },
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

  // Project 6 — Embrace The Wind (Sripad - Shashwat Group)
  const p6 = await db.project.create({
    data: {
      name: 'Embrace The Wind',
      developer: 'Sripad - Shashwat Group',
      reraNumber: 'PR/GJ/GANDHINAGAR/GANDHINAGAR/Gandhinagar Municipal Corporation/MAA14756/310125/311230',
      location: "Sargasan Cross Road, Behind McDonald's, S.G. Highway, Gandhinagar - 382421",
      description: "Landmark residential and commercial marvel rising 20 floors high along prominent S.G. Highway in Sargasan, Gandhinagar. Features 352 bespoke 3 & 4 BHK residences with private foyers and personal patios, 76 retail showrooms, 5 magnificent towers surrounding the largest landscaped central podium garden in Sargasan with 54 world-class amenities and two swimming pools.",
      type: 'RESIDENTIAL',
      status: 'ACTIVE',
      possessionStatus: 'UNDER_CONSTRUCTION',
      possessionDate: 'December 2030',
      priceRangeMin: 9500000,
      priceRangeMax: 24000000,
      themeAccentColor: '#B89735',
      themeFontPairing: 'Outfit',
      isFeatured: true,
    },
  })

  await db.projectModule.createMany({
    data: [
      { projectId: p6.id, moduleType: 'OVERVIEW', sortOrder: 0, config: '{"heroHeadline":"Redefining Life Above All","subHeadline":"Ultra-Luxury 3 & 4 BHK Residences & Signature Duplex Penthouses on S.G. Highway","stats":["20 Storeys • 5 Iconic Towers","352 Palatial Residences","76 Commercial Showrooms","Biggest Garden in Sargasan","54 Curated Lifestyle Amenities","2 Swimming Pools (Podium + Indoor)"],"ctaLabel":"Explore 3 & 4 BHK Residences"}' },
      { projectId: p6.id, moduleType: 'USP_SPOTLIGHT', sortOrder: 1, config: '{"headline":"Unrivaled Grandeur on S.G. Highway","subtext":"Carefully conceived by Sripad Group & Shashwat Group to elevate every facet of contemporary living."}' },
      { projectId: p6.id, moduleType: 'GALLERY', sortOrder: 2, config: '{}' },
      { projectId: p6.id, moduleType: 'AMENITIES', sortOrder: 3, config: '{"headline":"54 Curated Lifestyle Amenities","subtext":"A holistic realm of fitness, tranquility, leisure, and social grandeur designed for every age group."}' },
      { projectId: p6.id, moduleType: 'MASTER_PLAN', sortOrder: 4, config: '{"headline":"Master Layout & Podium Amenities","subtext":"Thoughtfully planned vehicle-free central park surrounded by 5 majestic 20-storey towers and retail arcade."}' },
      { projectId: p6.id, moduleType: 'LOCATION', sortOrder: 5, config: '{"headline":"Connected to Everything That Matters","address":"Embrace The Wind, Behind McDonald\'s, S.G. Highway, Sargasan Cross Road, Gandhinagar - 382421"}' },
      { projectId: p6.id, moduleType: 'PRICING', sortOrder: 6, config: '{"headline":"Transparent Value Proposition","startingPrice":"₹95 Lakhs*","priceRange":"₹95L - ₹2.40 Cr"}' },
      { projectId: p6.id, moduleType: 'COMPARE_UNITS', sortOrder: 7, config: '{}' },
      { projectId: p6.id, moduleType: 'CALCULATORS', sortOrder: 8, config: '{"defaultInterestRate":8.5,"defaultTenureYears":20}' },
      { projectId: p6.id, moduleType: 'COMMUNITY_LIFESTYLE', sortOrder: 9, config: '{"headline":"Life Beyond Four Walls","subtext":"A vibrant community combining nature, health, and social celebration in an inspiring sanctuary."}' },
      { projectId: p6.id, moduleType: 'RERA_TRUST', sortOrder: 10, config: '{"reraNumber":"PR/GJ/GANDHINAGAR/GANDHINAGAR/Gandhinagar Municipal Corporation/MAA14756/310125/311230","possessionTarget":"December 2030","developerInfo":"Sripad Group & Shashwat Group"}' },
      { projectId: p6.id, moduleType: 'BROCHURE', sortOrder: 11, config: '{"headline":"Official Embrace The Wind Brochure","pdfFileName":"Embrace_The_Wind_Brochure.pdf","pageCount":36}' },
    ],
  })

  const tower6A = await db.tower.create({ data: { projectId: p6.id, name: 'Tower A' } })
  const tower6B = await db.tower.create({ data: { projectId: p6.id, name: 'Tower B' } })
  const tower6C = await db.tower.create({ data: { projectId: p6.id, name: 'Tower C' } })
  const tower6D = await db.tower.create({ data: { projectId: p6.id, name: 'Tower D' } })
  const tower6E = await db.tower.create({ data: { projectId: p6.id, name: 'Tower E' } })

  await db.unit.createMany({
    data: [
      { towerId: tower6A.id, floor: 3, unitNumber: 'A-301', configuration: '4 BHK', carpetArea: 2030, builtUpArea: 2450, superBuiltUpArea: 3250, price: 16500000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', facing: 'EAST', notes: 'Personal Foyer • Private Lift • 4 En-suite Bedrooms' },
      { towerId: tower6A.id, floor: 18, unitNumber: 'A-1801 (Duplex Penthouse)', configuration: '4 BHK Penthouse', carpetArea: 3600, builtUpArea: 4500, superBuiltUpArea: 5760, price: 24000000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', facing: 'EAST', notes: 'Skydeck Duplex Penthouse with private terrace' },
      { towerId: tower6B.id, floor: 5, unitNumber: 'B-501', configuration: '3 BHK', carpetArea: 1450, builtUpArea: 1780, superBuiltUpArea: 2350, price: 11650000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', facing: 'NORTH-EAST', notes: '16 ft Living Balcony • Personal Foyer 15\' x 9\'' },
      { towerId: tower6B.id, floor: 18, unitNumber: 'B-1801 (Duplex Penthouse)', configuration: '4 BHK Penthouse', carpetArea: 2950, builtUpArea: 3687, superBuiltUpArea: 4720, price: 19500000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', facing: 'NORTH-EAST', notes: 'Duplex Penthouse with panoramic skyline views' },
      { towerId: tower6C.id, floor: 4, unitNumber: 'C-401', configuration: '3 BHK', carpetArea: 1380, builtUpArea: 1700, superBuiltUpArea: 2250, price: 11100000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', facing: 'EAST', notes: 'Spacious Living & Dining with central garden views' },
      { towerId: tower6D.id, floor: 7, unitNumber: 'D-701', configuration: '3 BHK', carpetArea: 1380, builtUpArea: 1700, superBuiltUpArea: 2250, price: 11250000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', facing: 'NORTH-EAST', notes: 'Garden facing 3 BHK with personal foyer' },
      { towerId: tower6E.id, floor: 2, unitNumber: 'E-201', configuration: '3 BHK', carpetArea: 1093, builtUpArea: 1350, superBuiltUpArea: 1800, price: 9500000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', facing: 'EAST', notes: 'Efficient 3 BHK home on S.G. Highway corridor' },
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
