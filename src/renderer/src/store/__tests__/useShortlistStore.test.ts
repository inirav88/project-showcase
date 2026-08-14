import { describe, it, expect, beforeEach } from 'vitest'
import { useShortlistStore } from '../useShortlistStore'

describe('useShortlistStore Zustand state', () => {
  beforeEach(() => {
    useShortlistStore.getState().clearShortlist()
  })

  it('allows adding, checking, and removing items from the shortlist state', () => {
    const item = {
      unitId: 'u1',
      unitNumber: 'A-1001',
      towerName: 'Tower A',
      projectName: 'Skyline Residences',
      configuration: '3BHK',
      price: 11000000,
    }

    const store = useShortlistStore.getState()
    expect(store.isInShortlist('u1')).toBe(false)

    // Add item
    store.addItem(item)
    expect(useShortlistStore.getState().isInShortlist('u1')).toBe(true)
    expect(useShortlistStore.getState().items.length).toBe(1)

    // Duplicate item add checks
    useShortlistStore.getState().addItem(item)
    expect(useShortlistStore.getState().items.length).toBe(1)

    // Remove item
    useShortlistStore.getState().removeItem('u1')
    expect(useShortlistStore.getState().isInShortlist('u1')).toBe(false)
    expect(useShortlistStore.getState().items.length).toBe(0)
  })
})
