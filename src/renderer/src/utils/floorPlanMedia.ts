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
  fallbackImage?: string
}): string {
  const { unit, towerName, mediaList = [], fallbackImage } = options
  const floorPlans = mediaList.filter(
    (m) => m.category?.toUpperCase() === 'FLOOR_PLAN'
  )

  // 1. Direct unit floorPlanMediaId match (check all mediaList)
  if (unit?.floorPlanMediaId) {
    const matched = mediaList.find((m) => m.id === unit.floorPlanMediaId)
    if (matched) return toMediaUrl(matched.filePath)
  }

  // 2. Tower name or floor match in filename / tags among FLOOR_PLAN media
  if (towerName) {
    const normalizedTower = towerName.toLowerCase().replace(/[^a-z0-9]/g, '')
    const towerMatched = floorPlans.find((m) => {
      const name = (m.originalName || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      const tags = (m.tags || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      return name.includes(normalizedTower) || tags.includes(normalizedTower)
    })
    if (towerMatched) return toMediaUrl(towerMatched.filePath)
  }

  // 3. Unit configuration match (e.g. "4BHK", "3BHK", "2 BHK")
  if (unit?.configuration) {
    const normalizedConfig = unit.configuration.toLowerCase().replace(/[^a-z0-9]/g, '')
    const configMatched = floorPlans.find((m) => {
      const name = (m.originalName || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      return name.includes(normalizedConfig)
    })
    if (configMatched) return toMediaUrl(configMatched.filePath)
  }

  // 4. Fallback to first available FLOOR_PLAN image
  if (floorPlans.length > 0) {
    return toMediaUrl(floorPlans[0].filePath)
  }

  // 5. Check if any project media in other categories is named like a floor plan or layout
  const keywordMatch = mediaList.find((m) => {
    const n = (m.originalName || '').toLowerCase()
    return n.includes('floor') || n.includes('plan') || n.includes('layout')
  })
  if (keywordMatch) {
    return toMediaUrl(keywordMatch.filePath)
  }

  // 6. Explicit fallback image (e.g. project master plan image if no separate floor plans exist)
  if (fallbackImage) {
    return toMediaUrl(fallbackImage)
  }

  return ''
}
