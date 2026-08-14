import { useEffect, useState } from 'react'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'

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

  if (!project) {
    return <div className="loading">Loading overview…</div>
  }

  const headline = config.heroHeadline || `Welcome to ${project.name}`

  return (
    <div className="overview-module-card" data-testid="module-OVERVIEW" style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-6)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
      marginBottom: 'var(--space-4)'
    }}>
      <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--project-accent)' }}>
        {headline}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
        <div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Developer</div>
          <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 500 }}>{project.developer}</div>
        </div>
        <div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Location</div>
          <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 500 }}>{project.location}</div>
        </div>
        <div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Price Range</div>
          <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 500 }}>
            {formatPrice(project.priceRangeMin)} – {formatPrice(project.priceRangeMax)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Possession</div>
          <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 500 }}>
            {project.possessionStatus === 'READY' ? 'Ready to Move' : `Under Construction (${project.possessionDate || 'TBD'})`}
          </div>
        </div>
      </div>
      {project.description && (
        <p style={{ marginTop: 'var(--space-4)', color: 'var(--color-text-secondary)', lineHeight: 1.6, fontSize: 'var(--font-size-base)' }}>
          {project.description}
        </p>
      )}
    </div>
  )
}
