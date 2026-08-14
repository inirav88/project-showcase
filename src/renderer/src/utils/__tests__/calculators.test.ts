import { describe, it, expect } from 'vitest'
import { calculateEmi, calculateInvestmentRoi, calculateMatchScore } from '../calculators'

describe('calculateEmi', () => {
  it('correctly calculates monthly home loan payments and amortization schedules', () => {
    const principal = 5000000 // 50 L
    const rate = 8.5 // 8.5% interest
    const tenure = 20 // 20 years

    const res = calculateEmi(principal, rate, tenure)

    expect(res.monthlyPayment).toBeCloseTo(43391, 0)
    expect(res.totalPayment).toBeGreaterThan(principal)
    expect(res.amortizationSchedule.length).toBe(240)
    expect(res.amortizationSchedule[0].interestPaid).toBeCloseTo(35417, 0)
  })
})

describe('calculateInvestmentRoi', () => {
  it('correctly calculates rental yield and cash returns', () => {
    const params = {
      purchasePrice: 10000000, // 1 Cr
      monthlyRent: 35000,
      maintenanceAnnual: 50000,
      taxesAnnual: 20000,
      downPayment: 3000000,
    }

    const res = calculateInvestmentRoi(params)

    expect(res.grossRentalYield).toBe(4.2)
    expect(res.netRentalYield).toBe(3.5)
    expect(res.cashOnCashReturn).toBe(11.67)
  })
})

describe('calculateMatchScore', () => {
  it('assigns 100 for perfect match matches', () => {
    const project = { priceRangeMin: 5000000, priceRangeMax: 8000000, location: 'SG Highway, Ahmedabad', type: 'RESIDENTIAL' }
    const profile = { budget: 6000000, preferredLocation: 'SG Highway', preferredType: 'RESIDENTIAL' as const }

    const res = calculateMatchScore(project, profile)

    expect(res.score).toBe(100)
    expect(res.reasons.length).toBeGreaterThan(0)
  })

  it('penalizes scoring on budget mismatch and location differences', () => {
    const project = { priceRangeMin: 5000000, priceRangeMax: 8000000, location: 'SG Highway, Ahmedabad', type: 'RESIDENTIAL' }
    const profile = { budget: 4000000, preferredLocation: 'Bopal', preferredType: 'COMMERCIAL' as const }

    const res = calculateMatchScore(project, profile)

    expect(res.score).toBeLessThan(60)
  })
})
