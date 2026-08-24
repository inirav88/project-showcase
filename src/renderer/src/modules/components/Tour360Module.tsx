export default function Tour360Module({ config }: { config: Record<string, any>; projectId: string }): JSX.Element {
  const embedUrl = config.embedUrl || ''
  const title = config.title || '360° Virtual Tour'
  const subtext = config.subtext || 'Experience the residence in immersive virtual reality.'

  return (
    <div data-testid="module-TOUR_360" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'fadeInUp 0.4s var(--ease-out)' }}>
      <div style={{ marginBottom: 'var(--space-2)' }}>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
          {title}
        </h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: 4 }}>
          {subtext}
        </p>
      </div>

      <div style={{
        flex: 1,
        minHeight: 460,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        position: 'relative'
      }}>
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={title}
            width="100%"
            height="100%"
            style={{ border: 'none', position: 'absolute', inset: 0 }}
            allowFullScreen
            allow="xr-spatial-tracking; gyroscope; accelerometer"
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 16, padding: 'var(--space-8)', textAlign: 'center'
          }}>
            <span style={{ fontSize: 48 }}>🌐</span>
            <h3 style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Virtual Tour Sandbox</h3>
            <p style={{ maxWidth: 380, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              Add a 360° virtual tour URL (Matterport, Kuula, or YouTube 360) in the Admin Panel to display it here.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}