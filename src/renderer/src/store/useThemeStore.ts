import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  fontScale: number
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  cycleFontScale: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark', // Default to luxury dark theme
      fontScale: 1.0, // Default font scale
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light'
          document.documentElement.setAttribute('data-theme', newTheme)
          return { theme: newTheme }
        }),
      setTheme: (theme: Theme) => {
        document.documentElement.setAttribute('data-theme', theme)
        set({ theme })
      },
      cycleFontScale: () =>
        set((state) => {
          const scales = [1.0, 1.25, 1.5]
          const currentScale = state.fontScale || 1.0
          const idx = scales.indexOf(currentScale)
          const nextScale = scales[(idx + 1) % scales.length]
          document.documentElement.style.setProperty('--font-scale', String(nextScale))
          return { fontScale: nextScale }
        }),
    }),
    {
      name: 'showcaseos-theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.setAttribute('data-theme', state.theme)
          document.documentElement.style.setProperty('--font-scale', String(state.fontScale || 1.0))
        }
      },
    }
  )
)
