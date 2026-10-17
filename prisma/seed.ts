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
      location: 'Opp. GNLU Metro Station, 80 Mtr Road, Koba, Gandhinagar',
      description: 'Exclusive 4 BHK supersized residences across two 20-storey towers with only 2 residences per floor, 3 allotted car parkings per unit, designer swimming pool, state-of-the-art gymnasium, private cinema theatre, and 25+ curated lifestyle amenities strategically located directly opposite GNLU Metro Station on 80-meter PDPU Road in Koba, Gandhinagar.',
      type: 'RESIDENTIAL',
      status: 'ACTIVE',
      possessionStatus: 'UNDER_CONSTRUCTION',
      possessionDate: 'December 2026',
      priceRangeMin: 11970000,
      priceRangeMax: 22437800,
      themeAccentColor: '#0F4C5C',
      themeFontPairing: 'Outfit',
      isFeatured: true,
    },
  })

  await db.projectModule.createMany({
    data: [
      {
        projectId: p3.id,
        moduleType: 'OVERVIEW',
        sortOrder: 0,
        config: JSON.stringify({
          heroHeadline: 'Your Place for More — 4 BHK Supersized Living',
          subHeadline: "At New Gandhinagar's Most Coveted Neighbourhood • Opp. GNLU Metro Station, Koba",
          stats: [
            '20 Storeys • 2 Iconic Towers',
            'Only 72 Supersized Residences',
            '02 Units Per Floor Privacy',
            '3 High-Speed Lifts Per Block',
            '3 Allotted Parkings Per Home',
            'Opp. GNLU Metro Station',
            'RERA: RAA13022'
          ],
          ctaLabel: 'Explore Supersized Residences'
        })
      },
      {
        projectId: p3.id,
        moduleType: 'USP_SPOTLIGHT',
        sortOrder: 1,
        config: JSON.stringify({
          headline: 'Uncompromised Luxury, Unmatched Exclusivity',
          subtext: 'Conceived by Kumbh Infrastructure, Avyanna sets a new benchmark in Koba, Gandhinagar with expansive 4 BHK supersized layouts, rare low-density living with only 2 residences per floor, and seamless metro connectivity.',
          highlights: [
            {
              title: '20 Storeys, Only 2 Homes Per Floor',
              description: 'Unprecedented low-density living with only 72 exclusive residences across 20 storeys, ensuring absolute acoustic privacy, triple-side ventilation, and zero common walls.',
              imagePath: 'C:\\Users\\dazed\\AppData\\Roaming\\showcaseos\\media\\cmst2ssom000j7tgj1e19t3oq_HIGHLIGHT_Elevation_Cropped.png',
              badge: 'Rare Exclusivity'
            },
            {
              title: 'Opposite GNLU Metro Station',
              description: 'Strategically positioned directly opposite GNLU Metro Station on Koba\'s prime 80-meter arterial corridor — 0 mins to Metro, 5 mins to Infocity, 10 mins to GIFT City, and 12 mins to Airport.',
              imagePath: 'C:\\Users\\dazed\\AppData\\Roaming\\showcaseos\\media\\cmst2ssom000j7tgj1e19t3oq_HIGHLIGHT_Metro_Cropped.png',
              badge: 'Prime Transit Hub'
            },
            {
              title: 'Supersized 4 BHK with 27\'2" Balcony',
              description: 'Palatial 450 to 711 sq.yd layouts featuring 4 master bedroom suites with en-suite baths, 27\'2" continuous glass viewing balcony, and a 16x16 multifunctional puja/study lounge.',
              imagePath: 'C:\\Users\\dazed\\AppData\\Roaming\\showcaseos\\media\\cmst2ssom000j7tgj1e19t3oq_HIGHLIGHT_Balcony_Cropped.png',
              badge: 'Palatial Architecture'
            },
            {
              title: 'Designer Pool & Cascading Water Jets',
              description: 'Elevated 1st-floor private lap pool featuring architectural water cascade spouts, poolside sun loungers, and an exotic timber pergola sunshade canopy.',
              imagePath: 'C:\\Users\\dazed\\AppData\\Roaming\\showcaseos\\media\\cmst2ssom000j7tgj1e19t3oq_HIGHLIGHT_Pool_Cropped.png',
              badge: 'Clubhouse Wellness'
            },
            {
              title: 'Private Cinema Theatre & High-Tech Gym',
              description: 'Dedicated 44\'3" x 25\'0" private mini-cinema with tiered luxury acoustic recliners, paired with a state-of-the-art cardiovascular and strength training fitness studio.',
              imagePath: 'C:\\Users\\dazed\\AppData\\Roaming\\showcaseos\\media\\cmst2ssom000j7tgj1e19t3oq_HIGHLIGHT_Cinema_Cropped.png',
              badge: 'Elite Entertainment'
            },
            {
              title: 'Grand Double-Lounge Entrance Foyers',
              description: 'Double-height arrival reception lobbies (Block A: 29\'8" x 16\'0", Block B: 23\'8" x 21\'3") adorned with Italian marble floors, designer hospitality seating, and 24x7 security concierge.',
              imagePath: 'C:\\Users\\dazed\\AppData\\Roaming\\showcaseos\\media\\cmst2ssom000j7tgj1e19t3oq_HIGHLIGHT_Foyer_Cropped.png',
              badge: 'Stately Arrival'
            }
          ]
        })
      },
      { projectId: p3.id, moduleType: 'GALLERY', sortOrder: 2, config: '{}' },
      {
        projectId: p3.id,
        moduleType: 'AMENITIES',
        sortOrder: 3,
        config: JSON.stringify({
          headline: '25+ Curated Luxury & Wellness Amenities',
          subtext: 'A balanced realm of fitness, recreation, leisure, and family joy spanning ground floor greens and the 1st floor clubhouse.'
        })
      },
      {
        projectId: p3.id,
        moduleType: 'MASTER_PLAN',
        sortOrder: 4,
        config: JSON.stringify({
          headline: 'Ground Layout & Campus Master Plan',
          subtext: '20-storey twin towers on an 80-meter road corridor with dual basement ramps, 26ft driveway, central green courtyard, and ground amenities.',
          description: 'Master campus layout featuring 80-meter road frontage, visitor parking, ramp-in to basement 1, ramp-out to ground, 26-foot internal driveway, separate grand entrance foyers for Block A and Block B, central pedestrian plaza, swimming pool deck, multipurpose hall, and outdoor sports arena.'
        })
      },
      {
        projectId: p3.id,
        moduleType: 'LOCATION',
        sortOrder: 5,
        config: JSON.stringify({
          headline: "At New Gandhinagar's Most Coveted Address",
          subtext: 'Situated on the prominent 80-meter PDPU - K Raheja road corridor directly opposite GNLU Metro Station, connecting Koba, GIFT City, and Ahmedabad seamlessly.',
          addressLine: 'Avyanna, Opp. GNLU Metro Station, 80 Mtr Road, Koba, Gandhinagar - 382007',
          mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3668.618174577823!2d72.63738097509575!3d23.14760457908757!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e839e5572a1f1%3A0x6d9f0dfb72049e61!2sGNLU%20Metro%20Station!5e0!3m2!1sen!2sin!4v1776930000000!5m2!1sen!2sin',
          landmarks: [
            { name: 'GNLU Metro Station', distance: 'Opposite (1 Min Walk)', category: 'transit' },
            { name: '80-Meter PDPU Road', distance: 'Front Facing (0 Min)', category: 'transit' },
            { name: 'Koba Circle & NH-147 Corridor', distance: '3 Mins', category: 'transit' },
            { name: 'GIFT City Financial Central', distance: '5 Mins', category: 'transit' },
            { name: 'SVPI Ahmedabad International Airport', distance: '12 Mins', category: 'transit' },
            { name: 'Ahmedabad-Gandhinagar Highway', distance: '2 Mins', category: 'transit' },
            { name: 'GNLU (Gujarat National Law University)', distance: '2 Mins', category: 'education' },
            { name: 'PDPU / PDEU University Campus', distance: '3 Mins', category: 'education' },
            { name: 'IIHM Ahmedabad', distance: '4 Mins', category: 'education' },
            { name: 'IAR (Institute of Advanced Research)', distance: '4 Mins', category: 'education' },
            { name: 'K Raheja IT Park & Mindspace', distance: '2 Mins', category: 'transit' },
            { name: 'SMVS Swaminarayan Hospital', distance: '5 Mins', category: 'healthcare' },
            { name: 'Proposed Sabarmati Riverfront Phase 2', distance: '3 Mins', category: 'other' },
            { name: 'Happiness Circle & Kudasan Retail', distance: '4 Mins', category: 'retail' },
            { name: 'Indroda Nature Park', distance: '6 Mins', category: 'other' },
            { name: 'Kumbheshwar Mahadev Temple', distance: '2 Mins', category: 'other' }
          ]
        })
      },
      {
        projectId: p3.id,
        moduleType: 'PRICING',
        sortOrder: 6,
        config: JSON.stringify({
          headline: 'Official Value Proposition & Supersized Floor Plans',
          subtext: 'Official website pricing starting from ₹1.19 Cr* onwards with 3 dedicated car parking slots included for every residence.',
          pricingTiers: [
            {
              configuration: 'Block B — 4 BHK Supersized (450 sq.yd / ~4,050 sq.ft)',
              priceFrom: 11970000,
              priceTo: 13230000,
              note: '450 sq.yd built-up • 4 En-suite Bedrooms • 27\'2" Wide Balcony • Puja Room • Store Room • 3 Allotted Parkings • Starting ₹1.19 Cr*'
            },
            {
              configuration: 'Block A — 4 BHK Palatial (500 sq.yd / ~4,500 sq.ft)',
              priceFrom: 14350000,
              priceTo: 16450000,
              note: '500 sq.yd built-up • 4 Master Bedrooms with Attached Baths • Powder Room • 16x16 Multifunctional Space with Puja & Study • 2 Balconies with Jhula • 3 Allotted Parkings • Starting ₹1.43 Cr*'
            },
            {
              configuration: 'Block B — 4 BHK Skydeck Penthouse (711 sq.yd / ~6,399 sq.ft)',
              priceFrom: 20405700,
              priceTo: 20903400,
              note: '711 sq.yd built-up • Top 19th Floor Penthouse • Expansive Sky Terrace • Panoramic Views • 3 Allotted Parkings'
            },
            {
              configuration: 'Block A — 4 BHK Skydeck Penthouse (682 sq.yd / ~6,138 sq.ft)',
              priceFrom: 21960400,
              priceTo: 22437800,
              note: '682 sq.yd built-up • Top 18th Floor Penthouse • Palatial Sky Terrace • Unobstructed Skyline & Greenery Views • 3 Allotted Parkings'
            }
          ]
        })
      },
      { projectId: p3.id, moduleType: 'COMPARE_UNITS', sortOrder: 7, config: '{}' },
      {
        projectId: p3.id,
        moduleType: 'CALCULATORS',
        sortOrder: 8,
        config: JSON.stringify({
          defaultLoanAmount: 14000000,
          defaultTenure: 20,
          defaultRate: 8.5,
          maxLoanAmount: 25000000
        })
      },
      {
        projectId: p3.id,
        moduleType: 'COMMUNITY_LIFESTYLE',
        sortOrder: 9,
        config: JSON.stringify({
          headline: 'A Place For More — Life In Full Bloom',
          subtext: 'Every space at Avyanna is curated with purpose and personality for families to celebrate, unwind, and flourish.',
          activities: [
            {
              title: 'A Place for More Play',
              description: 'Outdoor children adventure playground with shock-absorbent turf, giant floor chess, outdoor ludo arena, and indoor games lounge.'
            },
            {
              title: 'A Place for More Blue',
              description: 'Shimmering designer swimming pool with cascading waterfall spouts, poolside sun loungers, and lush green pergola deck.'
            },
            {
              title: 'A Place for More Strength & Stories',
              description: 'Fully equipped modern gymnasium with cardio and free weights, paired with a private acoustic cinema theatre for family movie screenings.'
            },
            {
              title: 'A Place for More Green',
              description: 'Central vehicle-free green courtyard with landscaped lawns, shaded tree-lined avenues, and illuminated nighttime stone paving.'
            },
            {
              title: 'A Place for More First Impressions',
              description: 'Double-height grand entrance foyers with Italian marble medallions, plush designer guest salons, and floor-to-ceiling glass facades.'
            },
            {
              title: 'A Place for More Harmony',
              description: 'Every residence strictly aligns with Vastu principles ensuring natural cross-ventilation, abundant sunlight, and positive family energy.'
            }
          ]
        })
      },
      {
        projectId: p3.id,
        moduleType: 'SPORTS_CAROUSEL',
        sortOrder: 10,
        config: JSON.stringify({
          headline: 'Fitness & Sports Sanctuary',
          subtext: 'Stay active, energized, and healthy with comprehensive outdoor and indoor sports facilities.',
          facilities: [
            {
              name: 'Designer Swimming Pool & Sun Deck',
              description: 'Temperature-optimized lap pool with waterfall spouts, poolside loungers, and pergola canopy.'
            },
            {
              name: 'State-of-the-Art Gymnasium',
              description: 'Full cardio suite with treadmills, water rowers, elliptical trainers, and multi-station strength equipment.'
            },
            {
              name: 'Billiards & Indoor Games Lounge',
              description: 'Full-size tournament pool table, table tennis, carrom board, and indoor chess table.'
            },
            {
              name: 'Basketball & Multi-Sports Half Court',
              description: 'Outdoor court with all-weather anti-skid polyurethane sports surfacing and perimeter floodlighting.'
            },
            {
              name: 'Outdoor Giant Floor Chess & Ludo Arena',
              description: 'Vibrant giant life-size floor board games for interactive outdoor fun for kids and seniors.'
            }
          ]
        })
      },
      {
        projectId: p3.id,
        moduleType: 'SMART_HOME',
        sortOrder: 11,
        config: JSON.stringify({
          headline: 'Modern Infrastructure & Smart Provisions',
          subtext: 'Cutting-edge electrical, climate, and security specifications for seamless modern living.',
          features: [
            {
              title: 'VRV / VRF Air Conditioning Provision',
              description: 'Pre-installed refrigerant copper conduits and electrical circuits for energy-efficient centralized VRV/VRF AC.',
              icon: '❄️'
            },
            {
              title: 'Video Door Phone & Intercom',
              description: 'Direct video intercom connecting every apartment to the security guard station and entrance foyers.',
              icon: '📹'
            },
            {
              title: '3-Phase Concealed ISI Copper Wiring',
              description: 'Heavy-duty 3-phase electrical cabling by Polycab / RR Kabel with modular switches by Schneider / Legrand / Norisys.',
              icon: '⚡'
            },
            {
              title: 'High-Speed Automatic Lifts with ARD',
              description: 'Kone / Schindler elevators with automatic rescue device (ARD) to ensure passenger safety during power cuts.',
              icon: '🛗'
            },
            {
              title: 'DTH & Fiber Internet Conduits',
              description: 'Centralized distribution box (MDB) with pre-laid conduits for high-speed fiber broadband and multiple satellite TV providers.',
              icon: '🌐'
            },
            {
              title: 'DGU Sound-Insulated Windows',
              description: 'Heavy powder-coated aluminum sections with Double Glazed Units (DGU) providing superior acoustic and thermal insulation.',
              icon: '🪟'
            }
          ]
        })
      },
      {
        projectId: p3.id,
        moduleType: 'SUSTAINABILITY',
        sortOrder: 12,
        config: JSON.stringify({
          headline: 'Responsible Green & Sustainable Engineering',
          subtext: 'Eco-conscious construction practices and energy-efficient systems designed for low environmental impact.',
          initiatives: [
            {
              title: 'AAC Blocks & Thermal Insulation',
              description: 'Autoclaved Aerated Concrete blocks and fly ash bricks reducing internal ambient temperature and heat gain.',
              icon: '🧱'
            },
            {
              title: 'Earthquake Resistant RCC Frame',
              description: 'Engineered RCC structure complying with stringent seismic Zone III/IV safety codes with UltraTech / Ambuja cement.',
              icon: '🏗️'
            },
            {
              title: 'Rainwater Harvesting Network',
              description: 'Percolation wells and recharge pits across campus recharging local groundwater tables.',
              icon: '🌧️'
            },
            {
              title: 'Lush Central Oxygen Courtyard',
              description: 'Expansive green central gardens and native tree plantations enhancing micro-climate and air quality.',
              icon: '🌿'
            },
            {
              title: 'Energy-Efficient LED Common Lighting',
              description: 'Low-voltage architectural illumination across basements, driveways, and common lobbies.',
              icon: '💡'
            }
          ]
        })
      },
      {
        projectId: p3.id,
        moduleType: 'RERA_TRUST',
        sortOrder: 13,
        config: JSON.stringify({
          reraNo: 'PR/GJ/GANDHINAGAR/GANDHINAGAR/Gandhinagar Municipal Corporation/RAA13022/A1R/081024/311226',
          validityDate: 'December 2026',
          approvedBy: 'GUJRERA (Gujarat Real Estate Regulatory Authority)',
          detailsText: 'Avyanna is fully approved and registered with GUJRERA. Developed by Kumbh Infrastructure, a trusted developer committed to transparent documentation, clear marketable title, and milestone-linked RERA escrow account compliance.'
        })
      },
      {
        projectId: p3.id,
        moduleType: 'BROCHURE',
        sortOrder: 14,
        config: JSON.stringify({
          buttonLabel: 'Download Avyanna Official 4 BHK Brochure (PDF)',
          pdfFileName: 'AVYANNA 4 BHK .pdf',
          pageCount: 15,
          publicUrl: 'https://kumbhinfra.in',
          salesContact: '99 04 8888 03',
          developerWebsite: 'https://www.kumbhinfra.in'
        })
      },
      {
        projectId: p3.id,
        moduleType: 'CONSTRUCTION_TIMELINE',
        sortOrder: 15,
        config: JSON.stringify({
          headline: 'Project Milestones & Delivery Schedule',
          possessionDate: 'December 2026',
          currentStatus: 'Under Construction - Superstructure & Clubhouse Finishing in Progress'
        })
      },
      {
        projectId: p3.id,
        moduleType: 'FOUNDERS_NOTE',
        sortOrder: 16,
        config: JSON.stringify({
          headline: "Crafting Gandhinagar's Finest Supersized Residences",
          body: 'At Kumbh Infrastructure, we envisioned Avyanna not merely as residences, but as private sanctuaries of boundless space and tranquility. By dedicating an entire floor to just two homes, each family enjoys absolute privacy, unobstructed panoramic views, and three allotted parkings. We welcome you to experience Gandhinagar\'s most coveted address.',
          author: 'Kumbh Infrastructure',
          role: 'Developer & Promoters'
        })
      }
    ],
  })

  await db.highlightCard.createMany({
    data: [
      { projectId: p3.id, icon: '🏛️', shortText: '20 Storeys • Only 2 Units Per Floor', sortOrder: 0 },
      { projectId: p3.id, icon: '🚇', shortText: 'Opposite GNLU Metro Station, Koba', sortOrder: 1 },
      { projectId: p3.id, icon: '👑', shortText: 'Supersized 4 BHK Homes (450 - 711 sq.yd)', sortOrder: 2 },
      { projectId: p3.id, icon: '🏊', shortText: 'Designer Swimming Pool with Waterfall Jets', sortOrder: 3 },
      { projectId: p3.id, icon: '🎬', shortText: 'Private Mini Cinema Theatre & High-Tech Gym', sortOrder: 4 },
      { projectId: p3.id, icon: '🚗', shortText: '3 Allotted Covered Parkings Per Residence', sortOrder: 5 },
    ],
  })

  await db.amenity.createMany({
    data: [
      { projectId: p3.id, name: 'Designer Swimming Pool with Cascade Jets', description: 'Shimmering lap pool with waterfall spouts, poolside sun loungers, and pergola sun canopy.', icon: '🏊', sortOrder: 0 },
      { projectId: p3.id, name: 'State-of-the-Art Gymnasium', description: 'Complete fitness center with water rowers, treadmills, elliptical trainers, free weights, and stretching zone.', icon: '💪', sortOrder: 1 },
      { projectId: p3.id, name: 'Private Mini Cinema Theatre', description: 'Acoustically treated private cinema with tiered luxury recliner armchairs and high-definition projector setup.', icon: '🎬', sortOrder: 2 },
      { projectId: p3.id, name: 'Billiards & Indoor Games Lounge', description: 'Recreational lounge featuring tournament pool table, table tennis, carrom, and board games.', icon: '🎮', sortOrder: 3 },
      { projectId: p3.id, name: 'Toddlers Playroom & Indoor Creche', description: 'Padded discovery playroom with interactive learning toys and baby-safe soft flooring.', icon: '👶', sortOrder: 4 },
      { projectId: p3.id, name: 'Children\'s Outdoor Adventure Arena', description: 'Safe outdoor multi-play turf area equipped with fun spring riders, climbing nets, and slides.', icon: '🎡', sortOrder: 5 },
      { projectId: p3.id, name: 'Basketball & Multi-Sports Half Court', description: 'All-weather anti-skid polyurethane sports court with perimeter floodlighting.', icon: '🏀', sortOrder: 6 },
      { projectId: p3.id, name: 'Giant Outdoor Floor Chess Arena', description: 'Life-size outdoor chess board on paved terrace garden for strategic fun.', icon: '♟️', sortOrder: 7 },
      { projectId: p3.id, name: 'Giant Outdoor Ludo Court', description: 'Vibrant, oversized ground ludo court for family and children group games.', icon: '🎲', sortOrder: 8 },
      { projectId: p3.id, name: 'Grand Double-Lounge Entrance Foyers', description: 'Double-height grand lobbies (Block A: 29\'8" x 16\'0", Block B: 23\'8" x 21\'3") with Italian marble and designer sofas.', icon: '🏛️', sortOrder: 9 },
      { projectId: p3.id, name: 'Central Landscaped Green Courtyard', description: 'Vehicle-free central garden with manicured lawns, illuminated paving, and flowering trees.', icon: '🌿', sortOrder: 10 },
      { projectId: p3.id, name: 'Traditional Gujarati Jhula Courts', description: 'Brass-chain swing alcoves situated amidst serene green sit-outs for relaxed evening conversations.', icon: '🛋️', sortOrder: 11 },
      { projectId: p3.id, name: 'Library & Study Sanctuary', description: 'Quiet sunlit reading lounge (18\'5" x 15\'1") with curated book collections and study desks.', icon: '📚', sortOrder: 12 },
      { projectId: p3.id, name: 'Multipurpose Banquet & Gathering Hall', description: 'Ground-level spacious hall for resident community celebrations, cultural festivities, and parties.', icon: '🎉', sortOrder: 13 },
      { projectId: p3.id, name: 'Society Administration & Manager\'s Office', description: 'Dedicated executive office and administrative cabin for facility managers on the ground floor.', icon: '🏢', sortOrder: 14 },
      { projectId: p3.id, name: '3 High-Speed Elevators Per Tower', description: 'Kone / Schindler elevators (2 passenger + 1 stretcher/utility lift) with ARD automatic rescue device.', icon: '⬆️', sortOrder: 15 },
      { projectId: p3.id, name: '3 Allotted Covered Parkings Per Residence', description: 'Dedicated numbered parking bays across ground and dual-level basement floors.', icon: '🚗', sortOrder: 16 },
      { projectId: p3.id, name: '24x7 Security with CCTV Surveillance', description: 'Multi-tier security with round-the-clock security personnel and HD CCTV network.', icon: '🔒', sortOrder: 17 },
      { projectId: p3.id, name: 'Advanced Fire Alarm & Hydrant Safety', description: 'Comprehensive fire safety network with wet risers, smoke sensors, and hose reels.', icon: '🧯', sortOrder: 18 },
      { projectId: p3.id, name: 'VRV / VRF Air Conditioning Provision', description: 'Pre-installed refrigerant piping and electrical points for centralized energy-efficient VRV AC.', icon: '❄️', sortOrder: 19 },
      { projectId: p3.id, name: 'Vastu-Compliant 3-Side Open Homes', description: 'Every residence engineered according to Vastu principles ensuring positive flow, light, and cross-ventilation.', icon: '☀️', sortOrder: 20 },
      { projectId: p3.id, name: 'Rainwater Harvesting & Ground Recharge', description: 'Eco-conscious percolation wells recharging local groundwater aquifers.', icon: '🌧️', sortOrder: 21 },
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
      { projectId: p6.id, moduleType: 'BROCHURE', sortOrder: 11, config: '{"headline":"Official Embrace The Wind Brochure","pdfFileName":"Embrace_The_Wind_Brochure.pdf","pageCount":36,"publicUrl":"https://showcase.salesstudio.in/media/cmt77gqdq0000oyixta32c8gt_DOCUMENT_Embrace_The_Wind_Brochure.pdf","publicBrochureUrl":"https://showcase.salesstudio.in/media/cmt77gqdq0000oyixta32c8gt_DOCUMENT_Embrace_The_Wind_Brochure.pdf"}' },
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

  // Project 7 — The Stately (Roman-Themed Neoclassical Residences)
  const p7 = await db.project.create({
    data: {
      name: 'The Stately',
      developer: 'Samved Group',
      reraNumber: 'PR/GJ/GANDHINAGAR/GANDHINAGAR/Gandhinagar Municipal Corporation/MAA14924/100325/311230',
      location: 'Kudasan, Near PDPU Crossroads & NH-147, Gandhinagar - 382421',
      description: "Gandhinagar's first Roman-themed neoclassical residences by Samved Group, situated in prime Kudasan near PDPU crossroads & NH-147. Features 55% open space, 3-side open well-ventilated layouts, 2 allotted car parkings per home, 24-foot panoramic balconies, grand sculpture entrance foyer, 750+ sq.m central gardens, and 30 curated royal lifestyle amenities across 3 iconic 14-storey towers with boutique ground-level commercial arcades.",
      type: 'MIXED_USE',
      status: 'ACTIVE',
      possessionStatus: 'UNDER_CONSTRUCTION',
      possessionDate: 'December 2030',
      priceRangeMin: 12100000,
      priceRangeMax: 26500000,
      themeAccentColor: '#8B263E',
      themeFontPairing: 'Lora',
      isFeatured: true,
    },
  })

  await db.projectModule.createMany({
    data: [
      {
        projectId: p7.id,
        moduleType: 'OVERVIEW',
        sortOrder: 0,
        config: JSON.stringify({
          heroHeadline: 'Live a Noble Life at The Stately',
          subHeadline: "Gandhinagar's First Roman-Themed 3 & 4 BHK Luxury Residences in Kudasan Near PDPU Crossroads",
          stats: [
            'First Roman-Themed Residences',
            '55% Open Space & Central Park',
            '2 Allotted Car Parkings per Home',
            '3-Side Open Cross-Ventilated Homes',
            '24 Ft Long Panoramic Balconies',
            '3 BHK (146-156 sq.yd) • 4 BHK (191 sq.yd)',
            'Starting ₹1.21 Cr* Onwards',
            'RERA: MAA14924/100325/311230'
          ],
          ctaLabel: 'Explore Residences & Floor Plans',
          websiteUrl: 'https://thestately.co.in/'
        })
      },
      {
        projectId: p7.id,
        moduleType: 'USP_SPOTLIGHT',
        sortOrder: 1,
        config: JSON.stringify({
          headline: 'Neoclassical Roman Grandeur Meets Contemporary Luxury',
          subtext: 'Designed with Roman columns, triangular pediments, and royal floral landscapes for an uncompromising luxury lifestyle.',
          highlights: [
            {
              title: 'First Roman-Themed Residences in Gandhinagar',
              description: 'Majestic arched elevations, classical pediments, Corinthian colonnades, and double-height entrance gate with royal carriage motif.',
              badge: 'Neoclassical Icon'
            },
            {
              title: '2 Allotted Car Parking for Every Home',
              description: 'Dedicated double parking bays allocated for every residence across basement and stilt levels, ensuring zero parking hassles.',
              badge: 'Rare Luxury Standard'
            },
            {
              title: '55% Open Space & 750+ sq.m Central Park',
              description: 'Over 55% open space with vehicle-free central gardens, water cascades, gazebo lounge, and outdoor leisure courts.',
              badge: '55% Open Space'
            },
            {
              title: '3-Side Open Homes with 24ft Panoramic Balcony',
              description: 'Maximized daylight and cross-ventilation with 3-side open residences and an expansive 24-foot private balcony lounge.',
              badge: 'Signature Living'
            }
          ]
        })
      },
      { projectId: p7.id, moduleType: 'GALLERY', sortOrder: 2, config: '{}' },
      {
        projectId: p7.id,
        moduleType: 'AMENITIES',
        sortOrder: 3,
        config: JSON.stringify({
          headline: '30 Curated Royal Lifestyle & Wellbeing Amenities',
          subtext: 'Thoughtfully divided into Wellbeing Essentials and Recreation Pleasures for every generation of your family.'
        })
      },
      {
        projectId: p7.id,
        moduleType: 'MASTER_PLAN',
        sortOrder: 4,
        config: JSON.stringify({
          description: 'Master layout spanning three 14-storey residential blocks (Block A: 4 BHK, Block B & C: 3 BHK), 24 ground-level commercial showrooms, 55% open space with 750+ sq.m central vehicle-free garden, 2 allotted car parking bays per residence, and dual-level parking.'
        })
      },
      {
        projectId: p7.id,
        moduleType: 'LOCATION',
        sortOrder: 5,
        config: JSON.stringify({
          mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3667.9728887206384!2d72.63104127509652!3d23.171189579069857!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395c2b964e68381b%3A0x35c17c502030dce6!2sThe%20Stately%20by%20Samved!5e0!3m2!1sen!2sin!4v1776929965372!5m2!1sen!2sin',
          addressLine: 'The Stately, Kudasan, Near PDPU Crossroads & NH-147, Gandhinagar - 382421',
          landmarks: [
            { name: 'PDPU Crossroads', distance: '5 Mins', category: 'transit' },
            { name: 'NH-147 Highway Corridor', distance: '2 Mins', category: 'transit' },
            { name: 'TCS Garima Park', distance: '10 Mins', category: 'transit' },
            { name: 'GIFT City Financial Hub', distance: '10 Mins', category: 'transit' },
            { name: 'Raysan / Randesan Metro Station', distance: '3 Mins', category: 'transit' },
            { name: 'Ahmedabad International Airport', distance: '15 Mins', category: 'transit' },
            { name: 'Achiever School', distance: '2 Mins', category: 'education' },
            { name: 'PDPU / PDEU University Campus', distance: '5 Mins', category: 'education' },
            { name: 'GNLU (Gujarat National Law University)', distance: '6 Mins', category: 'education' },
            { name: 'DA-IICT & NID / NIFT', distance: '6 Mins', category: 'education' },
            { name: 'Jamnabai Narsee International School', distance: '6 Mins', category: 'education' },
            { name: 'SCAI Multispeciality Hospital', distance: '3 Mins', category: 'healthcare' },
            { name: 'Vachhani Hospital', distance: '5 Mins', category: 'healthcare' },
            { name: 'SMVS Swaminarayan Hospital', distance: '4 Mins', category: 'healthcare' },
            { name: 'The Landmark Mall', distance: '4 Mins', category: 'retail' },
            { name: 'Pramukh Orbit Mall', distance: '5 Mins', category: 'retail' },
            { name: 'Swagat Holiday Mall', distance: '10 Mins', category: 'retail' },
            { name: 'D-Mart Kudasan', distance: '3 Mins', category: 'retail' }
          ]
        })
      },
      {
        projectId: p7.id,
        moduleType: 'PRICING',
        sortOrder: 6,
        config: JSON.stringify({
          headline: 'Official Pricing & Value Proposition',
          subtext: 'Official website pricing starting at ₹1.21 Cr* onwards with 2 dedicated car parkings included for every residence.',
          pricingTiers: [
            {
              configuration: '3 BHK Luxury Residences (146 - 156 sq.yd)',
              priceFrom: 12100000,
              priceTo: 13500000,
              note: '1,314 - 1,404 sq.ft Carpet (146 - 156 sq.yd) • 2,080 - 2,150 sq.ft Built-up • Starting ₹1.21 Cr* Onwards • 2 Allotted Parkings • 3-Side Open'
            },
            {
              configuration: '4 BHK Palatial Residences (191 sq.yd)',
              priceFrom: 17100000,
              priceTo: 19500000,
              note: '1,719 sq.ft Carpet (191 sq.yd) • 2,750 sq.ft Built-up • Price on Request (Starting ~₹1.71 Cr) • 2 Allotted Parkings • 24\'10" Balcony • Private Foyer'
            },
            {
              configuration: '3 BHK Skydeck Penthouse (Block B & C)',
              priceFrom: 18500000,
              priceTo: 21000000,
              note: '2,600 sq.ft Built-up • 650 sq.ft Personal Open-Air Sky Terrace • Top 13th Floor'
            },
            {
              configuration: '4 BHK Palatial Skydeck Penthouse (Block A)',
              priceFrom: 24500000,
              priceTo: 26500000,
              note: '3,850 sq.ft Built-up • Massive 1,950 sq.ft Personal Skydeck (34\'6" x 56\'10") • Top 13th Floor'
            }
          ]
        })
      },
      { projectId: p7.id, moduleType: 'COMPARE_UNITS', sortOrder: 7, config: '{}' },
      {
        projectId: p7.id,
        moduleType: 'CALCULATORS',
        sortOrder: 8,
        config: JSON.stringify({
          defaultLoanAmount: 12100000,
          defaultTenure: 20,
          defaultRate: 8.5
        })
      },
      {
        projectId: p7.id,
        moduleType: 'COMMUNITY_LIFESTYLE',
        sortOrder: 9,
        config: JSON.stringify({
          headline: 'A Harmonious Life Beyond Four Walls',
          subtext: 'Where timeless classical aesthetics blend with modern community camaraderie and wellness.'
        })
      },
      {
        projectId: p7.id,
        moduleType: 'RERA_TRUST',
        sortOrder: 10,
        config: JSON.stringify({
          reraNo: 'PR/GJ/GANDHINAGAR/GANDHINAGAR/Gandhinagar Municipal Corporation/MAA14924/100325/311230',
          validityDate: 'December 2030',
          approvedBy: 'GUJRERA (Gujarat Real Estate Regulatory Authority)',
          detailsText: 'The Stately is fully registered and approved by GUJRERA. Developed by Samved Group and Mahadev Buildcon. Lead Marketing Agency: Aurum Analytica Private Limited. Official Website: https://thestately.co.in/.'
        })
      },
      {
        projectId: p7.id,
        moduleType: 'BROCHURE',
        sortOrder: 11,
        config: JSON.stringify({
          buttonLabel: 'Download The Stately Official Brochure (PDF)',
          pageCount: 44,
          publicUrl: 'https://showcase.salesstudio.in/media/cmst2st3m000w7tgjuphz8820_DOCUMENT_The_Stately_Brochure.pdf',
          publicBrochureUrl: 'https://showcase.salesstudio.in/media/cmst2st3m000w7tgjuphz8820_DOCUMENT_The_Stately_Brochure.pdf',
          projectWebUrl: 'https://thestately.co.in/'
        })
      }
    ]
  })

  const tower7A = await db.tower.create({ data: { projectId: p7.id, name: 'Block A (4 BHK Residences)' } })
  const tower7B = await db.tower.create({ data: { projectId: p7.id, name: 'Block B (3 BHK Residences)' } })
  const tower7C = await db.tower.create({ data: { projectId: p7.id, name: 'Block C (3 BHK Residences)' } })

  await db.unit.createMany({
    data: [
      { towerId: tower7A.id, floor: 5, unitNumber: 'A-501', configuration: '4 BHK', carpetArea: 1719, builtUpArea: 2750, superBuiltUpArea: 3500, price: 17850000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', facing: 'EAST', notes: '191 sq.yd carpet • 2 Allotted Parkings • 24\'10" Balcony • Personal Foyer' },
      { towerId: tower7A.id, floor: 13, unitNumber: 'A-1301', configuration: '4 BHK Penthouse', carpetArea: 2650, builtUpArea: 3850, superBuiltUpArea: 4800, price: 26500000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', facing: 'EAST', notes: 'Palatial Skydeck Penthouse • Massive 1,950 sq.ft Personal Skydeck' },
      { towerId: tower7B.id, floor: 4, unitNumber: 'B-401', configuration: '3 BHK', carpetArea: 1404, builtUpArea: 2150, superBuiltUpArea: 2720, price: 12800000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', facing: 'NORTH', notes: '156 sq.yd carpet • 2 Allotted Parkings • 24\'10" Balcony • Corner Layout' },
      { towerId: tower7B.id, floor: 1, unitNumber: 'B-102', configuration: '3 BHK', carpetArea: 1314, builtUpArea: 2080, superBuiltUpArea: 2650, price: 12200000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', facing: 'EAST', notes: '146 sq.yd carpet • Starting ₹1.21 Cr* • 2 Allotted Parkings • Garden Facing' },
      { towerId: tower7C.id, floor: 8, unitNumber: 'C-801', configuration: '3 BHK', carpetArea: 1404, builtUpArea: 2150, superBuiltUpArea: 2720, price: 13200000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', facing: 'EAST', notes: '156 sq.yd carpet • 2 Allotted Parkings • 24\'10" Balcony • Corner Layout' },
      { towerId: tower7C.id, floor: 13, unitNumber: 'C-1301', configuration: '3 BHK Penthouse', carpetArea: 1850, builtUpArea: 2600, superBuiltUpArea: 3300, price: 18500000, priceLabel: 'OFFICIAL', status: 'AVAILABLE', facing: 'EAST', notes: 'Exclusive 3 BHK Skydeck Penthouse with 600 sq.ft Open-Air Terrace' },
    ]
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
