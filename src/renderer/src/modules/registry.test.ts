import { describe, it, expect } from 'vitest'
import { moduleRegistry, isRegisteredModule } from './registry'

describe('moduleRegistry', () => {
  it('has entries for all standard module types', () => {
    const required = [
      'OVERVIEW', 'GALLERY', 'VIDEOS', 'MASTER_PLAN', 'AMENITIES',
      'LOCATION', 'PRICING', 'BROCHURE', 'CALCULATORS', 'USP_SPOTLIGHT',
      'FOUNDERS_NOTE', 'SUSTAINABILITY', 'SMART_HOME', 'CONSTRUCTION_TIMELINE',
    ]
    required.forEach((type) => {
      expect(moduleRegistry[type], `Missing registry entry: ${type}`).toBeDefined()
    })
  })
})

describe('isRegisteredModule', () => {
  it('returns true for known module types', () => {
    expect(isRegisteredModule('OVERVIEW')).toBe(true)
    expect(isRegisteredModule('GALLERY')).toBe(true)
  })
  it('returns false for unknown strings', () => {
    expect(isRegisteredModule('TOTALLY_FAKE_MODULE')).toBe(false)
  })
})
