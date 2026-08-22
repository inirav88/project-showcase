import React from 'react'
import { toMediaUrl } from '../utils/media'

interface Project {
  id: string
  name: string
  developer: string
  location: string
  type: string
  possessionStatus: string
  priceRangeMin: number
  priceRangeMax: number
  themeAccentColor: string
  thumbnailPath?: string
  reraNumber?: string
  description?: string
}

interface Props {
  projectA: Project
  projectB: Project
  onClose: () => void
}

function fmt(n: number) {
  if (!n) return 'N/A'
  if (n >= 10000000) return `?${(n / 10000000).toFixed(1)} Cr`
  return `?${(n / 100000).toFixed(0)} L`
}

function Cell({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <td style={{
      padding: '14px 20px', fontSize: 'var(--font-size-sm)',
      color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)',
      ...(accent ? { borderTop: `3px solid ${accent}` } : {}),
    }}>
      {children}
    </td>
  )
}

const ROWS: { label: string; key: keyof Project; format?: (v: any) => string }[] = [
  { label: 'Developer', key: 'developer' },
  { label: 'Location', key: 'location' },
  { label: 'Type', key: 'type' },
  { label: 'Possession', key: 'possessionStatus', format: (v) => v === 'READY' ? '? Ready to Move' : '?? Under Construction' },
  { label: 'Price Range', key: 'priceRangeMin' as keyof Project, format: (v: any) => fmt(Number(v)) },
  { label: 'RERA No.', key: 'reraNumber' },
]

/**
 * Side-by-side comparison view for two selected projects.
 */
export function ProjectComparison({ projectA, projectB, onClose }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 700, background: 'var(--color-bg)',
      display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.25s ease', overflow: 'auto',
    }}>
      {/* Header */}
      <header style={{
        padding: '20px 32px', borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--color-surface)',
      }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
          ?? Project Comparison
        </h2>
        <button onClick={onClose} style={{
          all: 'unset', cursor: 'pointer', padding: '8px 20px', borderRadius: 8,
          border: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)',
        }}>
          ? Close
        </button>
      </header>

      {/* Hero images */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        {[projectA, projectB].map((p) => (
          <div key={p.id} style={{
            height: 220, position: 'relative', overflow: 'hidden',
            borderBottom: `4px solid ${p.themeAccentColor}`,
          }}>
            {p.thumbnailPath ? (
              <img src={toMediaUrl(p.thumbnailPath)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${p.themeAccentColor}30, ${p.themeAccentColor}08)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>??</div>
            )}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
            }} />
            <div style={{ position: 'absolute', bottom: 20, left: 20 }}>
              <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{p.name}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{p.developer}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div style={{ flex: 1, padding: '0 32px 32px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 0 }}>
          <colgroup>
            <col style={{ width: '20%' }} />
            <col style={{ width: '40%' }} />
            <col style={{ width: '40%' }} />
          </colgroup>
          <thead>
            <tr style={{ background: 'var(--color-surface-raised)' }}>
              <th style={{ padding: '12px 20px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textAlign: 'left', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attribute</th>
              <th style={{ padding: '12px 20px', fontSize: 'var(--font-size-sm)', color: projectA.themeAccentColor, textAlign: 'left', fontWeight: 700 }}>{projectA.name}</th>
              <th style={{ padding: '12px 20px', fontSize: 'var(--font-size-sm)', color: projectB.themeAccentColor, textAlign: 'left', fontWeight: 700 }}>{projectB.name}</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label}>
                <td style={{ padding: '14px 20px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--color-border)' }}>
                  {row.label}
                </td>
                <Cell>
                  {row.format ? row.format((projectA as any)[row.key]) : String((projectA as any)[row.key] ?? '—')}
                </Cell>
                <Cell>
                  {row.format ? row.format((projectB as any)[row.key]) : String((projectB as any)[row.key] ?? '—')}
                </Cell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

