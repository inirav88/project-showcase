import { toMediaUrl } from './media'

export interface MediaItem {
  id: string
  originalName: string
  filePath: string
  category: string
  tags?: string
}

export interface UnitLike {
  id?: string
  unitNumber?: string
  floor?: number
  configuration?: string
  floorPlanMediaId?: string | null
}

export function resolveFloorPlanImage(options: {
  unit?: UnitLike | null
  towerName?: string
  floorNumber?: number
  mediaList?: MediaItem[]
}): string {
  const { unit, towerName, mediaList = [] } = options
  const floorPlans = mediaList.filter(
    (m) => m.category?.toUpperCase() === 'FLOOR_PLAN'
  )

  // 1. Direct unit floorPlanMediaId match
  if (unit?.floorPlanMediaId) {
    const matched = floorPlans.find((m) => m.id === unit.floorPlanMediaId)
    if (matched) return toMediaUrl(matched.filePath)
  }

  // 2. Tower name or floor match in filename / tags
  if (towerName) {
    const normalizedTower = towerName.toLowerCase().replace(/[^a-z0-9]/g, '')
    const towerMatched = floorPlans.find((m) => {
      const name = (m.originalName || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      const tags = (m.tags || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      return name.includes(normalizedTower) || tags.includes(normalizedTower)
    })
    if (towerMatched) return toMediaUrl(towerMatched.filePath)
  }

  // 3. Unit configuration match (e.g. "3BHK", "2 BHK")
  if (unit?.configuration) {
    const normalizedConfig = unit.configuration.toLowerCase().replace(/[^a-z0-9]/g, '')
    const configMatched = floorPlans.find((m) => {
      const name = (m.originalName || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      return name.includes(normalizedConfig)
    })
    if (configMatched) return toMediaUrl(configMatched.filePath)
  }

  // 4. Fallback to first available floor plan image
  if (floorPlans.length > 0) {
    return toMediaUrl(floorPlans[0].filePath)
  }

  return ''
}
