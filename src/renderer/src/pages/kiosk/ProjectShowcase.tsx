import { useEffect, useState, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useKioskExit } from '../../hooks/useKioskExit'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'
import { moduleRegistry, isRegisteredModule } from '../../modules/registry'
import { useShortlistStore } from '../../store/useShortlistStore'
import { IntroVideoOverlay } from '../../components/IntroVideoOverlay'
import { PersonaSelector, type Persona } from '../../components/PersonaSelector'
import { useAmbientAudio } from '../../hooks/useAmbientAudio'
// toMediaUrl removed from direct import - used in child components

interface Project {
  id: string
  name: string
  developer: string
  reraNumber: string
  themeAccentColor: string
  themeFontPairing: string
  introVideoMediaId?: string | null
  ambientAudioMediaId?: string | null
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

  const handleKey = async (d: string) => {
    if (checking) return
    if (d === '⌫') {
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
  }

  return (
    <div className="pin-backdrop" role="dialog" aria-label="Admin PIN entry">
      <div className="pin-modal">
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '13px', fontWeight: 700, color: 'var(--color-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8
          }}>
            Admin Access
          </div>
          <div style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text-primary)', fontWeight: 600 }}>
            Enter 4-digit PIN
          </div>
        </div>

        <div className="pin-display">
          {[0,1,2,3].map((i) => (
            <div key={i} className={`pin-dot${digits[i] !== undefined ? ' filled' : ''}`} />
          ))}
        </div>

        {error && (
          <div style={{
            fontSize: 'var(--font-size-xs)', color: 'var(--color-error)',
            textAlign: 'center', fontWeight: 600
          }}>
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
                className="pin-key"
                onClick={() => handleKey(key)}
                disabled={checking}
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
  projectId, onClose,
}: {
  projectId: string
  onClose: () => void
}) {
  const { items, removeItem, clearShortlist } = useShortlistStore()
  const [customerName, setCustomerName] = useState('')
  const [exporting, setExporting] = useState(false)
  const [showExport, setShowExport] = useState(false)

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
            style={{
              all: 'unset', cursor: 'pointer', width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '50%', background: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border)', fontSize: 20, color: 'var(--color-text-secondary)',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-surface-raised)' }}
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
                  style={{
                    all: 'unset', cursor: 'pointer', padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)', border: '1px solid rgba(248,113,113,0.3)',
                    color: 'var(--color-sold)', fontSize: '18px',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

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

  const [showPinModal, setShowPinModal] = useState(false)
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

  // Session
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sectionsViewed, setSectionsViewed] = useState<Set<string>>(new Set(['OVERVIEW']))

  const { items: shortlistItems } = useShortlistStore()

  // Ambient audio � resolved after project loads
  const ambientAudioPath = (project as any)?.ambientAudioMediaId && (project as any)?.media
    ? ((project as any).media as {id:string;filePath:string}[]).find((m) => m.id === (project as any).ambientAudioMediaId)?.filePath ?? null
    : null
  const { muted, toggleMute, hasAudio } = useAmbientAudio(ambientAudioPath)

  const { startHold, endHold } = useKioskExit({
    onExit: () => setShowPinModal(true),
  })

  useEffect(() => {
    if (!projectId) return
    window.api.invoke(IPC_CHANNELS.PROJECT_GET, projectId)
      .then((data) => setProject(data as Project))
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
  }

  const handlePinVerify = async (pin: string) => {
    try {
      const isValid = await (window as any).api.invoke(IPC_CHANNELS.SETTINGS_VERIFY_PIN, pin)
      if (isValid) {
        setShowPinModal(false)
        navigate('/admin')
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leadName || !leadPhone) return
    setSubmittingLead(true)
    try {
      await window.api.invoke(IPC_CHANNELS.LEAD_CREATE, {
        projectId: project.id, name: leadName, phone: leadPhone, email: leadEmail,
        notes: `Session start — ${project.name}`,
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
        className="kiosk-exit-corner"
        onPointerDown={startHold}
        onPointerUp={endHold}
        onPointerLeave={endHold}
      />

      {/* Header */}
      <header className="showcase-header">
        <button className="back-btn" onClick={handleBack}>
          ← Back
        </button>
        <div className="showcase-header-info">
          <h1>{project.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              {project.developer}
            </span>
            {project.reraNumber && (
              <>
                <span style={{ color: 'var(--color-border)', fontSize: 12 }}>·</span>
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
            style={{
              all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              padding: "10px 14px", borderRadius: "var(--radius-sm)",
              background: "var(--color-surface-raised)", border: "1px solid var(--color-border)",
              fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)",
              transition: "all var(--transition-fast)",
            }}
          >
            {muted ? "??" : "??"}
          </button>
        )}
      </header>

      {/* Tab navigation */}
      <nav className="module-tabs-bar" role="tablist">
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
      <main className="showcase-content" key={activeModuleId}>
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
        <ShortlistDrawer projectId={projectId} onClose={() => setShowShortlist(false)} />
      )}

      {/* PIN Modal */}
      {showPinModal && (
        <PinModal
          onVerify={handlePinVerify}
          onClose={() => setShowPinModal(false)}
        />
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
              { label: 'Full Name *', value: leadName, setter: setLeadName, placeholder: 'e.g. Nirav Patel', required: true, type: 'text' },
              { label: 'Mobile Number *', value: leadPhone, setter: setLeadPhone, placeholder: 'e.g. +91 98765 43210', required: true, type: 'tel' },
              { label: 'Email Address', value: leadEmail, setter: setLeadEmail, placeholder: 'Optional', required: false, type: 'email' },
            ].map(({ label, value, setter, placeholder, required, type }) => (
              <div key={label}>
                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {label}
                </label>
                <input
                  type={type}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  placeholder={placeholder}
                  required={required}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 10,
                    border: '1px solid var(--color-border)', background: 'var(--color-surface-raised)',
                    color: 'var(--color-text-primary)', fontSize: 'var(--font-size-base)', fontFamily: 'var(--font-sans)', outline: 'none'
                  }}
                />
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
                style={{
                  flex: 1, padding: '14px', background: 'var(--color-accent)', color: 'var(--color-bg)',
                  border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 'var(--font-size-base)',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  transition: 'opacity var(--transition-fast)', opacity: submittingLead ? 0.7 : 1
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






