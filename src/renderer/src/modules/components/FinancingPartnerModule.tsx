import { toMediaUrl } from '../../utils/media'

interface BankPartner {
  bankName: string
  logoPath?: string
  interestRate?: string
  maxTenure?: string
}

const DEFAULT_BANKS: BankPartner[] = [
  { bankName: 'State Bank of India (SBI)', interestRate: '8.40%', maxTenure: '30 Years' },
  { bankName: 'HDFC Bank', interestRate: '8.50%', maxTenure: '30 Years' },
  { bankName: 'ICICI Bank', interestRate: '8.45%', maxTenure: '25 Years' },
  { bankName: 'Axis Bank', interestRate: '8.60%', maxTenure: '30 Years' }
]

export default function FinancingPartnerModule({ config }: { config: Record<string, any>; projectId: string }): JSX.Element {
  const headline = config.headline || 'Approved Banking Partners'
  const subtext = config.subtext || 'Get home loan pre-approvals and attractive interest rates with leading national banks.'
  const partners: BankPartner[] = config.partners || DEFAULT_BANKS

  return (
    <div data-testid="module-FINANCING_PARTNER" style={{ animation: 'fadeInUp 0.4s var(--ease-out)' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-primary)', margin: 0 }}>
          {headline}
        </h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: 8, maxWidth: 540, marginLeft: 'auto', marginRight: 'auto' }}>
          {subtext}
        </p>
      </div>

      {/* Partners Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-5)' }}>
        {partners.map((p, idx) => (
          <div
            key={idx}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              textAlign: 'center',
              gap: 16,
              boxShadow: 'var(--shadow-sm)',
              animation: `tileEntrance 0.4s ${idx * 0.06}s var(--ease-out) both`
            }}
          >
            {/* Logo area */}
            <div style={{
              width: '100%',
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              padding: 8
            }}>
              {p.logoPath ? (
                <img
                  src={toMediaUrl(p.logoPath)}
                  alt={p.bankName}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              ) : (
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>
                  🏦 {p.bankName}
                </span>
              )}
            </div>

            {/* Loan info */}
            <div style={{ width: '100%', borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>INTEREST RATE</div>
                  <div style={{ color: 'var(--color-accent)', fontWeight: 700, fontSize: 14, marginTop: 2 }}>
                    {p.interestRate ? `${p.interestRate} p.a.` : 'Rates on Request'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>MAX TENURE</div>
                  <div style={{ color: 'var(--color-text-primary)', fontWeight: 700, fontSize: 13, marginTop: 2 }}>
                    {p.maxTenure || '30 Years'}
                  </div>
                </div>
              </div>
            </div>

            {/* Approved Badge */}
            <div style={{
              background: 'rgba(16,185,129,0.08)',
              color: '#10b981',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: 10,
              fontWeight: 700,
              border: '1px solid rgba(16,185,129,0.2)',
              letterSpacing: '0.05em'
            }}>
              PRE-APPROVED PARTNER
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
