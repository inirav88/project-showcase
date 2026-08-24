import { toMediaUrl } from '../../utils/media'

export default function FoundersNoteModule({ config }: { config: Record<string, any>; projectId: string }): JSX.Element {
  const founderName = config.founderName || 'Sanjay Kumbhani'
  const founderRole = config.founderRole || 'Founder & Managing Director'
  const noteText = config.noteText || 'Our mission has always been to build real estate projects that stand the test of time, both structurally and visually. Every corner of our layout is crafted with standard engineering, legal transparency, and visual luxury to ensure our clients receive a home that is truly premium in quality.'
  const photoPath = config.photoPath || ''
  const signaturePath = config.signaturePath || ''

  return (
    <div data-testid="module-FOUNDERS_NOTE" style={{ animation: 'fadeInUp 0.4s var(--ease-out)' }}>
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-8)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 'var(--space-8)',
        alignItems: 'center',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Photo Portrait */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {photoPath ? (
            <img
              src={toMediaUrl(photoPath)}
              alt={founderName}
              style={{
                width: '100%',
                maxHeight: 340,
                objectFit: 'cover',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)'
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              aspectRatio: '3/4',
              maxHeight: 340,
              background: 'linear-gradient(135deg, var(--color-surface-raised) 0%, var(--color-bg) 100%)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              color: 'var(--color-text-muted)',
              padding: 24,
              textAlign: 'center'
            }}>
              <span style={{ fontSize: 48 }}>👤</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Upload Founder Portrait in Admin Settings</span>
            </div>
          )}
        </div>

        {/* Message Address */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <span style={{ fontSize: 32, color: 'var(--color-accent)', fontWeight: 800 }}>“</span>
            <p style={{
              fontSize: 'var(--font-size-base)',
              color: 'var(--color-text-primary)',
              lineHeight: 1.8,
              margin: '0 0 10px 0',
              fontWeight: 400
            }}>
              {noteText}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                {founderName}
              </h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 4, fontWeight: 500 }}>
                {founderRole}
              </p>
            </div>
            
            {/* Signature image */}
            {signaturePath ? (
              <img
                src={toMediaUrl(signaturePath)}
                alt="Founder Signature"
                style={{ height: 44, objectFit: 'contain', opacity: 0.85 }}
              />
            ) : (
              <span style={{ fontSize: 16, fontStyle: 'italic', fontFamily: 'serif', color: 'var(--color-text-muted)', opacity: 0.6 }}>
                {founderName}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}