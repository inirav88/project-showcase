import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { useShortlistStore } from '../../../store/useShortlistStore'
import { IPC_CHANNELS } from '../../../../../main/ipc/channels'

export interface ShortlistDrawerProps {
  projectId: string
  projectName: string
  onClose: () => void
}

export function ShortlistDrawer({ projectId, projectName, onClose }: ShortlistDrawerProps): JSX.Element {
  const { items, removeItem, clearShortlist } = useShortlistStore()
  const [customerName, setCustomerName] = useState('')
  const [exporting, setExporting] = useState(false)
  const [showExport, setShowExport] = useState(false)

  // QR Take-Away settings and state
  const [settings, setSettings] = useState<any>(() => {
    try {
      const cached = localStorage.getItem('showcaseos_settings')
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  })
  const [qrUrl, setQrUrl] = useState<string>('')
  const [qrType, setQrType] = useState<'whatsapp' | 'vcard'>('whatsapp')

  useEffect(() => {
    window.api.invoke(IPC_CHANNELS.SETTINGS_GET)
      .then((data) => {
        setSettings(data as any)
        try { localStorage.setItem('showcaseos_settings', JSON.stringify(data)) } catch {}
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!settings) return
    let text = ''
    if (qrType === 'whatsapp') {
      const rawPhone = settings.firmContactPhone || ''
      const phone = rawPhone.replace(/\D/g, '')
      const msg = `Interested in ${projectName}, please send more details.`
      text = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
    } else {
      text = `BEGIN:VCARD\nVERSION:3.0\nFN:${settings.firmName || 'Sales Office'}\nTEL;TYPE=CELL:${settings.firmContactPhone || ''}\nEMAIL:${settings.firmContactEmail || ''}\nURL:${settings.firmWebsite || ''}\nEND:VCARD`
    }
    QRCode.toDataURL(text, { width: 140, margin: 1 })
      .then(setQrUrl)
      .catch(console.error)
  }, [settings, qrType, projectName])

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName) return
    setExporting(true)
    try {
      const res = await (window as any).api.invoke(IPC_CHANNELS.EXPORT_PDF, {
        projectId,
        customerName,
        selectedUnitIds: items.map((i) => i.unitId),
      }) as any
      if (res.success) {
        alert(`Brochure saved:\n${res.filePath}`)
        setShowExport(false)
        setCustomerName('')
        onClose()
      } else {
        alert(`Export failed: ${res.reason}`)
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'var(--backdrop-modal)',
          backdropFilter: 'blur(4px)', zIndex: 200, animation: 'fadeIn 0.2s ease'
        }}
      />
      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
        background: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column', zIndex: 201,
        boxShadow: 'var(--shadow-xl)', animation: 'slideInRight 0.3s var(--ease-out)'
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '24px 24px 16px', borderBottom: '1px solid var(--color-border)'
        }}>
          <div>
            <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>Your Shortlist</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>
              {items.length} unit{items.length !== 1 ? 's' : ''} selected
            </div>
          </div>
          <button
            onClick={onClose}
            className="close-btn-accessible"
            aria-label="Close shortlist"
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.length === 0 ? (
            <div className="empty-state" style={{ marginTop: 60 }}>
              <span className="empty-state-icon">🏠</span>
              <h3>No Units Shortlisted</h3>
              <p>Navigate to Pricing section and tap the heart icon to shortlist units.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.unitId} style={{
                background: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 'var(--font-size-base)' }}>
                    {item.towerName} · Unit {item.unitNumber}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                    {item.configuration}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-accent)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.price)}
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.unitId)}
                  className="shortlist-remove-btn"
                  aria-label={`Remove ${item.unitNumber} from shortlist`}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        {/* QR Take-Away Section */}
        {settings && (
          <div style={{
            margin: '0 24px 16px',
            padding: '16px',
            background: 'var(--color-surface-raised)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📱</span> QR Take-Away
            </div>

            <div style={{ display: 'flex', background: 'var(--color-bg)', borderRadius: 8, padding: 2, width: '100%' }}>
              <button
                type="button"
                onClick={() => setQrType('whatsapp')}
                style={{
                  flex: 1, padding: '6px', fontSize: 11, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
                  background: qrType === 'whatsapp' ? 'var(--color-accent)' : 'transparent',
                  color: qrType === 'whatsapp' ? '#fff' : 'var(--color-text-muted)',
                  fontFamily: 'var(--font-sans)', transition: 'all 0.2s'
                }}
              >
                WhatsApp Chat
              </button>
              <button
                type="button"
                onClick={() => setQrType('vcard')}
                style={{
                  flex: 1, padding: '6px', fontSize: 11, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
                  background: qrType === 'vcard' ? 'var(--color-accent)' : 'transparent',
                  color: qrType === 'vcard' ? '#fff' : 'var(--color-text-muted)',
                  fontFamily: 'var(--font-sans)', transition: 'all 0.2s'
                }}
              >
                Save Contact
              </button>
            </div>

            {qrUrl ? (
              <div style={{ background: '#fff', padding: 8, borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <img src={qrUrl} alt="QR Code" style={{ width: 120, height: 120 }} />
              </div>
            ) : (
              <div style={{ height: 136, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Generating QR...</div>
            )}

            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.4 }}>
              {qrType === 'whatsapp'
                ? `Scan to open a pre-filled WhatsApp chat with the sales team.`
                : `Scan to quickly save the sales team's contact details.`
              }
            </div>
          </div>
        )}

        {items.length > 0 && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => setShowExport(true)}
              style={{
                all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, padding: '14px',
                background: 'var(--color-accent)', color: 'var(--color-bg)', fontWeight: 700,
                borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-base)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <span style={{ fontSize: 18 }}>📄</span>
              Export PDF Brochure
            </button>
            <button
              onClick={clearShortlist}
              style={{
                all: 'unset', cursor: 'pointer', padding: '10px',
                textAlign: 'center', color: 'var(--color-text-muted)',
                fontSize: 'var(--font-size-sm)', fontWeight: 500,
                transition: 'color var(--transition-fast)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
            >
              Clear all
            </button>
          </div>
        )}

        {showExport && (
          <div style={{
            position: 'absolute', inset: 0, background: 'var(--backdrop-modal)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
            padding: 24
          }}>
            <form onSubmit={handleExport} style={{
              background: 'var(--color-surface)', padding: 28, borderRadius: 16,
              border: '1px solid var(--color-border)', width: '100%', display: 'flex', flexDirection: 'column', gap: 16
            }}>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>Personalize Brochure</div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Customer Name *
                </label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Nirav Patel"
                  required
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid var(--color-border)', background: 'var(--color-surface-raised)', color: 'var(--color-text-primary)',
                    fontSize: 'var(--font-size-base)', fontFamily: 'var(--font-sans)',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={() => setShowExport(false)} style={{
                  flex: 1, padding: '12px', borderRadius: 8, border: '1px solid var(--color-border)',
                  background: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer', fontWeight: 500
                }}>
                  Back
                </button>
                <button type="submit" disabled={exporting} style={{
                  flex: 2, padding: '12px', borderRadius: 8, border: 'none',
                  background: 'var(--color-accent)', color: 'var(--color-bg)', cursor: 'pointer', fontWeight: 700
                }}>
                  {exporting ? 'Generating…' : 'Download PDF'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  )
}
