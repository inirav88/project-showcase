import { useState } from 'react'
import { IPC_CHANNELS } from '../../../../../main/ipc/channels'

export interface LeadCaptureModalProps {
  projectId: string
  projectName: string
  onComplete: () => void
  onSkip: () => void
}

export function LeadCaptureModal({ projectId, projectName, onComplete, onSkip }: LeadCaptureModalProps): JSX.Element {
  const [leadName, setLeadName] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [submittingLead, setSubmittingLead] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [phoneError, setPhoneError] = useState('')

  const validateEmail = (email: string): boolean => {
    if (!email) return true // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string): boolean => {
    if (!phone) return false // Required field
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/
    return phoneRegex.test(phone)
  }

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    let hasErrors = false

    if (leadEmail && !validateEmail(leadEmail)) {
      setEmailError('Please enter a valid email address')
      hasErrors = true
    } else {
      setEmailError('')
    }

    if (!validatePhone(leadPhone)) {
      setPhoneError('Please enter a valid phone number (minimum 10 digits)')
      hasErrors = true
    } else {
      setPhoneError('')
    }

    if (hasErrors || !leadName) return

    setSubmittingLead(true)
    try {
      await window.api.invoke(IPC_CHANNELS.LEAD_CREATE, {
        projectId,
        name: leadName,
        phone: leadPhone,
        email: leadEmail,
        notes: `Session start - ${projectName}`,
      })
      onComplete()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingLead(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--backdrop-modal)',
      backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 300, animation: 'fadeIn 0.25s ease'
    }}>
      <form onSubmit={handleLeadSubmit} style={{
        background: 'var(--color-surface)', padding: '40px 36px', borderRadius: 24,
        border: '1px solid var(--color-border)', width: 440, maxWidth: '90vw',
        display: 'flex', flexDirection: 'column', gap: 20,
        boxShadow: 'var(--shadow-xl)', animation: 'scaleIn 0.3s var(--ease-out)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{
            display: 'inline-flex', width: 56, height: 56, borderRadius: '50%',
            background: 'var(--color-accent-dim)', border: '1px solid var(--color-accent-border)',
            alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 24
          }}>
            🏠
          </div>
          <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-accent)', letterSpacing: '-0.02em' }}>
            {projectName}
          </h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
            Begin your exclusive property tour — enter details to unlock pricing and calculators.
          </p>
        </div>

        {[
          { label: 'Full Name *', value: leadName, setter: setLeadName, placeholder: 'e.g. Nirav Patel', required: true, type: 'text', error: '' },
          { label: 'Mobile Number *', value: leadPhone, setter: setLeadPhone, placeholder: 'e.g. +91 98765 43210', required: true, type: 'tel', error: phoneError },
          { label: 'Email Address', value: leadEmail, setter: setLeadEmail, placeholder: 'Optional', required: false, type: 'email', error: emailError },
        ].map(({ label, value, setter, placeholder, required, type, error }) => (
          <div key={label} className="form-field-wrapper">
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {label}
            </label>
            <input
              type={type}
              value={value}
              onChange={(e) => {
                setter(e.target.value)
                if (label === 'Email Address' && emailError) setEmailError('')
                if (label === 'Mobile Number *' && phoneError) setPhoneError('')
              }}
              onBlur={() => {
                if (label === 'Email Address' && value && !validateEmail(value)) {
                  setEmailError('Please enter a valid email address')
                }
                if (label === 'Mobile Number *' && value && !validatePhone(value)) {
                  setPhoneError('Please enter a valid phone number (minimum 10 digits)')
                }
              }}
              placeholder={placeholder}
              required={required}
              className={error ? 'form-field-error' : ''}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? `${label}-error` : undefined}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10,
                border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
                background: 'var(--color-surface-raised)',
                color: 'var(--color-text-primary)', fontSize: 'var(--font-size-base)', fontFamily: 'var(--font-sans)', outline: 'none',
                transition: 'border-color var(--transition-fast)'
              }}
            />
            {error && (
              <div id={`${label}-error`} className="field-validation-message error" role="alert">
                {error}
              </div>
            )}
          </div>
        ))}

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
          <button
            type="button"
            onClick={onSkip}
            style={{
              all: 'unset', cursor: 'pointer', fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-muted)', padding: '4px 8px',
              transition: 'color var(--transition-fast)'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
          >
            Skip
          </button>
          <button
            type="submit"
            disabled={submittingLead}
            className={submittingLead ? 'btn-loading' : ''}
            style={{
              flex: 1, padding: '14px', background: 'var(--color-accent)', color: 'var(--color-bg)',
              border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 'var(--font-size-base)',
              cursor: submittingLead ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)',
              transition: 'opacity var(--transition-fast)', opacity: submittingLead ? 0.7 : 1,
              position: 'relative'
            }}
          >
            {submittingLead ? 'Loading…' : 'Start Presentation →'}
          </button>
        </div>
      </form>
    </div>
  )
}
