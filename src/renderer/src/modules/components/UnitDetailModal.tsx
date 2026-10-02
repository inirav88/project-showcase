import React from 'react'

export interface UnitDetailProps {
  unit: {
    id: string
    unitNumber: string
    floor: number
    configuration: string
    carpetArea: number
    builtUpArea?: number
    superBuiltUpArea?: number
    facing?: string
    price: number
    priceLabel?: string
    status: string
    floorPlanMediaId?: string | null
  }
  towerName: string
  projectName: string
  floorPlanImage: string
  isShortlisted: boolean
  onToggleShortlist: () => void
  onClose: () => void
}

function formatPrice(n: number): string {
  if (!n) return 'Price on Request'
  if (n >= 10000000) return String.fromCharCode(8377) + (n / 10000000).toFixed(2) + ' Cr'
  return String.fromCharCode(8377) + (n / 100000).toFixed(0) + ' L'
}

export default function UnitDetailModal({
  unit,
  towerName,
  projectName,
  floorPlanImage,
  isShortlisted,
  onToggleShortlist,
  onClose
}: UnitDetailProps): JSX.Element {
  const statusColor =
    unit.status === 'AVAILABLE'
      ? 'var(--color-available)'
      : unit.status === 'HELD'
        ? 'var(--color-held)'
        : 'var(--color-sold)'

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(5, 10, 20, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1050px',
          maxHeight: '90vh',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
          zIndex: 1001,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Floor Plan Drawing Preview */}
        <div
          style={{
            flex: 1.2,
            backgroundColor: 'var(--color-bg)',
            borderRight: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-6)',
            position: 'relative',
            minHeight: '450px',
          }}
        >
          {floorPlanImage ? (
            <img
              src={floorPlanImage}
              alt={`Floor Plan for Unit ${unit.unitNumber}`}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: 'var(--radius-md)',
              }}
            />
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--space-8)',
                color: 'var(--color-text-muted)',
              }}
            >
              <div style={{ fontSize: 52, opacity: 0.5, marginBottom: 12 }}>📐</div>
              <h4 style={{ color: 'var(--color-text-primary)', marginBottom: 6 }}>Architectural Layout</h4>
              <p style={{ fontSize: 'var(--font-size-sm)' }}>
                {unit.configuration} layout for {towerName}
              </p>
            </div>
          )}
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              background: 'rgba(0,0,0,0.6)',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 11,
              color: 'var(--color-text-secondary)',
            }}
          >
            {unit.configuration} Layout Plan
          </div>
        </div>

        {/* Right: Specifications & Pricing */}
        <div
          style={{
            flex: 1,
            padding: 'var(--space-8)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflowY: 'auto',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: 99,
                    backgroundColor: `${statusColor}15`,
                    color: statusColor,
                    border: `1px solid ${statusColor}35`,
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}
                >
                  {unit.status}
                </span>
                <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                  Unit {unit.unitNumber}
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: '4px 0 0' }}>
                  {towerName} · Floor {unit.floor} · {projectName}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-raised)',
                  color: 'var(--color-text-secondary)',
                  fontSize: 18,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Price Box */}
            <div
              style={{
                marginTop: 'var(--space-6)',
                padding: 'var(--space-5)',
                backgroundColor: 'var(--color-surface-raised)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pricing ({unit.priceLabel || 'Official'})
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-accent)', marginTop: 4 }}>
                {formatPrice(unit.price)}
              </div>
            </div>

            {/* Metrics Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--space-4)',
                marginTop: 'var(--space-6)',
              }}
            >
              <div style={{ background: 'var(--color-surface-raised)', padding: '12px 16px', borderRadius: 8 }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Configuration</span>
                <div style={{ fontSize: '15px', fontWeight: 700, marginTop: 2 }}>{unit.configuration}</div>
              </div>
              <div style={{ background: 'var(--color-surface-raised)', padding: '12px 16px', borderRadius: 8 }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Carpet Area</span>
                <div style={{ fontSize: '15px', fontWeight: 700, marginTop: 2 }}>
                  {unit.carpetArea} sqft ({(unit.carpetArea / 9).toFixed(1)} sqyd)
                </div>
              </div>
              {unit.builtUpArea ? (
                <div style={{ background: 'var(--color-surface-raised)', padding: '12px 16px', borderRadius: 8 }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Built-Up Area</span>
                  <div style={{ fontSize: '15px', fontWeight: 700, marginTop: 2 }}>{unit.builtUpArea} sqft</div>
                </div>
              ) : null}
              {unit.facing ? (
                <div style={{ background: 'var(--color-surface-raised)', padding: '12px 16px', borderRadius: 8 }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Facing</span>
                  <div style={{ fontSize: '15px', fontWeight: 700, marginTop: 2 }}>{unit.facing}</div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ marginTop: 'var(--space-8)', display: 'flex', gap: 'var(--space-4)' }}>
            <button
              onClick={onToggleShortlist}
              disabled={unit.status === 'SOLD'}
              style={{
                flex: 1,
                minHeight: 56,
                padding: '0 20px',
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                backgroundColor: isShortlisted ? '#ef4444' : 'var(--color-accent)',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 700,
                cursor: unit.status === 'SOLD' ? 'not-allowed' : 'pointer',
                opacity: unit.status === 'SOLD' ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <span>{isShortlisted ? '❤️ In Shortlist (Remove)' : '🤍 Add to Shortlist'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
