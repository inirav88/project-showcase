import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import UnitDetailModal from './UnitDetailModal'

describe('UnitDetailModal', () => {
  const sampleUnit = {
    id: 'u1',
    unitNumber: '302',
    floor: 3,
    configuration: '3 BHK Luxury',
    carpetArea: 1450,
    builtUpArea: 1850,
    facing: 'East',
    price: 18500000,
    priceLabel: 'OFFICIAL',
    status: 'AVAILABLE'
  }

  it('renders unit details and dimensions', () => {
    render(
      <UnitDetailModal
        unit={sampleUnit}
        towerName="Tower B"
        projectName="Grand Heights"
        floorPlanImage="/media/test_plan.png"
        isShortlisted={false}
        onToggleShortlist={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText(/Unit 302/i)).toBeDefined()
    expect(screen.getAllByText(/3 BHK Luxury/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/1450 sqft/i)).toBeDefined()
    expect(screen.getByText(/East/i)).toBeDefined()
  })

  it('fires onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(
      <UnitDetailModal
        unit={sampleUnit}
        towerName="Tower B"
        projectName="Grand Heights"
        floorPlanImage=""
        isShortlisted={false}
        onToggleShortlist={vi.fn()}
        onClose={onClose}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
