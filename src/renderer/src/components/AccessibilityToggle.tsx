import React from 'react'
import { useThemeStore } from '../store/useThemeStore'

export const AccessibilityToggle: React.FC = () => {
  const { fontScale, cycleFontScale } = useThemeStore()

  return (
    <button
      onClick={cycleFontScale}
      className="theme-toggle-btn"
      aria-label="Toggle Text Size"
      title={`Current Font Scale: ${fontScale || 1.0}x. Click to change.`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 'bold',
        fontFamily: 'var(--font-sans)',
        minWidth: '36px',
        height: '36px',
        borderRadius: '50%',
        border: '1.5px solid var(--color-border)',
        background: 'var(--color-surface-raised)',
        color: 'var(--color-text-primary)',
        cursor: 'pointer',
        transition: 'all var(--transition-fast)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-accent)'
        e.currentTarget.style.background = 'var(--color-surface-hover)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)'
        e.currentTarget.style.background = 'var(--color-surface-raised)'
      }}
    >
      A{fontScale > 1 ? '+' : ''}
    </button>
  )
}
