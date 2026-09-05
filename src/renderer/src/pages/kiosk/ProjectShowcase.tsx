import { useEffect, useState, useRef, Suspense, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useKioskExit } from '../../hooks/useKioskExit'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'
import { moduleRegistry, isRegisteredModule } from '../../modules/registry'
import { useShortlistStore } from '../../store/useShortlistStore'
import { IntroVideoOverlay } from '../../components/IntroVideoOverlay'
import { PersonaSelector, type Persona } from '../../components/PersonaSelector'
import { useAmbientAudio } from '../../hooks/useAmbientAudio'
import QRCode from 'qrcode'
import { AccessibilityToggle } from '../../components/AccessibilityToggle'
// toMediaUrl removed from direct import - used in child components

interface Project {
  id: string
  name: string
  developer: string
  reraNumber: string
  themeAccentColor: string
  themeFontPairing: string
  location: string
  type: string
  introVideoMediaId?: string | null
  media?: { id: string; filePath: string; category: string }[]
}

interface ModuleRecord {
  id: string
  moduleType: string
  config: string
  sortOrder: number
  isVisible: boolean
}

const MODULE_LABELS: Record<string, string> = {
  OVERVIEW: 'Overview', GALLERY: 'Gallery', VIDEOS: 'Videos',
  TOUR_360: '360° Tour', MASTER_PLAN: 'Master Plan', AMENITIES: 'Amenities',
  LOCATION: 'Location', PRICING: 'Pricing', BROCHURE: 'Brochure',
  COMPARE_UNITS: 'Compare', CALCULATORS: 'Calculators', USP_SPOTLIGHT: 'Highlights',
  FOUNDERS_NOTE: 'Our Story', COMMUNITY_LIFESTYLE: 'Lifestyle', SUSTAINABILITY: 'Sustainability',
  SMART_HOME: 'Smart Home', SPORTS_CAROUSEL: 'Sports', CONSTRUCTION_TIMELINE: 'Timeline',
  FINANCING_PARTNER: 'Financing', TESTIMONIALS: 'Testimonials', RERA_TRUST: 'RERA',
}

// ── PIN Keypad Modal ─────────────────────────────────────────────────────────
function PinModal({
  onVerify, onClose,
}: {
  onVerify: (pin: string) => Promise<boolean>
  onClose: () => void
}) {
  const [digits, setDigits] = useState<string[]>([])
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  const handleKey = useCallback(async (d: string) => {
    if (checking) return
    if (d === '⌫' || d === 'Backspace') {
      setDigits((prev) => prev.slice(0, -1))
      setError('')
      return
    }
    const next = [...digits, d]
    setDigits(next)
    if (next.length === 4) {
      setChecking(true)
      const ok = await onVerify(next.join(''))
      if (!ok) {
        setError('Incorrect PIN — try again')
        setDigits([])
      }
      setChecking(false)
    }
  }, [checking, digits, onVerify])

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('Key pressed:', e.key) // Debug log

      if (checking) return

      // Handle number keys (0-9)
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        e.stopPropagation()
        handleKey(e.key)
      }
      // Handle backspace/delete
      else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault()
        e.stopPropagation()
        handleKey('⌫')
      }
      // Handle escape to close
      else if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }

    console.log('Keyboard listener attached') // Debug log
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      console.log('Keyboard listener removed') // Debug log
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [checking, handleKey, onClose])

  return (
    <div className="pin-backdrop" role="dialog" aria-label="Admin PIN entry" aria-modal="true">
      <div className="pin-modal">
        <div style={{ textAlign: 'center' }}>
          <div className="text-min-readable" style={{
            fontWeight: 700, color: 'var(--color-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8
          }}>
            Admin Access
          </div>
          <div style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text-primary)', fontWeight: 600 }}>
            Enter 4-digit PIN
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>
            Use keyboard or click buttons below
          </div>
        </div>

        <div className="pin-display">
          {[0,1,2,3].map((i) => (
            <div key={i} className={`pin-dot${digits[i] !== undefined ? ' filled' : ''}`} />
          ))}
        </div>

        {error && (
          <div className="error-message-accessible" role="alert">
            {error}
          </div>
        )}

        <div className="pin-keypad">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, i) => (
            key === '' ? (
              <div key={i} />
            ) : (
              <button
                key={key + i}
                className={`pin-key${checking ? ' btn-loading' : ''}`}
                onClick={() => handleKey(key)}
                disabled={checking}
                aria-label={key === '⌫' ? 'Delete' : `Number ${key}`}
              >
                {key}
              </button>
            )
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            all: 'unset', cursor: 'pointer', textAlign: 'center',
            fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)',
            padding: '8px', transition: 'color var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Shortlist Drawer ─────────────────────────────────────────────────────────
function ShortlistDrawer({
  projectId, projectName, onClose,
}: {
  projectId: string
  projectName: string
  onClose: () => void
}) {
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

// ── Main Showcase ────────────────────────────────────────────────────────────
export default function ProjectShowcase(): JSX.Element {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [modules, setModules] = useState<ModuleRecord[]>([])
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)

  const tabsRef = useRef<HTMLElement>(null)

  // Implement mouse click-and-drag horizontal scrolling for the tab navigation
  useEffect(() => {
    const el = tabsRef.current
    if (!el) return

    let isDown = false
    let moved = false
    let startX: number
    let scrollLeft: number

    const onMouseDown = (e: MouseEvent) => {
      isDown = true
      moved = false
      startX = e.pageX - el.offsetLeft
      scrollLeft = el.scrollLeft
    }

    const onMouseUp = () => {
      isDown = false
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return
      const x = e.pageX - el.offsetLeft
      const walk = (x - startX) * 1.5 // Speed multiplier
      if (Math.abs(walk) > 5) {
        moved = true
      }
      el.scrollLeft = scrollLeft - walk
    }

    // Prevent default dragstart event so clicking/dragging on tabs doesn't trigger native drag-and-drop
    const onDragStart = (e: DragEvent) => {
      e.preventDefault()
    }

    // Intercept and suppress mouse clicks if the user was actively dragging/scrolling
    const onClick = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    el.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)
    el.addEventListener('dragstart', onDragStart)
    el.addEventListener('click', onClick, { capture: true })

    return () => {
      el.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      el.removeEventListener('dragstart', onDragStart)
      el.removeEventListener('click', onClick, { capture: true })
    }
  }, [])

  const [showPinModal, setShowPinModal] = useState(false)
  const [pinPurpose, setPinPurpose] = useState<'admin' | 'exit'>('admin')
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showLeadModal, setShowLeadModal] = useState(true)
  const [showShortlist, setShowShortlist] = useState(false)

  // Intro video, persona, ambient audio
  const [showIntroVideo, setShowIntroVideo] = useState(false)
  const [introVideoPath, setIntroVideoPath] = useState<string | null>(null)
  const [showPersona, setShowPersona] = useState(false)
  const [_persona, setPersona] = useState<Persona | null>(null)

  // Lead capture
  const [leadName, setLeadName] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [submittingLead, setSubmittingLead] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [settings, setSettings] = useState<any>(null)
  const [narrationMuted, setNarrationMuted] = useState(false)

  // Session
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sectionsViewed, setSectionsViewed] = useState<Set<string>>(new Set(['OVERVIEW']))

  const { items: shortlistItems } = useShortlistStore()

  // Ambient audio - resolved after project loads
  const ambientAudioPath = (project as any)?.ambientAudioMediaId && (project as any)?.media
    ? ((project as any).media as {id:string;filePath:string}[]).find((m) => m.id === (project as any).ambientAudioMediaId)?.filePath ?? null
    : null
  const { muted, toggleMute, hasAudio } = useAmbientAudio(ambientAudioPath)

  const { startHold, endHold, isHolding, progress } = useKioskExit({
    onExit: () => setShowPinModal(true),
  })

  useEffect(() => {
    if (!projectId) return
    window.api.invoke(IPC_CHANNELS.PROJECT_GET, projectId)
      .then((data) => setProject(data as Project))
      .catch(console.error)

    window.api.invoke(IPC_CHANNELS.SETTINGS_GET)
      .then((data: any) => {
        setSettings(data)
        if (data && data.narrationEnabled === false) {
          setNarrationMuted(true);
        }
      })
      .catch(console.error)

    window.api.invoke(IPC_CHANNELS.MODULE_LIST, projectId)
      .then((data) => {
        const visible = (data as ModuleRecord[]).filter((m) => m.isVisible)
        setModules(visible)
        if (visible.length > 0 && !activeModuleId) {
          setActiveModuleId(visible[0].id)
        }
      })
      .catch(console.error)
  }, [projectId])

  useEffect(() => {
    if (!project) return
    document.documentElement.style.setProperty('--project-accent', project.themeAccentColor)
    document.documentElement.style.setProperty('--project-font', project.themeFontPairing)

    window.api.invoke(IPC_CHANNELS.SESSION_START, { projectId: project.id })
      .then((res: any) => res?.id && setSessionId(res.id))
      .catch(console.error)

    // Trigger intro video if configured
    if ((project as any).introVideoMediaId && (project as any).media) {
      const introMedia = ((project as any).media as {id:string;filePath:string}[]).find(
        (m) => m.id === (project as any).introVideoMediaId
      )
      if (introMedia?.filePath) {
        setIntroVideoPath(introMedia.filePath)
        setShowIntroVideo(true)
      }
    }

    return () => {
      document.documentElement.style.removeProperty('--project-accent')
      document.documentElement.style.removeProperty('--project-font')
    }
  }, [project])

  useEffect(() => {
    if (!sessionId || shortlistItems.length === 0) return
    window.api.invoke(IPC_CHANNELS.SESSION_SHORTLIST, {
      id: sessionId,
      unitIds: shortlistItems.map((i) => i.unitId),
    }).catch(console.error)
  }, [shortlistItems, sessionId])

  // 1. Sync navigation listener from presenter window (FR-14)
  useEffect(() => {
    const unsub = window.api.on('system:navigateToModule', (moduleId: any) => {
      const target = modules.find((m) => m.id === moduleId)
      if (target) {
        setActiveModuleId(target.id)
        setSectionsViewed((prev) => new Set([...prev, target.moduleType]))
      }
    })
    return () => unsub()
  }, [modules])

  // 2. Voice Narration effect (FR-20) using Web Speech API
  useEffect(() => {
    if (!project || !activeModule) return
    window.speechSynthesis?.cancel()
    if (narrationMuted) return

    let narrationText = ''
    try {
      const config = JSON.parse(activeModule.config || '{}')
      if (config.narrationText) {
        narrationText = config.narrationText
      }
    } catch {}

    if (!narrationText) {
      if (activeModule.moduleType === 'OVERVIEW') {
        narrationText = `Welcome to the overview of ${project.name}, developed by ${project.developer}. It is situated in ${project.location} and features a premium ${project.type.toLowerCase()} development.`
      } else if (activeModule.moduleType === 'LOCATION') {
        narrationText = `Here is the location map for ${project.name} in ${project.location}. Exploring the connectivity and nearby points of interest.`
      } else if (activeModule.moduleType === 'PRICING') {
        narrationText = `Explore the pricing details and unit availability for ${project.name}. You can click the heart icon on any unit to add it to your shortlist.`
      } else if (activeModule.moduleType === 'AMENITIES') {
        narrationText = `Take a look at the curated lifestyle amenities offered at ${project.name}. Designed to provide a luxurious experience.`
      }
    }

    if (narrationText) {
      const timer = setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(narrationText)
        utterance.rate = 0.95
        utterance.pitch = 1.0
        window.speechSynthesis?.speak(utterance)
      }, 500)
      return () => clearTimeout(timer)
    }

    return () => {
      window.speechSynthesis?.cancel()
    }
  }, [activeModuleId, project, narrationMuted])
  if (!project) return <div className="loading">Loading project…</div>

  const handleBack = () => {
    if (sessionId) {
      window.api.invoke(IPC_CHANNELS.SESSION_END, {
        id: sessionId,
        sectionsViewed: Array.from(sectionsViewed),
      }).catch(console.error)
    }
    navigate('/kiosk')
  }

  const handleTabClick = (mod: ModuleRecord) => {
    setActiveModuleId(mod.id)
    setSectionsViewed((prev) => new Set([...prev, mod.moduleType]))
    window.api.invoke(IPC_CHANNELS.SECOND_DISPLAY, { action: 'sync', moduleType: mod.moduleType }).catch(console.error)
  }

  const handlePinVerify = async (pin: string) => {
    try {
      const isValid = await (window as any).api.invoke(IPC_CHANNELS.SETTINGS_VERIFY_PIN, pin)
      if (isValid) {
        setShowPinModal(false)
        if (pinPurpose === 'exit') {
          window.api.invoke(IPC_CHANNELS.EXIT_KIOSK)
        } else {
          if (sessionId) {
            window.api.invoke(IPC_CHANNELS.SESSION_END, {
              id: sessionId,
              sectionsViewed: Array.from(sectionsViewed),
            }).catch(console.error)
          }
          navigate('/admin')
        }
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const validateEmail = (email: string): boolean => {
    if (!email) return true // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string): boolean => {
    if (!phone) return false // Required field
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/
    return phoneRegex.test(phone)
  }

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate fields
    let hasErrors = false

    if (leadEmail && !validateEmail(leadEmail)) {
      setEmailError('Please enter a valid email address')
      hasErrors = true
    } else {
      setEmailError('')
    }

    if (!validatePhone(leadPhone)) {
      setPhoneError('Please enter a valid phone number (minimum 10 digits)')
      hasErrors = true
    } else {
      setPhoneError('')
    }

    if (hasErrors || !leadName) return

    setSubmittingLead(true)
    try {
      await window.api.invoke(IPC_CHANNELS.LEAD_CREATE, {
        projectId: project.id, name: leadName, phone: leadPhone, email: leadEmail,
        notes: `Session start - ${project.name}`,
      })
      setShowLeadModal(false)
      setShowPersona(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingLead(false)
    }
  }

  const handlePersonaSelect = (p: Persona) => {
    setPersona(p)
    setShowPersona(false)
  }

  const activeModule = modules.find((m) => m.id === activeModuleId) ?? modules[0]

  let activeConfig: Record<string, any> = {}
  try { activeConfig = JSON.parse(activeModule?.config || '{}') } catch { /**/ }

  return (
    <div className="showcase">
      {/* Intro Video Overlay */}
      {showIntroVideo && introVideoPath && (
        <IntroVideoOverlay mediaFilePath={introVideoPath} onComplete={() => setShowIntroVideo(false)} />
      )}
      {/* Persona Selector */}
      {showPersona && (
        <PersonaSelector onSelect={handlePersonaSelect} onSkip={() => setShowPersona(false)} />
      )}
      {/* Corner hold zone for admin PIN */}
      <div
        className={`kiosk-exit-corner${isHolding ? ' holding' : ''}`}
        onPointerDown={startHold}
        onPointerUp={endHold}
        onPointerLeave={endHold}
        style={{ '--hold-progress': `${progress}%` } as React.CSSProperties}
        role="button"
        aria-label="Hold to access admin panel"
      />

      {/* Header */}
      <header className="showcase-header">
        <button
          className="back-btn"
          onClick={handleBack}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleBack();
          }}
          aria-label="Go back to project selection"
        >
          {String.fromCharCode(8592)} Back
        </button>
        <div className="showcase-header-info">
          <h1>{project.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              {project.developer}
            </span>
            {project.reraNumber && (
              <>
                <span style={{ color: 'var(--color-border)', fontSize: 12 }}>{String.fromCharCode(8226)}</span>
                <span className="rera-badge">: {project.reraNumber}</span>
              </>
            )}
          </div>
        </div>

        {/* Shortlist counter button */}
        <button
          onClick={() => setShowShortlist(true)}
          style={{
            all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', background: shortlistItems.length > 0 ? 'var(--color-accent-dim)' : 'var(--color-surface-raised)',
            border: `1px solid ${shortlistItems.length > 0 ? 'var(--color-accent-border)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-sm)', fontWeight: 600,
            color: shortlistItems.length > 0 ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            transition: 'all var(--transition-fast)', whiteSpace: 'nowrap' as const,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={shortlistItems.length > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          Shortlist
          {shortlistItems.length > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 20, height: 20, borderRadius: '50%', background: 'var(--color-accent)',
              color: 'var(--color-bg)', fontSize: 11, fontWeight: 800
            }}>
              {shortlistItems.length}
            </span>
          )}
        </button>
        {/* Ambient audio mute button */}
        {hasAudio && (
          <button
            onClick={toggleMute}
            title={muted ? "Unmute ambient audio" : "Mute ambient audio"}
            aria-label={muted ? "Unmute ambient audio" : "Mute ambient audio"}
            className="btn-hover-effect"
            style={{
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              padding: "10px 14px", borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)",
            }}
          >
            {muted ? String.fromCodePoint(128263) : String.fromCodePoint(128266)}
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12 }}>
          <AccessibilityToggle />
          <button
            onClick={() => {
              const nextVal = !narrationMuted
              setNarrationMuted(nextVal)
              if (nextVal) window.speechSynthesis?.cancel()
            }}
            title={narrationMuted ? 'Unmute voice narration' : 'Mute voice narration'}
            aria-label={narrationMuted ? 'Unmute voice narration' : 'Mute voice narration'}
            className="btn-hover-effect"
            style={{
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 14px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)',
            }}
          >
            {narrationMuted ? String.fromCodePoint(128263) + ' Narration' : String.fromCodePoint(128483) + ' Narration'}
          </button>
          {(settings?.showExitButton ?? true) && (
            <button
              onClick={() => {
                if (settings.exitRequiresPin) {
                  setPinPurpose('exit')
                  setShowPinModal(true)
                } else {
                  setShowExitConfirm(true)
                }
              }}
              title="Exit Application"
              aria-label="Exit Application"
              className="btn-hover-effect"
              style={{
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-error, #ef4444)'
                e.currentTarget.style.borderColor = 'var(--color-error, #ef4444)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-secondary)'
                e.currentTarget.style.borderColor = 'var(--color-border)'
              }}
            >
              <span>⏻</span> Exit
            </button>
          )}
        </div>
      </header>

      {/* Tab navigation */}
      <nav ref={tabsRef} className="module-tabs-bar" role="tablist">
        {modules.map((mod) => (
          <button
            key={mod.id}
            role="tab"
            aria-selected={mod.id === activeModuleId}
            className={`module-tab-btn${mod.id === activeModuleId ? ' active' : ''}`}
            onClick={() => handleTabClick(mod)}
          >
            {MODULE_LABELS[mod.moduleType] ?? mod.moduleType.replace('_', ' ')}
          </button>
        ))}
      </nav>

      {/* Module Content */}
      <main className="showcase-content" key={activeModuleId} style={{ position: "relative" }}>
        {/* Subtle firm-branded watermark overlay (FR-18) */}
        {settings?.firmName && settings.watermarkEnabled !== false && (
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", zIndex: 999,
            opacity: 0.05, color: "var(--color-text-primary)", display: "flex",
            flexWrap: "wrap", gap: "80px", padding: "40px", overflow: "hidden",
            justifyContent: "center", alignContent: "center"
          }}>
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} style={{
                transform: "rotate(-30deg)", fontSize: "14px", fontWeight: 700,
                whiteSpace: "nowrap", fontFamily: "var(--font-sans)",
                letterSpacing: "0.1em", textTransform: "uppercase"
              }}>
                {settings.firmName} Kiosk
              </div>
            ))}
          </div>
        )}
        {activeModule && isRegisteredModule(activeModule.moduleType) && projectId ? (
          <Suspense fallback={<div className="loading">Loading…</div>}>
            {(() => {
              const Comp = moduleRegistry[activeModule.moduleType]
              return <Comp config={activeConfig} projectId={projectId} />
            })()}
          </Suspense>
        ) : (
          <div className="empty-state">
            <span className="empty-state-icon">🧩</span>
            <h3>No Modules Configured</h3>
            <p>Add modules to this project from the Admin Panel to begin the showcase.</p>
          </div>
        )}
      </main>

      {/* Shortlist Drawer */}
      {showShortlist && projectId && (
        <ShortlistDrawer projectId={projectId} projectName={project.name} onClose={() => setShowShortlist(false)} />
      )}

      {/* PIN Modal */}
      {showPinModal && (
        <PinModal
          onVerify={handlePinVerify}
          onClose={() => setShowPinModal(false)}
        />
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="pin-backdrop" role="dialog" aria-label="Exit confirmation">
          <div className="pin-modal" style={{ maxWidth: 360, textAlign: 'center', padding: '28px 24px' }}>
            <div style={{ fontSize: 32, marginBottom: 8, color: 'var(--color-error, #ef4444)' }}>⏻</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
              Exit Showcase OS?
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 24, lineHeight: 1.4 }}>
              Are you sure you want to close the presentation application?
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowExitConfirm(false)}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 8, border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-raised)', color: 'var(--color-text-primary)',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => window.api.invoke(IPC_CHANNELS.EXIT_KIOSK)}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none',
                  background: 'var(--color-error, #ef4444)', color: '#fff',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer'
                }}
              >
                Exit Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lead capture modal */}
      {showLeadModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--backdrop-modal)',
          backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 300, animation: 'fadeIn 0.25s ease'
        }}>
          <form onSubmit={handleLeadSubmit} style={{
            background: 'var(--color-surface)', padding: '40px 36px', borderRadius: 24,
            border: '1px solid var(--color-border)', width: 440, maxWidth: '90vw',
            display: 'flex', flexDirection: 'column', gap: 20,
            boxShadow: 'var(--shadow-xl)', animation: 'scaleIn 0.3s var(--ease-out)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <div style={{
                display: 'inline-flex', width: 56, height: 56, borderRadius: '50%',
                background: 'var(--color-accent-dim)', border: '1px solid var(--color-accent-border)',
                alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 24
              }}>
                🏠
              </div>
              <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-accent)', letterSpacing: '-0.02em' }}>
                {project.name}
              </h3>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
                Begin your exclusive property tour — enter details to unlock pricing and calculators.
              </p>
            </div>

            {[
              { label: 'Full Name *', value: leadName, setter: setLeadName, placeholder: 'e.g. Nirav Patel', required: true, type: 'text', error: '' },
              { label: 'Mobile Number *', value: leadPhone, setter: setLeadPhone, placeholder: 'e.g. +91 98765 43210', required: true, type: 'tel', error: phoneError },
              { label: 'Email Address', value: leadEmail, setter: setLeadEmail, placeholder: 'Optional', required: false, type: 'email', error: emailError },
            ].map(({ label, value, setter, placeholder, required, type, error }) => (
              <div key={label} className="form-field-wrapper">
                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {label}
                </label>
                <input
                  type={type}
                  value={value}
                  onChange={(e) => {
                    setter(e.target.value)
                    // Clear error on change
                    if (label === 'Email Address' && emailError) setEmailError('')
                    if (label === 'Mobile Number *' && phoneError) setPhoneError('')
                  }}
                  onBlur={() => {
                    // Validate on blur
                    if (label === 'Email Address' && value && !validateEmail(value)) {
                      setEmailError('Please enter a valid email address')
                    }
                    if (label === 'Mobile Number *' && value && !validatePhone(value)) {
                      setPhoneError('Please enter a valid phone number (minimum 10 digits)')
                    }
                  }}
                  placeholder={placeholder}
                  required={required}
                  className={error ? 'form-field-error' : ''}
                  aria-invalid={error ? 'true' : 'false'}
                  aria-describedby={error ? `${label}-error` : undefined}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 10,
                    border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
                    background: 'var(--color-surface-raised)',
                    color: 'var(--color-text-primary)', fontSize: 'var(--font-size-base)', fontFamily: 'var(--font-sans)', outline: 'none',
                    transition: 'border-color var(--transition-fast)'
                  }}
                />
                {error && (
                  <div id={`${label}-error`} className="field-validation-message error" role="alert">
                    {error}
                  </div>
                )}
              </div>
            ))}

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setShowLeadModal(false)}
                style={{
                  all: 'unset', cursor: 'pointer', fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-muted)', padding: '4px 8px',
                  transition: 'color var(--transition-fast)'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
              >
                Skip
              </button>
              <button
                type="submit"
                disabled={submittingLead}
                className={submittingLead ? 'btn-loading' : ''}
                style={{
                  flex: 1, padding: '14px', background: 'var(--color-accent)', color: 'var(--color-bg)',
                  border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 'var(--font-size-base)',
                  cursor: submittingLead ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)',
                  transition: 'opacity var(--transition-fast)', opacity: submittingLead ? 0.7 : 1,
                  position: 'relative'
                }}
              >
                {submittingLead ? 'Loading…' : 'Start Presentation →'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
















