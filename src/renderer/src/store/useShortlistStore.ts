import { create } from 'zustand'

export interface ShortlistItem {
  unitId: string
  unitNumber: string
  towerName: string
  projectName: string
  configuration: string
  price: number
}

interface ShortlistState {
  items: ShortlistItem[]
  addItem: (item: ShortlistItem) => void
  removeItem: (unitId: string) => void
  clearShortlist: () => void
  isInShortlist: (unitId: string) => boolean
}

export const useShortlistStore = create<ShortlistState>((set, get) => ({
  items: [],
  addItem: (item) => {
    const exists = get().items.some((i) => i.unitId === item.unitId)
    if (!exists) {
      set({ items: [...get().items, item] })
    }
  },
  removeItem: (unitId) => {
    set({ items: get().items.filter((i) => i.unitId !== unitId) })
  },
  clearShortlist: () => set({ items: [] }),
  isInShortlist: (unitId) => get().items.some((i) => i.unitId === unitId),
}))
