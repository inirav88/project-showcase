import { toMediaUrl } from '../../utils/media'

interface Testimonial {
  clientName: string
  designation: string
  text: string
  rating: number
  photoPath?: string
}

const DEFAULT_REVIEWS: Testimonial[] = [
  {
    clientName: 'Rajesh & Pooja Sharma',
    designation: 'Premium 4BHK Residents',
    rating: 5,
    text: 'The absolute attention to detail, spacing of common spaces, and transparency in legal compliance made this project the easiest and best purchase decision of our life.'
  },
  {
    clientName: 'Vikram Malhotra',
    designation: 'NRI Investor, London',
    rating: 5,
    text: 'Seamless online updates during the construction process combined with great rental yields. Highly recommend Kumbh Infrastructure for NRI clients looking for certified premium sites.'
  },
  {
    clientName: 'Nisha Mehta',
    designation: '3BHK Resident',
    rating: 5,
    text: 'Rooftop clubhouse, green spaces, and smart automation systems make it extremely comfortable for children and elder members of the family alike. High luxury living experience.'
  }
]

export default function TestimonialsModule({ config }: { config: Record<string, any>; projectId: string }): JSX.Element {
  const headline = config.headline || 'What Our Buyers Say'
  const subtext = config.subtext || 'Hear from client reviews who found their dream properties with our projects.'
  const reviews: Testimonial[] = config.reviews || DEFAULT_REVIEWS

  return (
    <div data-testid="module-TESTIMONIALS" style={{ animation: 'fadeInUp 0.4s var(--ease-out)' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-primary)', margin: 0 }}>
          {headline}
        </h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: 8, maxWidth: 540, marginLeft: 'auto', marginRight: 'auto' }}>
          {subtext}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
        {reviews.map((r, idx) => (
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
              boxShadow: 'var(--shadow-sm)',
              animation: `tileEntrance 0.4s ${idx * 0.08}s var(--ease-out) both`
            }}
          >
            <div>
              {/* Star Rating */}
              <div style={{ color: '#f59e0b', fontSize: '14px', marginBottom: 12 }}>
                {Array.from({ length: r.rating || 5 }).map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>

              <p style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.6,
                fontStyle: 'italic',
                margin: '0 0 16px 0'
              }}>
                "{r.text}"
              </p>
            </div>

            {/* Author Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
              {r.photoPath ? (
                <img
                  src={toMediaUrl(r.photoPath)}
                  alt={r.clientName}
                  style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--color-border)' }}
                />
              ) : (
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--color-accent-dim)', color: 'var(--color-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700
                }}>
                  {r.clientName.charAt(0)}
                </div>
              )}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>{r.clientName}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{r.designation}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}