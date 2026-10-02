import '../../../test/polyfill'
import React from 'react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import MasterPlanModule from './MasterPlanModule'

const mockProjectData = {
  id: 'proj-123',
  name: 'Skyline Palms',
  towers: [
    {
      id: 'tower-a',
      name: 'Tower A',
      units: [
        {
          id: 'u-101',
          unitNumber: '101',
          floor: 1,
          configuration: '3 BHK',
          carpetArea: 1450,
          builtUpArea: 1850,
          price: 18500000,
          priceLabel: 'OFFICIAL',
          status: 'AVAILABLE'
        },
        {
          id: 'u-201',
          unitNumber: '201',
          floor: 2,
          configuration: '3 BHK',
          carpetArea: 1450,
          builtUpArea: 1850,
          price: 19000000,
          priceLabel: 'OFFICIAL',
          status: 'AVAILABLE'
        }
      ]
    },
    {
      id: 'tower-b',
      name: 'Tower B',
      units: []
    }
  ]
}

const mockMediaList = [
  {
    id: 'm-fp1',
    originalName: 'Tower A Floor Plan.png',
    filePath: '/media/fp_tower_a.png',
    category: 'FLOOR_PLAN',
    tags: 'tower a, 3bhk'
  }
]

beforeAll(() => {
  const w = window as any
  w.api = {
    invoke: vi.fn((channel: string) => {
      if (channel === 'project:get') return Promise.resolve(mockProjectData)
      if (channel === 'media:list') return Promise.resolve(mockMediaList)
      return Promise.resolve([])
    }),
    on: () => () => {}
  }
})

describe('MasterPlanModule 3-Tier Drill-Down', () => {
  it('renders Level 1 Master Plan and navigates through Tower, Floor, and Unit levels', async () => {
    let container: HTMLElement
    await act(async () => {
      const rendered = render(<MasterPlanModule config={{}} projectId="proj-123" />)
      container = rendered.container
    })

    // Level 1: Verify Towers are rendered on Master Plan
    await waitFor(() => {
      expect(screen.getAllByText(/Tower A/i).length).toBeGreaterThanOrEqual(1)
    })

    // Click Tower A to enter Level 2
    const towerABtns = screen.getAllByRole('button', { name: /Tower A/i })
    await act(async () => {
      fireEvent.click(towerABtns[0])
    })

    // Level 2: Verify Tower view elements
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Back to Master Plan/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /Floor 1/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /Floor 2/i })).toBeDefined()
      expect(screen.getByText(/Unit 101/i)).toBeDefined()
    })

    // Switch to Floor 2
    const floor2Btn = screen.getByRole('button', { name: /Floor 2/i })
    await act(async () => {
      fireEvent.click(floor2Btn)
    })

    // Verify Floor 2 units are displayed
    await waitFor(() => {
      expect(screen.getByText(/Unit 201/i)).toBeDefined()
    })

    // Click Unit 201 to enter Level 3 (Unit Detail Modal)
    const unit201Card = screen.getByText(/Unit 201/i).closest('div')
    expect(unit201Card).toBeDefined()
    await act(async () => {
      fireEvent.click(unit201Card!)
    })

    // Level 3: Verify UnitDetailModal is opened
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined()
      expect(screen.getByRole('button', { name: /Close/i })).toBeDefined()
    })

    // Close modal
    const closeBtn = screen.getByRole('button', { name: /Close/i })
    await act(async () => {
      fireEvent.click(closeBtn)
    })

    // Back to Master Plan
    const backBtn = screen.getByRole('button', { name: /Back to Master Plan/i })
    await act(async () => {
      fireEvent.click(backBtn)
    })

    // Verify back on Level 1
    await waitFor(() => {
      expect(screen.getByAltText(/Master Plan/i)).toBeDefined()
    })
  })
})
