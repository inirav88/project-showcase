import { toMediaUrl } from '../../utils/media'

interface Highlight {
  title: string
  description: string
  imagePath: string
  badge: string
}

export default function UspSpotlightModule({ config }: { config: Record<string, any>; projectId: string }): JSX.Element {
  const rawHighlights = config.highlights || []
  const highlights: Highlight[] = rawHighlights.map((item: any) => {
    if (typeof item === 'string') {
      return {
        title: item,
        description: '',
        imagePath: '',
        badge: ''
      }
    }
    return item
  })
  const headline = config.headline || 'What Sets Us Apart'
  const subtext = config.subtext || 'Signature features crafted for those who demand the extraordinary.'

  return (
    <div data-testid="module-USP_SPOTLIGHT" style={{ animation: 'fadeInUp 0.4s var(--ease-out)' }}>
      {/* Section heading */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <h2 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-text-primary)' }}>
          {headline}
        </h2>
        <p style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-3)', maxWidth: 640, margin: '12px auto 0', lineHeight: 1.6 }}>
          {subtext}
        </p>
      </div>

      {highlights.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">✨</span>
          <h3>No Highlights Added</h3>
          <p>Add project highlights from the Admin Panel to showcase your USPs.</p>
        </div>
      ) : (
        <div className="usp-grid">
          {highlights.map((card, idx) => (
            <div
              key={idx}
              className="usp-card"
              style={{ animation: `tileEntrance 0.4s ${0.08 * idx}s var(--ease-out) both` }}
            >
              {card.imagePath ? (
                <img className="usp-card-img" src={toMediaUrl(card.imagePath)} alt={card.title} />
              ) : (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(135deg, var(--color-surface-raised) 0%, var(--color-surface) 100%)`,
                }} />
              )}

              <div className="usp-card-overlay">
                {card.badge && (
                  <span className="usp-badge">{card.badge}</span>
                )}
                <div className="usp-title">{card.title}</div>
                {card.description && (
                  <div className="usp-desc">{card.description}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}