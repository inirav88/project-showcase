import { toMediaUrl } from '../../utils/media'

interface Facility {
  name: string
  description: string
  imagePath?: string
}

const DEFAULT_FACILITIES: Facility[] = [
  { name: 'Indoor Badminton Arena', description: 'Dual court arena with professional shock-absorption wooden flooring.', imagePath: '' },
  { name: 'Rooftop Tennis Court', description: 'Synthetic hardcourt overlooking the skyline, equipped with premium floodlights.', imagePath: '' },
  { name: 'Cricket Practice Net', description: 'Enclosed practice pitches with automated bowling machine facilities.', imagePath: '' },
  { name: 'Jogging & Cycling Track', description: 'Dedicated vehicle-free circular outer ring track lined with organic tree plantations.', imagePath: '' }
]

export default function SportsCarouselModule({ config }: { config: Record<string, any>; projectId: string }): JSX.Element {
  const headline = config.headline || 'Active Sports & Fitness'
  const subtext = config.subtext || 'Premium sports facilities engineered to keep you active and healthy.'
  const facilities: Facility[] = config.facilities || DEFAULT_FACILITIES

  return (
    <div data-testid="module-SPORTS_CAROUSEL" style={{ animation: 'fadeInUp 0.4s var(--ease-out)' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-primary)', margin: 0 }}>
          {headline}
        </h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: 8, maxWidth: 540, marginLeft: 'auto', marginRight: 'auto' }}>
          {subtext}
        </p>
      </div>

      {/* Facilities Slider Container */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 'var(--space-5)'
      }}>
        {facilities.map((fac, idx) => (
          <div
            key={idx}
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              aspectRatio: '4/3',
              display: 'flex',
              alignItems: 'flex-end',
              boxShadow: 'var(--shadow-sm)',
              animation: `tileEntrance 0.4s ${idx * 0.08}s var(--ease-out) both`
            }}
          >
            {fac.imagePath ? (
              <img
                src={toMediaUrl(fac.imagePath)}
                alt={fac.name}
                style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  objectFit: 'cover', transition: 'transform 0.4s var(--ease-out)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
              />
            ) : (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, var(--color-surface-raised) 0%, var(--color-bg) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32
              }}>
                ⚽
              </div>
            )}

            {/* Content overlay */}
            <div style={{
              position: 'relative',
              width: '100%',
              padding: 'var(--space-5)',
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
              zIndex: 1,
              color: '#ffffff'
            }}>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, margin: '0 0 6px 0', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                {fac.name}
              </h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.5 }}>
                {fac.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}