import { useEffect, useState } from 'react'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'
import { toMediaUrl } from '../../utils/media'

interface Amenity {
  id: string
  name: string
  description?: string
  icon?: string
  imagePath?: string
}

interface Project {
  amenities: Amenity[]
}

// Fallback SVG icons if no emoji provided
const fallbackIconMap: Record<string, string> = {
  pool: '🏊', gym: '💪', garden: '🌿', clubhouse: '🏛️', security: '🔒',
  parking: '🚗', lift: '⬆️', yoga: '🧘', kids: '🎡', sport: '⚽',
  tennis: '🎾', basketball: '🏀', cricket: '🏏', jogging: '🏃', spa: '💆',
  library: '📚', cinema: '🎬', lounge: '🛋️', cafe: '☕', games: '🎮',
}

function getAutoIcon(name: string, provided?: string): string {
  if (provided && provided.trim()) return provided
  const lower = name.toLowerCase()
  for (const [key, emoji] of Object.entries(fallbackIconMap)) {
    if (lower.includes(key)) return emoji
  }
  return '🏗️'
}

export default function AmenitiesModule({ config, projectId }: { config: Record<string, any>; projectId: string }): JSX.Element {
  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [hovered, setHovered] = useState<string | null>(null)

  // Config-based amenities take priority, then fall back to project amenities
  useEffect(() => {
    const cfgAmenities = config.amenities as Amenity[] | undefined
    if (cfgAmenities && cfgAmenities.length > 0) {
      setAmenities(cfgAmenities)
      return
    }

    window.api
      .invoke(IPC_CHANNELS.PROJECT_GET, projectId)
      .then((data) => {
        const proj = data as Project
        setAmenities(proj?.amenities || [])
      })
      .catch(console.error)
  }, [projectId, config])

  return (
    <div data-testid="module-AMENITIES" style={{ animation: 'fadeInUp 0.4s var(--ease-out)' }}>
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', padding: 'var(--space-8)',
      }}>
        <div className="module-section-heading">
          <h2>Lifestyle Amenities</h2>
        </div>

        {amenities.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🏊</span>
            <h3>No Amenities Listed</h3>
            <p>Add amenities to this project from the Admin Panel to showcase lifestyle features.</p>
          </div>
        ) : (
          <div className="amenity-grid">
            {amenities.map((item, idx) => (
              <div
                key={item.id ?? idx}
                className="amenity-card"
                style={{
                  animation: `tileEntrance 0.4s ${0.05 * Math.min(idx, 12)}s var(--ease-out) both`,
                  position: 'relative', overflow: 'hidden',
                }}
                onMouseEnter={() => setHovered(item.id ?? String(idx))}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Background image if provided */}
                {item.imagePath && (
                  <img
                    src={toMediaUrl(item.imagePath)}
                    alt={item.name}
                    style={{
                      position: 'absolute', inset: 0, width: '100%', height: '100%',
                      objectFit: 'cover', opacity: hovered === (item.id ?? String(idx)) ? 0.2 : 0.08,
                      transition: 'opacity 0.4s ease',
                    }}
                  />
                )}

                <span className="amenity-icon">
                  {getAutoIcon(item.name, item.icon)}
                </span>
                <div className="amenity-name">{item.name}</div>
                {item.description && (
                  <div className="amenity-desc">{item.description}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary count bar */}
        {amenities.length > 0 && (
          <div style={{
            marginTop: 'var(--space-6)', padding: 'var(--space-4) var(--space-5)',
            background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
            fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)',
          }}>
            <span style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', color: 'var(--color-accent)' }}>
              {amenities.length}
            </span>
            world-class amenities designed for modern living
          </div>
        )}
      </div>
    </div>
  )
}