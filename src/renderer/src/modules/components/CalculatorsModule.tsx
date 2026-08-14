import { useState } from 'react'
import { calculateEmi } from '../../utils/calculators'

export default function CalculatorsModule(): JSX.Element {
  const [principal, setPrincipal] = useState<number>(5000000)
  const [rate, setRate] = useState<number>(8.5)
  const [tenure, setTenure] = useState<number>(20)

  const { monthlyPayment, totalInterest, totalPayment } = calculateEmi(principal, rate, tenure)

  const formatPrice = (n: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(n)
  }

  const interestPercentage = totalPayment > 0 ? (totalInterest / totalPayment) * 100 : 0
  const principalPercentage = 100 - interestPercentage

  return (
    <div className="calculators-module-card" data-testid="module-CALCULATORS" style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-6)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-5)',
      marginBottom: 'var(--space-4)'
    }}>
      <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Home Loan EMI Calculator</h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
        {/* Sliders / Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: 'var(--font-size-sm)' }}>
              <span>Loan Amount</span>
              <span style={{ fontWeight: 600, color: 'var(--project-accent)' }}>{formatPrice(principal)}</span>
            </div>
            <input
              type="range"
              min="500000"
              max="50000000"
              step="100000"
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--project-accent)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: 'var(--font-size-sm)' }}>
              <span>Interest Rate (p.a.)</span>
              <span style={{ fontWeight: 600, color: 'var(--project-accent)' }}>{rate}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="15"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--project-accent)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: 'var(--font-size-sm)' }}>
              <span>Loan Tenure (Years)</span>
              <span style={{ fontWeight: 600, color: 'var(--project-accent)' }}>{tenure} Yrs</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={tenure}
              onChange={(e) => setTenure(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--project-accent)' }}
            />
          </div>
        </div>

        {/* Computations Results Display */}
        <div style={{
          backgroundColor: 'var(--color-surface-raised)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 'var(--space-4)',
          border: '1px solid var(--color-border)'
        }}>
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Monthly EMI</div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
              {formatPrice(monthlyPayment)}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Total Interest</div>
              <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: '#fbbf24' }}>
                {formatPrice(totalInterest)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Total Amount</div>
              <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: '#34d399' }}>
                {formatPrice(totalPayment)}
              </div>
            </div>
          </div>

          {/* Simple breakdown bar */}
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <div style={{ width: `${principalPercentage}%`, backgroundColor: '#34d399' }} />
              <div style={{ width: `${interestPercentage}%`, backgroundColor: '#fbbf24' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '6px', color: 'var(--color-text-muted)' }}>
              <span>Principal ({principalPercentage.toFixed(0)}%)</span>
              <span>Interest ({interestPercentage.toFixed(0)}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}