import '../../test/polyfill'
import React from 'react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { HashRouter } from 'react-router-dom'
import ModuleRenderer from './ModuleRenderer'

// Mock the registry synchronously to avoid Suspense lazy-loading race conditions in test environment
vi.mock('./registry', () => ({
  moduleRegistry: {
    OVERVIEW: ({ config }: any) => <div data-testid="module-OVERVIEW">{config.heroHeadline}</div>,
    GALLERY: () => <div data-testid="module-GALLERY">GALLERY</div>,
  },
  isRegisteredModule: (type: string) => type === 'OVERVIEW' || type === 'GALLERY',
}))

// Define window.api safely on the existing window object without overwriting JSDOM window
const mockInvoke = vi.fn().mockResolvedValue([
  { id: 'm1', moduleType: 'OVERVIEW', config: '{"heroHeadline":"Ahmedabad Living"}', sortOrder: 0, isVisible: true },
  { id: 'm2', moduleType: 'GALLERY', config: '{}', sortOrder: 1, isVisible: true },
  { id: 'm3', moduleType: 'UNKNOWN_FUTURE', config: '{}', sortOrder: 2, isVisible: true },
])

beforeAll(() => {
  // Re-apply polyfills inside beforeAll to prevent Vitest JSDOM environment reset from wiping them out
  class HTMLIFrameElementMock {}
  class SelectionMock {}
  
  const w = window as any
  w.HTMLIFrameElement = w.HTMLIFrameElement || HTMLIFrameElementMock
  w.Selection = w.Selection || SelectionMock
  
  // Safe injection of IPC mock API
  w.api = {
    invoke: mockInvoke,
    on: () => () => {},
  }
})

describe('ModuleRenderer', () => {
  it('renders standard visible modules and fallback for unknown types', async () => {
    await act(async () => {
      render(
        <HashRouter>
          <ModuleRenderer projectId="p1" />
        </HashRouter>
      )
    })

    // Wait for data load and check components
    await waitFor(() => {
      expect(screen.getByTestId('module-OVERVIEW')).toHaveTextContent('Ahmedabad Living')
      expect(screen.getByTestId('module-GALLERY')).toBeInTheDocument()
      expect(screen.getByTestId('module-unknown')).toBeInTheDocument()
    })
  })

  it('filters out invisible modules', async () => {
    // Override standard mock to return invisible module
    mockInvoke.mockResolvedValueOnce([
      { id: 'm1', moduleType: 'OVERVIEW', config: '{}', sortOrder: 0, isVisible: false },
    ])

    await act(async () => {
      render(
        <HashRouter>
          <ModuleRenderer projectId="p1" />
        </HashRouter>
      )
    })

    await waitFor(() => {
      expect(screen.queryByTestId('module-OVERVIEW')).not.toBeInTheDocument()
    })
  })
})
