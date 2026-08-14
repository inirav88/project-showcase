import '../../../../test/polyfill'
import React from 'react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProjectShowcase from '../ProjectShowcase'

// Mock registry module synchronously to avoid lazy-load race conditions
vi.mock('../../../modules/registry', () => ({
  moduleRegistry: {
    OVERVIEW: () => <div data-testid="module-OVERVIEW">Mock Overview</div>,
  },
  isRegisteredModule: (type: string) => type === 'OVERVIEW',
}))

const mockProject = {
  id: 'p1',
  name: 'Skyline Residences',
  developer: 'Ahmedabad Builders Ltd',
  reraNumber: 'RAJ/P/2024/001234',
  themeAccentColor: '#1B4FFF',
  themeFontPairing: 'Outfit',
  modules: [
    { id: 'm1', moduleType: 'OVERVIEW', config: '{}', sortOrder: 0, isVisible: true },
  ],
}

beforeAll(() => {
  // Safe injection of window.api mock
  const w = window as any
  w.api = {
    invoke: vi.fn((channel, ..._args) => {
      if (channel === 'project:get') return Promise.resolve(mockProject)
      if (channel === 'module:list') return Promise.resolve(mockProject.modules)
      return Promise.resolve([])
    }),
    on: () => () => {},
  }
})

describe('ProjectShowcase Page Navigation and Theme Integration', () => {
  it('loads project details, applies custom themes, and renders visible modules', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/kiosk/project/p1']}>
          <Routes>
            <Route path="/kiosk/project/:projectId" element={<ProjectShowcase />} />
          </Routes>
        </MemoryRouter>
      )
    })

    await waitFor(() => {
      expect(screen.getByText('Skyline Residences')).toBeInTheDocument()
      expect(screen.getByText('RERA: RAJ/P/2024/001234')).toBeInTheDocument()
      expect(screen.getByTestId('module-OVERVIEW')).toBeInTheDocument()
    })

    // Check custom CSS custom properties variables applied to root node
    expect(document.documentElement.style.getPropertyValue('--project-accent')).toBe('#1B4FFF')
    expect(document.documentElement.style.getPropertyValue('--project-font')).toBe('Outfit')
  })
})
