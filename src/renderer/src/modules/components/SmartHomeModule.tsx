interface SmartFeature {
  title: string
  description: string
  icon: string
}

const DEFAULT_FEATURES: SmartFeature[] = [
  { title: 'Biometric Access', description: 'Advanced face recognition and fingerprint door locks for entry.', icon: '🔒' },
  { title: 'Voice Automation', description: 'Control fans, lighting, and climate with Alexa or Google Assistant.', icon: '🎙️' },
  { title: 'Automated Lighting', description: 'Dimmable smart ambient lighting with custom mood scheduling presets.', icon: '💡' },
  { title: 'Climate Control', description: 'Integrated air conditioning schedules based on ambient temperature sensors.', icon: '🌡️' },
  { title: 'Intrusion Detection', description: 'Real-time alert notifications forwarded to your smartphone dashboard.', icon: '🚨' }
]

export default function SmartHomeModule({ config }: { config: Record<string, any>; projectId: string }): JSX.Element {
  const headline = config.headline || 'Automation & Smart Living'
  const subtext = config.subtext || 'Next-generation home automation features integrated for absolute convenience.'
  const features: SmartFeature[] = config.features || DEFAULT_FEATURES

  return (
    <div data-testid="module-SMART_HOME" style={{ animation: 'fadeInUp 0.4s var(--ease-out)' }}>
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
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 'var(--space-5)'
      }}>
        {features.map((f, idx) => (
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
              background: 'var(--color-accent-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, marginBottom: 'var(--space-4)', flexShrink: 0
            }}>
              {f.icon || '🤖'}
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