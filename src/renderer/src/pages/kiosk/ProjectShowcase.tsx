import { useEffect, useState, useRef, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useKioskExit } from '../../hooks/useKioskExit'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'
import { moduleRegistry, isRegisteredModule } from '../../modules/registry'
import { useShortlistStore } from '../../store/useShortlistStore'
import { IntroVideoOverlay } from '../../components/IntroVideoOverlay'
import { PersonaSelector, type Persona } from '../../components/PersonaSelector'
import { useAmbientAudio } from '../../hooks/useAmbientAudio'
import { AccessibilityToggle } from '../../components/AccessibilityToggle'
import { SecurityPinModal } from './components/SecurityPinModal'
import { ShortlistDrawer } from './components/ShortlistDrawer'
import { LeadCaptureModal } from './components/LeadCaptureModal'
import { EndPresentationModal } from './components/EndPresentationModal'

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

export default function ProjectShowcase(): JSX.Element {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [modules, setModules] = useState<ModuleRecord[]>([])
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)

  const tabsRef = useRef<HTMLElement>(null)

  // Mouse click-and-drag horizontal scrolling for tab navigation
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
      const walk = (x - startX) * 1.5
      if (Math.abs(walk) > 5) {
        moved = true
      }
      el.scrollLeft = scrollLeft - walk
    }

    const onDragStart = (e: DragEvent) => {
      e.preventDefault()
    }

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

  const [settings, setSettings] = useState<any>(null)
  const [narrationMuted, setNarrationMuted] = useState(false)

  // Session
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sectionsViewed, setSectionsViewed] = useState<Set<string>>(new Set(['OVERVIEW']))
  const [showEndSessionModal, setShowEndSessionModal] = useState(false)
  const sessionStartTimeRef = useRef<number>(Date.now())

  const { items: shortlistItems } = useShortlistStore()

  // Ambient audio
  const ambientAudioPath = (project as any)?.ambientAudioMediaId && (project as any)?.media
    ? ((project as any).media as { id: string; filePath: string }[]).find((m) => m.id === (project as any).ambientAudioMediaId)?.filePath ?? null
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
          setNarrationMuted(true)
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

    if ((project as any).introVideoMediaId && (project as any).media) {
      const introMedia = ((project as any).media as { id: string; filePath: string }[]).find(
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

  // Sync navigation listener from presenter window
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

  const activeModule = modules.find((m) => m.id === activeModuleId) ?? modules[0]

  // Voice Narration effect using Web Speech API
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
    } catch { }

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
  }, [activeModuleId, project, narrationMuted, activeModule])

  if (!project) return <div className="loading">Loading project…</div>

  const handleBack = () => {
    setShowEndSessionModal(true)
  }

  const handleConfirmEndSession = () => {
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

  const getPersonaLabel = (p: Persona | null): string | undefined => {
    if (p === 'END_USE') return 'Own Home'
    if (p === 'INVESTMENT') return 'Investment'
    if (p === 'NRI') return 'NRI Buyer'
    return undefined
  }

  const handlePersonaSelect = (p: Persona) => {
    setPersona(p)
    setShowPersona(false)
    const label = getPersonaLabel(p)
    if (sessionId && label) {
      window.api.invoke(IPC_CHANNELS.SESSION_END, { id: sessionId, personaMode: label }).catch(console.error)
    }
  }

  let activeConfig: Record<string, any> = {}
  try { activeConfig = JSON.parse(activeModule?.config || '{}') } catch { }

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="back-btn"
            onClick={handleBack}
            onTouchEnd={(e) => {
              e.preventDefault()
              handleBack()
            }}
            aria-label="Go back to project selection"
          >
            {String.fromCharCode(8592)} Back
          </button>
          <button
            onClick={() => setShowEndSessionModal(true)}
            className="btn-hover-effect"
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 700,
            }}
            aria-label="End presentation session"
          >
            <span>⏹️</span> End Presentation
          </button>
        </div>
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
        {/* Firm watermark overlay */}
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

      {/* Security PIN Modal */}
      {showPinModal && (
        <SecurityPinModal
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
        <LeadCaptureModal
          projectId={project.id}
          projectName={project.name}
          onComplete={() => {
            setShowLeadModal(false)
            setShowPersona(true)
          }}
          onSkip={() => setShowLeadModal(false)}
        />
      )}

      {/* End Presentation Summary Modal */}
      {showEndSessionModal && (
        <EndPresentationModal
          projectName={project.name}
          persona={getPersonaLabel(_persona) ?? null}
          sectionsCount={sectionsViewed.size}
          shortlistCount={shortlistItems.length}
          sessionDurationMinutes={Math.max(1, Math.round((Date.now() - sessionStartTimeRef.current) / 60000))}
          onConfirmEnd={handleConfirmEndSession}
          onSaveLead={() => {
            setShowEndSessionModal(false)
            setShowLeadModal(true)
          }}
          onResume={() => setShowEndSessionModal(false)}
        />
      )}
    </div>
  )
}
