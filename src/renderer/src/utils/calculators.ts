/**
 * Pure helper functions for real estate financial calculations and matchmaker scoring
 */

export interface EmiResult {
  monthlyPayment: number
  totalInterest: number
  totalPayment: number
  amortizationSchedule: {
    month: number
    principalPaid: number
    interestPaid: number
    remainingBalance: number
  }[]
}

/**
 * Calculate standard Equated Monthly Installment (EMI) for home loans
 */
export function calculateEmi(principal: number, annualRate: number, tenureYears: number): EmiResult {
  const monthlyRate = annualRate / 12 / 100
  const totalMonths = tenureYears * 12

  let monthlyPayment = 0
  if (monthlyRate > 0) {
    monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)
  } else {
    monthlyPayment = principal / totalMonths
  }

  const amortizationSchedule: EmiResult['amortizationSchedule'] = []
  let remainingBalance = principal
  let totalInterest = 0

  for (let month = 1; month <= totalMonths; month++) {
    const interestPaid = remainingBalance * monthlyRate
    const principalPaid = monthlyPayment - interestPaid
    remainingBalance -= principalPaid
    totalInterest += interestPaid

    amortizationSchedule.push({
      month,
      principalPaid: Math.max(0, principalPaid),
      interestPaid: Math.max(0, interestPaid),
      remainingBalance: Math.max(0, remainingBalance),
    })
  }

  return {
    monthlyPayment,
    totalInterest,
    totalPayment: principal + totalInterest,
    amortizationSchedule,
  }
}

/**
 * Calculate Return on Investment (ROI) and Rental Yield
 */
export interface RoiResult {
  grossRentalYield: number
  netRentalYield: number
  annualNetIncome: number
  cashOnCashReturn: number
}

export function calculateInvestmentRoi(params: {
  purchasePrice: number
  monthlyRent: number
  maintenanceAnnual: number
  taxesAnnual: number
  downPayment: number
}): RoiResult {
  const { purchasePrice, monthlyRent, maintenanceAnnual, taxesAnnual, downPayment } = params
  const annualGrossIncome = monthlyRent * 12
  const annualExpenses = maintenanceAnnual + taxesAnnual
  const annualNetIncome = annualGrossIncome - annualExpenses

  const grossRentalYield = parseFloat(((annualGrossIncome / purchasePrice) * 100).toFixed(2))
  const netRentalYield = parseFloat(((annualNetIncome / purchasePrice) * 100).toFixed(2))
  const cashOnCashReturn = parseFloat((downPayment > 0 ? (annualNetIncome / downPayment) * 100 : netRentalYield).toFixed(2))

  return {
    grossRentalYield,
    netRentalYield,
    annualNetIncome,
    cashOnCashReturn,
  }
}

/**
 * Profile Matchmaker score calculation matching project metadata to client preferences
 */
export interface MatchProfile {
  budget: number
  preferredLocation: string
  preferredType: 'RESIDENTIAL' | 'COMMERCIAL' | 'MIXED_USE' | 'PLOTTED_DEVELOPMENT'
}

export interface MatchScoreResult {
  score: number // 0 to 100
  reasons: string[]
}

export function calculateMatchScore(project: {
  priceRangeMin: number
  priceRangeMax: number
  location: string
  type: string
}, profile: MatchProfile): MatchScoreResult {
  let score = 100
  const reasons: string[] = []

  // 1. Budget Fit Check
  if (profile.budget < project.priceRangeMin) {
    const gap = project.priceRangeMin - profile.budget
    const penalty = Math.min(40, (gap / project.priceRangeMin) * 100)
    score -= penalty
    reasons.push(`Budget is lower than project minimum by ₹${(gap / 100000).toFixed(1)} L`)
  } else if (profile.budget > project.priceRangeMax) {
    reasons.push('Budget easily covers the project price range')
  } else {
    reasons.push('Budget falls perfectly within project price range')
  }

  // 2. Location Match
  const isLocationMatch = project.location.toLowerCase().includes(profile.preferredLocation.toLowerCase()) ||
                          profile.preferredLocation.toLowerCase().includes(project.location.toLowerCase())
  if (!isLocationMatch) {
    score -= 25
    reasons.push(`Location does not match preferred area: ${profile.preferredLocation}`)
  } else {
    reasons.push(`Matches preferred location: ${project.location}`)
  }

  // 3. Project Type Match
  if (project.type !== profile.preferredType) {
    score -= 20
    reasons.push(`Project type (${project.type}) differs from preferred type (${profile.preferredType})`)
  } else {
    reasons.push(`Matches preferred project type: ${project.type}`)
  }

  return {
    score: Math.max(0, Math.round(score)),
    reasons,
  }
}
