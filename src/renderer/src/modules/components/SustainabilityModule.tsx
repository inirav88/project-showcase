interface SustainabilityFeature {
  title: string
  description: string
  icon: string
}

const DEFAULT_INITIATIVES: SustainabilityFeature[] = [
  { title: 'Solar Powered Lighting', description: 'Rooftop solar panel grid powering all common lobby and corridor lighting.', icon: '☀️' },
  { title: 'Rainwater Harvesting', description: 'Integrated filter well channels to naturally recharge groundwater systems.', icon: '🌧️' },
  { title: 'Organic Waste Treatment', description: 'Zero-waste composting facilities transforming organic kitchen waste to organic garden manure.', icon: '♻️' },
  { title: 'EV Charging Grid', description: 'Dedicated charging bays in base car park to power eco-friendly electrical vehicles.', icon: '⚡' }
]

export default function SustainabilityModule({ config }: { config: Record<string, any>; projectId: string }): JSX.Element {
  const headline = config.headline || 'Green & Eco-Friendly Design'
  const subtext = config.subtext || 'Responsible architecture solutions engineered for resource efficiency.'
  const initiatives: SustainabilityFeature[] = config.initiatives || DEFAULT_INITIATIVES

  return (
    <div data-testid="module-SUSTAINABILITY" style={{ animation: 'fadeInUp 0.4s var(--ease-out)' }}>
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
        {initiatives.map((f, idx) => (
          <div
            key={idx}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all var(--transition-fast)',
              animation: `tileEntrance 0.4s ${idx * 0.06}s var(--ease-out) both`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-accent-border)'
              e.currentTarget.style.transform = 'translateY(-3px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--radius-md)',
              background: 'rgba(16,185,129,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, color: '#10b981', marginBottom: 'var(--space-4)', flexShrink: 0
            }}>
              {f.icon || '🌱'}
            </div>
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 var(--space-2) 0' }}>
              {f.title}
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}