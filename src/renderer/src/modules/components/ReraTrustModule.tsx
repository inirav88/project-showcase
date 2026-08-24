import { useState, useEffect } from 'react'
import { toMediaUrl } from '../../utils/media'

interface ReraDoc {
  title: string
  filePath: string
}

export default function ReraTrustModule({ config, projectId }: { config: Record<string, any>; projectId: string }): JSX.Element {
  const [projectRera, setProjectRera] = useState<string>('')
  
  useEffect(() => {
    window.api
      .invoke('project:get', projectId)
      .then((data: any) => {
        if (data && data.reraNumber) {
          setProjectRera(data.reraNumber)
        }
      })
      .catch(console.error)
  }, [projectId])

  const reraNo = config.reraNo || projectRera || 'PR/GJ/GANDHINAGAR/GANDHINAGAR/GMC/RAA13022'
  const validityDate = config.validityDate || 'December 2028'
  const approvedBy = config.approvedBy || 'GUJRERA (Gujarat Real Estate Regulatory Authority)'
  const detailsText = config.detailsText || 'This development project is fully registered and compliant under RERA authority rules, ensuring maximum transparency, verified titles, and timely escrow construction accounts.'
  const documents: ReraDoc[] = config.documents || [
    { title: 'RERA Registration Certificate', filePath: '' },
    { title: 'Approved Building Layout Plan', filePath: '' },
    { title: 'Commencement Certificate', filePath: '' }
  ]

  return (
    <div data-testid="module-RERA_TRUST" style={{ animation: 'fadeInUp 0.4s var(--ease-out)' }}>
      {/* Title */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
          RERA Registration & Compliance
        </h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: 4 }}>
          Regulatory approval details and certified layout documentations.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)', alignItems: 'stretch' }}>
        {/* Compliance Details Card */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 16
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-4)' }}>
              <span style={{ fontSize: 24 }}>🛡️</span>
              <div style={{
                background: 'rgba(16,185,129,0.08)',
                color: '#10b981',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: 11,
                fontWeight: 700,
                border: '1px solid rgba(16,185,129,0.2)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                100% Verified
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>RERA Registration No.</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 4, wordBreak: 'break-all' }}>{reraNo}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Approved By Authority</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginTop: 4 }}>{approvedBy}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>RERA Registration Validity</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginTop: 4 }}>Valid until {validityDate}</div>
              </div>
            </div>
          </div>

          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0, borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
            {detailsText}
          </p>
        </div>

        {/* Legal Documents Download List */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            Official Certifications
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            {documents.map((doc, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--color-surface-raised)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent-border)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>📄</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{doc.title}</span>
                </div>
                {doc.filePath ? (
                  <a
                    href={toMediaUrl(doc.filePath)}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: 'var(--color-accent-dim)',
                      color: 'var(--color-accent)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      textDecoration: 'none'
                    }}
                  >
                    View PDF
                  </a>
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--color-text-disabled)', fontWeight: 500 }}>Certificate Approved</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}