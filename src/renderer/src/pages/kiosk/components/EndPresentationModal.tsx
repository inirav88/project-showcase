import React from 'react'

export interface EndPresentationModalProps {
  projectName: string
  persona: string | null
  sectionsCount: number
  shortlistCount: number
  sessionDurationMinutes: number
  onConfirmEnd: () => void
  onSaveLead: () => void
  onResume: () => void
}

export function EndPresentationModal({
  projectName,
  persona,
  sectionsCount,
  shortlistCount,
  sessionDurationMinutes,
  onConfirmEnd,
  onSaveLead,
  onResume,
}: EndPresentationModalProps): JSX.Element {
  return (
    <div
      className="pin-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="end-presentation-title"
      style={{
        zIndex: 10000,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="pin-modal"
        style={{
          maxWidth: 480,
          width: '90%',
          padding: '28px 24px',
          borderRadius: 16,
          background: 'var(--color-surface, #1e293b)',
          border: '1px solid var(--color-border, rgba(255,255,255,0.1))',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          color: 'var(--color-text-primary, #f8fafc)',
        }}
      >
        {/* Header Icon & Title */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              margin: '0 auto 12px auto',
              color: '#ef4444',
            }}
          >
            ⏹️
          </div>
          <h2
            id="end-presentation-title"
            style={{
              fontSize: 20,
              fontWeight: 700,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            End Presentation Session?
          </h2>
          <p
            style={{
              fontSize: 13,
              color: 'var(--color-text-secondary, #94a3b8)',
              marginTop: 4,
              marginBottom: 0,
            }}
          >
            {projectName} Presentation Overview
          </p>
        </div>

        {/* Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {/* Duration */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              background: 'var(--color-surface-raised, rgba(255,255,255,0.04))',
              border: '1px solid var(--color-border, rgba(255,255,255,0.08))',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--color-text-muted, #64748b)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ⏱️ Duration
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: 'var(--color-text-primary, #f8fafc)' }}>
              {sessionDurationMinutes < 1 ? '< 1 min' : `${sessionDurationMinutes} mins`}
            </div>
          </div>

          {/* Persona */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              background: 'var(--color-surface-raised, rgba(255,255,255,0.04))',
              border: '1px solid var(--color-border, rgba(255,255,255,0.08))',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--color-text-muted, #64748b)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              👤 Buyer Persona
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6, color: persona ? 'var(--color-accent, #38bdf8)' : 'var(--color-text-secondary, #94a3b8)' }}>
              {persona || 'General Browse'}
            </div>
          </div>

          {/* Sections Explored */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              background: 'var(--color-surface-raised, rgba(255,255,255,0.04))',
              border: '1px solid var(--color-border, rgba(255,255,255,0.08))',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--color-text-muted, #64748b)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              📊 Sections Explored
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: 'var(--color-text-primary, #f8fafc)' }}>
              {sectionsCount} {sectionsCount === 1 ? 'module' : 'modules'}
            </div>
          </div>

          {/* Shortlisted Units */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              background: 'var(--color-surface-raised, rgba(255,255,255,0.04))',
              border: '1px solid var(--color-border, rgba(255,255,255,0.08))',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--color-text-muted, #64748b)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ❤️ Shortlisted Units
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: shortlistCount > 0 ? '#ec4899' : 'var(--color-text-primary, #f8fafc)' }}>
              {shortlistCount} {shortlistCount === 1 ? 'unit' : 'units'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={onConfirmEnd}
            className="btn-hover-effect"
            style={{
              width: '100%',
              padding: '12px 18px',
              borderRadius: 10,
              border: 'none',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
            }}
          >
            <span>🛑</span> Finish & Close Presentation
          </button>

          <button
            onClick={onSaveLead}
            className="btn-hover-effect"
            style={{
              width: '100%',
              padding: '11px 18px',
              borderRadius: 10,
              border: '1px solid var(--color-accent-border, rgba(56, 189, 248, 0.4))',
              background: 'rgba(56, 189, 248, 0.1)',
              color: 'var(--color-accent, #38bdf8)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <span>📋</span> Save Lead Details
          </button>

          <button
            onClick={onResume}
            className="btn-hover-effect"
            style={{
              width: '100%',
              padding: '10px 18px',
              borderRadius: 10,
              border: '1px solid var(--color-border, rgba(255,255,255,0.15))',
              background: 'transparent',
              color: 'var(--color-text-secondary, #94a3b8)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: 4,
            }}
          >
            Resume Presentation
          </button>
        </div>
      </div>
    </div>
  )
}
