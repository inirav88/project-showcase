import React, { useState } from 'react'
import { calculateMatchScore } from '../utils/calculators'

interface Project {
  id: string
  name: string
  developer: string
  location: string
  type: string
  priceRangeMin: number
  priceRangeMax: number
}

interface Props {
  projects: Project[]
  onComplete: (sortedProjects: (Project & { matchScore: number })[]) => void
  onDismiss: () => void
}

type Step = 'budget' | 'location' | 'type' | 'results'
type PropType = 'RESIDENTIAL' | 'COMMERCIAL' | 'MIXED_USE' | 'PLOTTED_DEVELOPMENT'

const BUDGET_OPTIONS = [
  { label: 'Up to ₹50 L', value: 5000000 },
  { label: 'Up to ₹1 Cr', value: 10000000 },
  { label: 'Up to ₹3 Cr', value: 30000000 },
  { label: 'Up to ₹5 Cr', value: 50000000 },
  { label: '₹5 Cr+', value: 999999999 },
]

const TYPE_OPTIONS: { label: string; value: PropType; emoji: string }[] = [
  { label: 'Residential Apartment', value: 'RESIDENTIAL', emoji: '🏠' },
  { label: 'Commercial Space', value: 'COMMERCIAL', emoji: '🏢' },
  { label: 'Mixed Use', value: 'MIXED_USE', emoji: '🏙️' },
  { label: 'Plotted Development', value: 'PLOTTED_DEVELOPMENT', emoji: '🌳' },
]

/**
 * 3-step preference quiz that uses calculateMatchScore to rank projects.
 */
export function MatchmakerQuiz({ projects, onComplete, onDismiss }: Props) {
  const [step, setStep] = useState<Step>('budget')
  const [budget, setBudget] = useState<number>(0)
  const [location, setLocation] = useState('')
  const [propType, setPropType] = useState<PropType>('RESIDENTIAL')

  const handleFinish = (type: PropType) => {
    const scored = projects.map((p) => ({
      ...p,
      matchScore: calculateMatchScore(p, {
        budget,
        preferredLocation: location,
        preferredType: type,
      }).score,
    }))
    scored.sort((a, b) => b.matchScore - a.matchScore)
    onComplete(scored)
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 600,
    background: 'var(--backdrop-modal)', backdropFilter: 'blur(16px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: 'fadeIn 0.3s ease',
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--color-surface)', borderRadius: 28, padding: '48px 40px',
    border: '1px solid var(--color-border)', maxWidth: 560, width: '90vw',
    boxShadow: 'var(--shadow-xl)',
  }

  const optBtn = (selected: boolean): React.CSSProperties => ({
    width: '100%', padding: '14px 20px', borderRadius: 12, cursor: 'pointer',
    border: `1.5px solid ${selected ? 'var(--color-accent)' : 'var(--color-border)'}`,
    background: selected ? 'var(--color-accent-dim)' : 'var(--color-surface-raised)',
    color: selected ? 'var(--color-accent)' : 'var(--color-text-primary)',
    fontWeight: selected ? 700 : 500, fontSize: 'var(--font-size-sm)',
    textAlign: 'left', fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
  })

  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>
        {step === 'budget' && (
          <>
            <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, marginBottom: 8, letterSpacing: '-0.03em' }}>
              🔍 What's your budget?
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 28, fontSize: 'var(--font-size-sm)' }}>
              We'll match you with the best-fitting projects
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {BUDGET_OPTIONS.map((o) => (
                <button key={o.value} style={optBtn(budget === o.value)} onClick={() => setBudget(o.value)}>
                  {o.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
              <button onClick={onDismiss} style={{ all: 'unset', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>Cancel</button>
              <button onClick={() => setStep('location')} disabled={!budget}
                style={{ padding: '12px 28px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: budget ? 'pointer' : 'not-allowed', opacity: budget ? 1 : 0.4, fontFamily: 'var(--font-sans)' }}>
                Next →
              </button>
            </div>
          </>
        )}

        {step === 'location' && (
          <>
            <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, marginBottom: 8, letterSpacing: '-0.03em' }}>
              📍 Preferred location?
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 28, fontSize: 'var(--font-size-sm)' }}>
              Enter a neighbourhood, area or city
            </p>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Sindhu Bhavan, Prahlad Nagar..."
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 12,
                border: '1.5px solid var(--color-border)', background: 'var(--color-surface-raised)',
                color: 'var(--color-text-primary)', fontSize: 'var(--font-size-base)',
                fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
              <button onClick={() => setStep('budget')} style={{ all: 'unset', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>← Back</button>
              <button onClick={() => setStep('type')}
                style={{ padding: '12px 28px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                Next →
              </button>
            </div>
          </>
        )}

        {step === 'type' && (
          <>
            <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, marginBottom: 8, letterSpacing: '-0.03em' }}>
              🏠 What type of property?
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 28, fontSize: 'var(--font-size-sm)' }}>
              Select the property category you're interested in
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {TYPE_OPTIONS.map((o) => (
                <button key={o.value} style={optBtn(propType === o.value)} onClick={() => setPropType(o.value)}>
                  {o.emoji} {o.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep('location')} style={{ all: 'unset', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>← Back</button>
              <button onClick={() => handleFinish(propType)}
                style={{ padding: '12px 28px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                Find Matches →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
