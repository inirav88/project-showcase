import { useState, useEffect } from 'react'
import { toMediaUrl } from '../../utils/media'
import { ShieldCheckIcon, FileTextIcon, CheckIcon } from '../../components/common/Icons'

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)', alignItems: 'stretch' }}>
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
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <ShieldCheckIcon size={22} color="#10b981" />
              </div>
              <div style={{
                background: 'rgba(16,185,129,0.08)',
                color: '#10b981',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: 11,
                fontWeight: 700,
                border: '1px solid rgba(16,185,129,0.25)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}>
                <CheckIcon size={12} color="#10b981" />
                <span>100% Verified Title</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>RERA Registration No.</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 4, overflowWrap: 'break-word' }}>{reraNo}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approved By Authority</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginTop: 4 }}>{approvedBy}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>RERA Registration Validity</div>
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
                className="interactive-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--color-surface-raised)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ color: 'var(--color-accent)', display: 'flex', alignItems: 'center' }}>
                    <FileTextIcon size={18} color="var(--color-accent)" />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{doc.title}</span>
                </div>
                {doc.filePath ? (
                  <a
                    href={toMediaUrl(doc.filePath)}
                    target="_blank"
                    rel="noreferrer"
                    className="luxury-btn"
                    style={{
                      background: 'var(--color-accent-dim)',
                      color: 'var(--color-accent)',
                      border: '1px solid var(--color-accent-border)',
                      minHeight: 36,
                      padding: '4px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: 'none'
                    }}
                  >
                    View PDF
                  </a>
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--color-text-disabled)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <CheckIcon size={12} /> Approved
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}