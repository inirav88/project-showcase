import { useEffect, useState } from 'react'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'
import { toMediaUrl } from '../../utils/media'

interface Project {
  name: string
  developer: string
  location: string
  reraNumber: string
  description: string
  type: string
  possessionStatus: string
  possessionDate: string
  priceRangeMin: number
  priceRangeMax: number
}

function formatPrice(n: number): string {
  if (!n) return 'N/A'
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`
  return `₹${(n / 100000).toFixed(0)} L`
}

export default function OverviewModule({ config, projectId }: { config: Record<string, any>; projectId: string }): JSX.Element {
  const [project, setProject] = useState<Project | null>(null)

  useEffect(() => {
    window.api
      .invoke(IPC_CHANNELS.PROJECT_GET, projectId)
      .then((data) => setProject(data as Project))
      .catch(console.error)
  }, [projectId])

  if (!project) return <div className="loading">Loading overview…</div>

  const headline = config.heroHeadline || `Welcome to ${project.name}`
  const subHeadline = config.subHeadline || `${project.developer} · ${project.location}`
  const stats: string[] = config.stats || []
  const heroImage = config.heroImage || ''

  const statItems = [
    { label: 'Developer', value: project.developer },
    { label: 'Location', value: project.location },
    { label: 'Type', value: project.type.replace('_', ' ') },
    { label: 'Price Range', value: `${formatPrice(project.priceRangeMin)} – ${formatPrice(project.priceRangeMax)}`, accent: true },
    { label: 'Possession', value: project.possessionStatus === 'READY' ? 'Ready to Move' : `Under Construction${project.possessionDate ? ` (${project.possessionDate})` : ''}` },
    ...(project.reraNumber ? [{ label: 'RERA No.', value: project.reraNumber }] : []),
  ]

  return (
    <div data-testid="module-OVERVIEW" style={{ animation: 'fadeInUp 0.4s var(--ease-out)' }}>
      {/* Hero Banner */}
      <div style={{
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        marginBottom: 'var(--space-6)',
        minHeight: heroImage ? 360 : 220,
        display: 'flex',
        alignItems: 'flex-end',
        background: heroImage
          ? 'var(--color-surface)'
          : 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-raised) 100%)',
        border: '1px solid var(--color-border)',
      }}>
        {heroImage && (
          <img
            src={toMediaUrl(heroImage)}
            alt="Project Hero"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', filter: 'brightness(0.55)',
            }}
          />
        )}

        {/* Gradient overlay for text legibility */}
        <div style={{
          position: heroImage ? 'relative' : 'static',
          width: '100%',
          padding: 'var(--space-10) var(--space-8)',
          background: heroImage
            ? 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)'
            : 'transparent',
          zIndex: 1,
        }}>
          <h2 style={{
            fontSize: 'var(--font-size-3xl)',
            fontWeight: 800,
            color: heroImage ? 'var(--color-text-primary)' : 'var(--color-text-primary)',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            marginBottom: 'var(--space-2)',
          }}>
            {headline}
          </h2>
          <p style={{
            fontSize: 'var(--font-size-lg)',
            color: heroImage ? 'rgba(255,255,255,0.75)' : 'var(--color-text-secondary)',
            fontWeight: 400,
            marginBottom: stats.length > 0 ? 'var(--space-5)' : 0,
          }}>
            {subHeadline}
          </p>

          {/* Key stat pills from config */}
          {stats.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              {stats.map((s, i) => (
                <span key={i} style={{
                  padding: '4px 14px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: heroImage ? 'var(--color-text-primary)' : 'var(--color-text-primary)',
                  backdropFilter: 'blur(8px)',
                }}>
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
        {statItems.map((s) => (
          <div key={s.label} className="stat-item">
            <div className="stat-label">{s.label}</div>
            <div className={`stat-value${(s as any).accent ? ' accent' : ''}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Description */}
      {project.description && (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-6)',
        }}>
          <div style={{
            fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 'var(--space-3)'
          }}>
            About This Project
          </div>
          <p style={{
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-base)',
            lineHeight: 1.75,
          }}>
            {project.description}
          </p>
        </div>
      )}
    </div>
  )
}

