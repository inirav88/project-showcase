import { describe, it, expect } from 'vitest'
import { resolveFloorPlanImage, type MediaItem, type UnitLike } from './floorPlanMedia'

describe('resolveFloorPlanImage', () => {
  const sampleMedia: MediaItem[] = [
    { id: 'm1', originalName: 'Tower A Typical Floor Plan.jpg', filePath: '/media/fp_tower_a.jpg', category: 'FLOOR_PLAN' },
    { id: 'm2', originalName: '3BHK Luxury Layout.png', filePath: '/media/fp_3bhk.png', category: 'FLOOR_PLAN' },
    { id: 'm3', originalName: 'Master Brochure Floorplan.png', filePath: '/media/fp_general.png', category: 'FLOOR_PLAN' }
  ]

  it('returns unit-linked media when floorPlanMediaId matches', () => {
    const unit: UnitLike = { id: 'u1', unitNumber: '101', floor: 1, configuration: '3BHK', floorPlanMediaId: 'm2' }
    const url = resolveFloorPlanImage({ unit, towerName: 'Tower A', floorNumber: 1, mediaList: sampleMedia })
    expect(url).toContain('fp_3bhk.png')
  })

  it('matches tower name in media list when unit has no floorPlanMediaId', () => {
    const unit: UnitLike = { id: 'u2', unitNumber: '102', floor: 1, configuration: '2BHK' }
    const url = resolveFloorPlanImage({ unit, towerName: 'Tower A', floorNumber: 1, mediaList: sampleMedia })
    expect(url).toContain('fp_tower_a.jpg')
  })

  it('falls back to the first available FLOOR_PLAN media when no tower-specific match exists', () => {
    const url = resolveFloorPlanImage({ towerName: 'Tower C', floorNumber: 5, mediaList: sampleMedia })
    expect(url).toContain('fp_tower_a.jpg')
  })

  it('returns explicit fallbackImage when media list has no floor plan media', () => {
    const url = resolveFloorPlanImage({ towerName: 'Tower B', floorNumber: 1, mediaList: [], fallbackImage: '/media/master_site.jpg' })
    expect(url).toContain('master_site.jpg')
  })

  it('returns empty string when media list has no floor plan media and no fallback', () => {
    const url = resolveFloorPlanImage({ towerName: 'Tower B', floorNumber: 1, mediaList: [] })
    expect(url).toBe('')
  })
})
