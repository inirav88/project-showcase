import { useEffect, useState } from 'react'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'

interface HighlightCard {
  id: string
  icon: string
  shortText: string
}

interface Project {
  name: string
  highlightCards: HighlightCard[]
}

export default function UspSpotlightModule({ config, projectId }: { config: Record<string, any>; projectId: string }): JSX.Element {
  const [project, setProject] = useState<Project | null>(null)

  useEffect(() => {
    window.api
      .invoke(IPC_CHANNELS.PROJECT_GET, projectId)
      .then((data) => setProject(data as Project))
      .catch(console.error)
  }, [projectId])

  const headline = config.headline || 'Unique Selling Propositions'
  const body = config.body || 'Distinctive features that set this development apart from others.'

  const highlights = project?.highlightCards || []

  return (
    <div className="usp-spotlight-module" data-testid="module-USP_SPOTLIGHT" style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-6)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-5)',
      marginBottom: 'var(--space-4)'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--project-accent)' }}>
          {headline}
        </h3>
        <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
          {body}
        </p>
      </div>

      {highlights.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
          marginTop: 'var(--space-3)'
        }}>
          {highlights.map((card) => (
            <div
              key={card.id}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-5)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                minHeight: '140px',
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.borderColor = 'var(--project-accent)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'
                e.currentTarget.style.borderColor = 'var(--color-border)'
                e.currentTarget.style.transform = 'none'
              }}
            >
              <div style={{
                fontSize: '36px',
                color: 'var(--project-accent)',
                filter: 'drop-shadow(0 2px 8px var(--color-accent-glow))'
              }}>{card.icon || '✨'}</div>
              <p style={{
                fontWeight: 500,
                fontSize: 'var(--font-size-base)',
                color: '#fff',
                lineHeight: 1.4
              }}>
                {card.shortText}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}