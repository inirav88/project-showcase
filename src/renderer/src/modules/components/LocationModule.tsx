import { useEffect, useState } from 'react'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'

interface Landmark {
  name: string
  distance: string
  category: 'transit' | 'education' | 'healthcare' | 'retail' | 'other'
}

interface Project {
  location: string
}

export default function LocationModule({ config, projectId }: { config: Record<string, any>; projectId: string }): JSX.Element {
  const [project, setProject] = useState<Project | null>(null)
  const [activeTab, setActiveTab] = useState<string>('ALL')

  useEffect(() => {
    window.api
      .invoke(IPC_CHANNELS.PROJECT_GET, projectId)
      .then((data) => setProject(data as Project))
      .catch(console.error)
  }, [projectId])

  // Provide some nice default landmarks if none defined in config
  const landmarks: Landmark[] = config.landmarks || [
    { name: 'Metro Station', distance: '500 meters (2 min walk)', category: 'transit' },
    { name: 'Airport', distance: '12 km (20 min drive)', category: 'transit' },
    { name: 'National Highway', distance: '1.5 km (3 min drive)', category: 'transit' },
    { name: 'DPS School', distance: '3 km (8 min drive)', category: 'education' },
    { name: 'University Campus', distance: '4.5 km (10 min drive)', category: 'education' },
    { name: 'Shelby Multi-Speciality Hospital', distance: '2 km (5 min drive)', category: 'healthcare' },
    { name: 'Acme Mall & Multiplex', distance: '1 km (3 min drive)', category: 'retail' },
    { name: 'Supermarket', distance: '300 meters (1 min walk)', category: 'retail' }
  ]

  const categories = ['ALL', 'transit', 'education', 'healthcare', 'retail']

  const filteredLandmarks = activeTab === 'ALL'
    ? landmarks
    : landmarks.filter((l) => l.category === activeTab)

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'transit': return '🚇'
      case 'education': return '🏫'
      case 'healthcare': return '🏥'
      case 'retail': return '🛍️'
      default: return '📍'
    }
  }

  return (
    <div className="location-module-card" data-testid="module-LOCATION" style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-6)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
      marginBottom: 'var(--space-4)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Location & Connectivity</h3>
          {project && (
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              📍 {project.location}
            </p>
          )}
        </div>

        {/* Categories filters */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className="luxury-btn"
              style={{
                backgroundColor: activeTab === cat ? 'var(--color-accent)' : 'var(--color-surface-raised)',
                color: activeTab === cat ? '#fff' : 'var(--color-text-secondary)',
                borderColor: activeTab === cat ? 'var(--color-accent)' : 'var(--color-border)',
                fontWeight: activeTab === cat ? 700 : 500,
                textTransform: 'uppercase',
                fontSize: '12px',
                padding: '8px 16px',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--space-4)',
        marginTop: 'var(--space-4)'
      }}>
        {filteredLandmarks.map((lm, idx) => (
          <div
            key={idx}
            className="interactive-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: 'var(--space-5)',
              background: 'var(--color-surface-raised)',
            }}
          >
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              flexShrink: 0
            }}>
              {getCategoryIcon(lm.category)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              <span style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', color: 'var(--color-text-primary)' }}>{lm.name}</span>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }}>{lm.distance}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
