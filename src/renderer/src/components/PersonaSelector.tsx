import React from 'react'

export type Persona = 'END_USE' | 'INVESTMENT' | 'NRI'

interface Props {
  onSelect: (persona: Persona) => void
  onSkip: () => void
}

const PERSONAS: { id: Persona; emoji: string; title: string; subtitle: string }[] = [
  {
    id: 'END_USE',
    emoji: '??',
    title: 'Own Home',
    subtitle: 'Looking for a home for my family to live in',
  },
  {
    id: 'INVESTMENT',
    emoji: '??',
    title: 'Investment',
    subtitle: 'Exploring for rental income or capital appreciation',
  },
  {
    id: 'NRI',
    emoji: '??',
    title: 'NRI Buyer',
    subtitle: 'Based abroad, investing back home',
  },
]

/**
 * Persona selection screen shown after lead capture.
 * Adapts the showcase experience (calculators, emphasis) to the selected persona.
 */
export function PersonaSelector({ onSelect, onSkip }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'var(--backdrop-modal)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.3s ease',
    }}>
      <div style={{
        background: 'var(--color-surface)', borderRadius: 28, padding: '48px 40px',
        border: '1px solid var(--color-border)', maxWidth: 640, width: '90vw',
        boxShadow: 'var(--shadow-xl)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>??</div>
          <h2 style={{
            fontSize: 'var(--font-size-2xl)', fontWeight: 800,
            color: 'var(--color-text-primary)', letterSpacing: '-0.03em', marginBottom: 8,
          }}>
            What brings you here today?
          </h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            We'll personalise your showcase experience
          </p>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              style={{
                flex: 1, padding: '24px 16px', borderRadius: 16,
                border: '1.5px solid var(--color-border)',
                background: 'var(--color-surface-raised)',
                cursor: 'pointer', textAlign: 'center',
                transition: 'all var(--transition-fast)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-accent)'
                e.currentTarget.style.background = 'var(--color-accent-dim)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)'
                e.currentTarget.style.background = 'var(--color-surface-raised)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <span style={{ fontSize: 36 }}>{p.emoji}</span>
              <div style={{
                fontWeight: 700, fontSize: 'var(--font-size-base)',
                color: 'var(--color-text-primary)',
              }}>{p.title}</div>
              <div style={{
                fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)',
                lineHeight: 1.4,
              }}>{p.subtitle}</div>
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onSkip}
            style={{
              all: 'unset', cursor: 'pointer', fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-muted)',
              transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
          >
            Skip — general browse
          </button>
        </div>
      </div>
    </div>
  )
}
