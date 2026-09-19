import { useState, useCallback, useEffect } from 'react'

export interface SecurityPinModalProps {
  onVerify: (pin: string) => Promise<boolean>
  onClose: () => void
}

export function SecurityPinModal({ onVerify, onClose }: SecurityPinModalProps): JSX.Element {
  const [digits, setDigits] = useState<string[]>([])
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  const handleKey = useCallback(async (d: string) => {
    if (checking) return
    if (d === '⌫' || d === 'Backspace') {
      setDigits((prev) => prev.slice(0, -1))
      setError('')
      return
    }
    const next = [...digits, d]
    setDigits(next)
    if (next.length === 4) {
      setChecking(true)
      const ok = await onVerify(next.join(''))
      if (!ok) {
        setError('Incorrect PIN — try again')
        setDigits([])
      }
      setChecking(false)
    }
  }, [checking, digits, onVerify])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (checking) return

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        e.stopPropagation()
        handleKey(e.key)
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault()
        e.stopPropagation()
        handleKey('⌫')
      } else if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [checking, handleKey, onClose])

  return (
    <div className="pin-backdrop" role="dialog" aria-label="Admin PIN entry" aria-modal="true">
      <div className="pin-modal">
        <div style={{ textAlign: 'center' }}>
          <div className="text-min-readable" style={{
            fontWeight: 700, color: 'var(--color-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8
          }}>
            Admin Access
          </div>
          <div style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text-primary)', fontWeight: 600 }}>
            Enter 4-digit PIN
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>
            Use keyboard or click buttons below
          </div>
        </div>

        <div className="pin-display">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`pin-dot${digits[i] !== undefined ? ' filled' : ''}`} />
          ))}
        </div>

        {error && (
          <div className="error-message-accessible" role="alert">
            {error}
          </div>
        )}

        <div className="pin-keypad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key, i) => (
            key === '' ? (
              <div key={i} />
            ) : (
              <button
                key={key + i}
                className={`pin-key${checking ? ' btn-loading' : ''}`}
                onClick={() => handleKey(key)}
                disabled={checking}
                aria-label={key === '⌫' ? 'Delete' : `Number ${key}`}
              >
                {key}
              </button>
            )
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            all: 'unset', cursor: 'pointer', textAlign: 'center',
            fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)',
            padding: '8px', transition: 'color var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
