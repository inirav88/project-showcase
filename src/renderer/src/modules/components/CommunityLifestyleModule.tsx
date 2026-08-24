import { toMediaUrl } from '../../utils/media'

interface Activity {
  title: string
  description: string
  imagePath?: string
}

const DEFAULT_ACTIVITIES: Activity[] = [
  { title: 'Rooftop Clubhouse Lounge', description: 'Exclusive membership lounge equipped with private dining rooms and card table rooms.', imagePath: '' },
  { title: 'Children Indoor Playzone', description: 'Safe indoor playground layout with non-toxic padding floor tiles.', imagePath: '' },
  { title: 'Senior Citizen Tranquil Park', description: 'Serene outer park perimeter with benches and walking tracks.', imagePath: '' }
]

export default function CommunityLifestyleModule({ config }: { config: Record<string, any>; projectId: string }): JSX.Element {
  const headline = config.headline || 'Community & Social Lifestyle'
  const subtext = config.subtext || 'Interactive spaces designed for social events, celebrations, and relaxing walkouts.'
  const activities: Activity[] = config.activities || (config.features as any) || DEFAULT_ACTIVITIES

  return (
    <div data-testid="module-COMMUNITY_LIFESTYLE" style={{ animation: 'fadeInUp 0.4s var(--ease-out)' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-primary)', margin: 0 }}>
          {headline}
        </h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: 8, maxWidth: 540, marginLeft: 'auto', marginRight: 'auto' }}>
          {subtext}
        </p>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
        {activities.map((act, idx) => (
          <div
            key={idx}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
              animation: `tileEntrance 0.4s ${idx * 0.08}s var(--ease-out) both`
            }}
          >
            {/* Image banner */}
            <div style={{ height: 160, position: 'relative', background: 'linear-gradient(135deg, var(--color-surface-raised) 0%, var(--color-bg) 100%)', overflow: 'hidden' }}>
              {act.imagePath ? (
                <img
                  src={toMediaUrl(act.imagePath)}
                  alt={act.title || (act as any).name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 40 }}>
                  ☕
                </div>
              )}
            </div>

            {/* Info details */}
            <div style={{ padding: 'var(--space-5)' }}>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 6px 0' }}>
                {act.title || (act as any).name}
              </h3>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
                {act.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
