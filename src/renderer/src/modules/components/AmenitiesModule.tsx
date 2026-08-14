import { useEffect, useState } from 'react'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'

interface Amenity {
  id: string
  name: string
  description?: string
  icon?: string
}

interface Project {
  amenities: Amenity[]
}

export default function AmenitiesModule({ projectId }: { config: Record<string, any>; projectId: string }): JSX.Element {
  const [amenities, setAmenities] = useState<Amenity[]>([])

  useEffect(() => {
    window.api
      .invoke(IPC_CHANNELS.PROJECT_GET, projectId)
      .then((data) => {
        const proj = data as Project
        setAmenities(proj?.amenities || [])
      })
      .catch(console.error)
  }, [projectId])

  return (
    <div className="amenities-module-card" data-testid="module-AMENITIES" style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-6)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
      marginBottom: 'var(--space-4)'
    }}>
      <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Lifestyle Amenities</h3>

      {amenities.length === 0 ? (
        <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          No amenities listed for this project
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 'var(--space-4)'
        }}>
          {amenities.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                transition: 'border-color var(--transition-fast)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--project-accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            >
              <div style={{
                fontSize: '28px',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--project-accent)'
              }}>
                {/* Fallback to first char if no icon set */}
                {item.icon ? item.icon : item.name.charAt(0)}
              </div>
              <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: '#fff' }}>
                {item.name}
              </div>
              {item.description && (
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.3 }}>
                  {item.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}