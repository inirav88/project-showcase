import { useState } from 'react'
import { calculateEmi } from '../../utils/calculators'

function formatINR(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(n)
}

function formatINRShort(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`
  return `₹${n.toLocaleString('en-IN')}`
}

function SliderRow({ label, value, formatted, min, max, step, onChange }: {
  label: string; value: number; formatted: string
  min: number; max: number; step: number; onChange: (v: number) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
        <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: 'var(--color-accent)', fontVariantNumeric: 'tabular-nums' }}>
          {formatted}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--color-accent)', cursor: 'pointer', height: 6 }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-disabled)' }}>
        <span>{min >= 100000 ? formatINRShort(min) : min}</span>
        <span>{max >= 100000 ? formatINRShort(max) : max}</span>
      </div>
    </div>
  )
}

export default function CalculatorsModule(): JSX.Element {
  const [principal, setPrincipal] = useState(5000000)
  const [rate, setRate] = useState(8.5)
  const [tenure, setTenure] = useState(20)

  const { monthlyPayment, totalInterest, totalPayment } = calculateEmi(principal, rate, tenure)
  const interestPct = totalPayment > 0 ? (totalInterest / totalPayment) * 100 : 0
  const principalPct = 100 - interestPct

  // Rental yield calc
  const [rentPerMonth, setRentPerMonth] = useState(30000)
  const rentalYield = principal > 0 ? ((rentPerMonth * 12) / principal) * 100 : 0
  const breakEven = rentPerMonth > 0 ? Math.ceil(principal / (rentPerMonth * 12)) : 0

  return (
    <div data-testid="module-CALCULATORS" style={{ animation: 'fadeInUp 0.4s var(--ease-out)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

      {/* EMI Calculator */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-8)' }}>
        <div className="module-section-heading">
          <h2>Home Loan EMI Calculator</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-8)' }}>
          {/* Sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <SliderRow
              label="Loan Amount" value={principal} formatted={formatINRShort(principal)}
              min={500000} max={50000000} step={100000} onChange={setPrincipal}
            />
            <SliderRow
              label="Interest Rate (p.a.)" value={rate} formatted={`${rate.toFixed(1)}%`}
              min={5} max={15} step={0.1} onChange={setRate}
            />
            <SliderRow
              label="Loan Tenure" value={tenure} formatted={`${tenure} Years`}
              min={1} max={30} step={1} onChange={setTenure}
            />
          </div>

          {/* Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Monthly EMI highlight card */}
            <div style={{
              background: 'linear-gradient(135deg, var(--color-accent-dim) 0%, rgba(0,0,0,0) 100%)',
              border: '1px solid var(--color-accent-border)',
              borderRadius: 'var(--radius-md)', padding: 'var(--space-6)', textAlign: 'center'
            }}>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 8 }}>
                Monthly EMI
              </div>
              <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--color-accent)', letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>
                {formatINR(monthlyPayment)}
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              {[
                { label: 'Principal', value: formatINR(principal), color: 'var(--color-available)' },
                { label: 'Total Interest', value: formatINR(totalInterest), color: 'var(--color-held)' },
                { label: 'Total Outflow', value: formatINR(totalPayment), color: 'var(--color-text-primary)', span: true },
              ].map(({ label, value, color, span }) => (
                <div key={label} style={{
                  background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)',
                  gridColumn: (span ? 'span 2' : 'auto') as any,
                }}>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', fontSize: 'var(--font-size-base)' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Principal vs Interest bar */}
            <div>
              <div style={{ height: 10, borderRadius: 5, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', display: 'flex' }}>
                <div style={{ width: `${principalPct}%`, background: 'var(--color-available)', transition: 'width 0.4s var(--ease-out)' }} />
                <div style={{ width: `${interestPct}%`, background: 'var(--color-held)', transition: 'width 0.4s var(--ease-out)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--color-text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-available)', display: 'inline-block' }} />
                  Principal ({principalPct.toFixed(0)}%)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-held)', display: 'inline-block' }} />
                  Interest ({interestPct.toFixed(0)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rental Yield Calculator */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-8)' }}>
        <div className="module-section-heading">
          <h2>Rental Yield & ROI</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-8)', alignItems: 'start' }}>
          <div>
            <SliderRow
              label="Expected Monthly Rent" value={rentPerMonth}
              formatted={formatINR(rentPerMonth)}
              min={5000} max={200000} step={1000} onChange={setRentPerMonth}
            />
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: 16, lineHeight: 1.6 }}>
              Based on property price of {formatINRShort(principal)} from the EMI calculator above.
              Rental yield gives you an annualized return-on-investment estimate.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            {[
              { label: 'Annual Rental Income', value: formatINR(rentPerMonth * 12), color: 'var(--color-available)' },
              { label: 'Gross Rental Yield', value: `${rentalYield.toFixed(2)}%`, color: 'var(--color-accent)' },
              { label: 'Break-even Period', value: `${breakEven} years`, color: 'var(--color-text-primary)' },
              { label: 'Monthly Surplus vs EMI', value: formatINR(rentPerMonth - monthlyPayment), color: rentPerMonth >= monthlyPayment ? 'var(--color-available)' : 'var(--color-sold)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)', padding: 'var(--space-5)',
              }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 6, lineHeight: 1.3 }}>{label}</div>
                <div style={{ fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', fontSize: 'var(--font-size-md)' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-disabled)', textAlign: 'center', lineHeight: 1.6 }}>
        * Calculations are indicative estimates only. Actual EMI, rental income, and returns may vary based on lender terms, property location, and market conditions. Consult a financial advisor before making investment decisions.
      </p>
    </div>
  )
}