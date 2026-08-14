import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useKioskExit } from '../../hooks/useKioskExit'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'
import ModuleRenderer from '../../modules/ModuleRenderer'
import { useShortlistStore } from '../../store/useShortlistStore'

interface Project {
  id: string
  name: string
  developer: string
  reraNumber: string
  themeAccentColor: string
  themeFontPairing: string
}

interface ModuleRecord {
  id: string
  moduleType: string
  isVisible: boolean
}

export default function ProjectShowcase(): JSX.Element {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  
  // Modules for Sidebar
  const [modules, setModules] = useState<ModuleRecord[]>([])

  // Gaps state
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')

  // Lead capture state
  const [showLeadModal, setShowLeadModal] = useState(true)
  const [leadName, setLeadName] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [submittingLead, setSubmittingLead] = useState(false)

  // Session activity log state
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sectionsViewed, setSectionsViewed] = useState<Set<string>>(new Set(['OVERVIEW']))

  // Shortlist side drawer state
  const [showShortlistDrawer, setShowShortlistDrawer] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [exportingPdf, setExportingPdf] = useState(false)

  const { items: shortlistItems, removeItem, clearShortlist } = useShortlistStore()

  const { startHold, endHold } = useKioskExit({
    onExit: () => {
      setPinInput('')
      setPinError('')
      setShowPinModal(true)
    },
  })

  // Load project details
  useEffect(() => {
    if (!projectId) return
    window.api
      .invoke(IPC_CHANNELS.PROJECT_GET, projectId)
      .then((data) => setProject(data as Project))
      .catch(console.error)

    window.api
      .invoke(IPC_CHANNELS.MODULE_LIST, projectId)
      .then((data) => {
        setModules((data as ModuleRecord[]).filter((m) => m.isVisible))
      })
      .catch(console.error)
  }, [projectId])

  // Start session log once project loaded
  useEffect(() => {
    if (!project) return
    window.api
      .invoke(IPC_CHANNELS.SESSION_START, { projectId: project.id })
      .then((res: any) => {
        if (res && res.id) {
          setSessionId(res.id)
        }
      })
      .catch(console.error)
  }, [project])

  // Automatically sync shortlist items to session log
  useEffect(() => {
    if (!sessionId) return
    const projectUnitIds = shortlistItems.map((item) => item.unitId)
    window.api
      .invoke(IPC_CHANNELS.SESSION_SHORTLIST, { id: sessionId, unitIds: projectUnitIds })
      .catch(console.error)
  }, [shortlistItems, sessionId])

  // Document custom theme parameters
  useEffect(() => {
    if (!project) return
    document.documentElement.style.setProperty('--project-accent', project.themeAccentColor)
    document.documentElement.style.setProperty('--project-font', project.themeFontPairing)
    return () => {
      document.documentElement.style.removeProperty('--project-accent')
      document.documentElement.style.removeProperty('--project-font')
    }
  }, [project])

  if (!project) return <div className="loading">Loading project details…</div>

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leadName || !leadPhone) return
    setSubmittingLead(true)
    try {
      await window.api.invoke(IPC_CHANNELS.LEAD_CREATE, {
        projectId: project.id,
        name: leadName,
        phone: leadPhone,
        email: leadEmail,
        notes: `Kiosk session start capture for project: ${project.name}`,
      })
      setShowLeadModal(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingLead(false)
    }
  }

  const handleBackToLauncher = () => {
    // End session log
    if (sessionId) {
      window.api
        .invoke(IPC_CHANNELS.SESSION_END, {
          id: sessionId,
          sectionsViewed: Array.from(sectionsViewed),
        })
        .catch(console.error)
    }
    navigate('/kiosk')
  }

  const handlePinConfirm = async () => {
    try {
      const isValid = await window.api.invoke(IPC_CHANNELS.SETTINGS_VERIFY_PIN, pinInput)
      if (isValid) {
        setShowPinModal(false)
        navigate('/admin')
      } else {
        setPinError('Invalid security credentials PIN')
      }
    } catch (err) {
      setPinError('PIN verification connection error')
    }
  }

  const handleScrollToModule = (modType: string) => {
    const el = document.getElementById(`module-${modType}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
      setSectionsViewed((prev) => new Set([...prev, modType]))
    }
  }

  const handleExportBrochure = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName) return
    setExportingPdf(true)
    try {
      const unitIds = shortlistItems.map((i) => i.unitId)
      const res = await window.api.invoke(IPC_CHANNELS.EXPORT_PDF, {
        projectId: project.id,
        customerName,
        selectedUnitIds: unitIds,
      }) as any
      if (res.success) {
        alert(`Brochure successfully compiled and exported at:\n${res.filePath}`)
        setShowExportModal(false)
        setCustomerName('')
        setShowShortlistDrawer(false)
      } else {
        alert(`Export failed: ${res.reason}`)
      }
    } catch (err: any) {
      alert(`Brochure compiler crash: ${err.message}`)
    } finally {
      setExportingPdf(false)
    }
  }

  return (
    <div className="showcase" style={{ display: 'flex', flexDirection: 'row', height: '100vh', overflow: 'hidden' }}>
      
      {/* 5-second corner hold trigger for Admin */}
      <div
        className="kiosk-exit-corner"
        onPointerDown={startHold}
        onPointerUp={endHold}
        onPointerLeave={endHold}
        style={{ position: 'fixed', top: 0, left: 0, width: 60, height: 60, zIndex: 9999, cursor: 'pointer' }}
      />

      {/* LEFT SIDEBAR navigation panel */}
      <aside style={{
        width: '280px',
        backgroundColor: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        gap: 'var(--space-6)',
        flexShrink: 0
      }}>
        <div>
          <button className="back-btn" onClick={handleBackToLauncher} style={{ width: '100%', marginBottom: '16px', textAlign: 'center' }}>
            ← Main Launcher Portal
          </button>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: '#fff', wordBreak: 'break-word' }}>
            {project.name}
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Developer: {project.developer}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            RERA: {project.reraNumber}
          </p>
        </div>

        {/* Sidebar Nav Links */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
            Project Sections
          </span>
          {modules.map((mod) => (
            <button
              key={mod.id}
              onClick={() => handleScrollToModule(mod.moduleType)}
              style={{
                all: 'unset',
                cursor: 'pointer',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--color-border)',
                color: '#fff',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
                textTransform: 'capitalize',
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--project-accent)'
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)'
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'
              }}
            >
              {mod.moduleType.replace('_', ' ').toLowerCase()}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="showcase-content" style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-8)' }}>
        {projectId && <ModuleRenderer projectId={projectId} />}
      </main>

      {/* SHORTLIST Drawer floating pill button */}
      <button
        onClick={() => setShowShortlistDrawer(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: '14px 28px',
          backgroundColor: 'var(--project-accent)',
          color: '#fff',
          borderRadius: '99px',
          border: 'none',
          boxShadow: 'var(--shadow-md), var(--shadow-glow)',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 'var(--font-size-base)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 99
        }}
      >
        ❤️ Shortlist Drawer
        {shortlistItems.length > 0 && (
          <span style={{
            backgroundColor: '#fff',
            color: 'var(--project-accent)',
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 700
          }}>
            {shortlistItems.length}
          </span>
        )}
      </button>

      {/* Shortlist side drawer */}
      {showShortlistDrawer && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000
        }} onClick={() => setShowShortlistDrawer(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute', top: 0, right: 0, bottom: 0,
              width: '420px', backgroundColor: 'var(--color-surface)',
              borderLeft: '1px solid var(--color-border)',
              display: 'flex', flexDirection: 'column',
              padding: '24px', gap: '20px',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Your Shortlisted Units</h3>
              <button
                onClick={() => setShowShortlistDrawer(false)}
                style={{
                  background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {shortlistItems.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: '40px' }}>
                  No units shortlisted yet. Click the heart icon in Pricing section to shortlist a unit.
                </div>
              ) : (
                shortlistItems.map((item) => (
                  <div
                    key={item.unitId}
                    style={{
                      backgroundColor: 'var(--color-surface-raised)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{item.towerName} · Unit {item.unitNumber}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        {item.configuration} · {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.price)}
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.unitId)}
                      style={{
                        background: 'none', border: 'none', color: '#f87171', fontSize: '18px', cursor: 'pointer'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>

            {shortlistItems.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => setShowExportModal(true)}
                  style={{
                    padding: '12px', borderRadius: 'var(--radius-sm)', border: 'none',
                    backgroundColor: 'var(--project-accent)', color: '#fff',
                    fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  📄 Export PDF Brochure
                </button>
                <button
                  onClick={clearShortlist}
                  style={{
                    padding: '12px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'transparent', color: 'var(--color-text-secondary)',
                    fontWeight: 500, cursor: 'pointer'
                  }}
                >
                  Clear All Selection
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PDF Export customer name modal */}
      {showExportModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
          <form onSubmit={handleExportBrochure} style={{
            background: 'var(--color-surface)', padding: '32px', borderRadius: '16px',
            border: '1px solid var(--color-border)', width: '400px', display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Custom Brochure Details</h4>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Customer Name</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="E.g. Nirav Patel"
                required
                style={{
                  width: '100%', padding: '10px', borderRadius: '6px',
                  border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-raised)', color: '#fff'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                style={{
                  padding: '10px 16px', borderRadius: '6px', border: '1px solid var(--color-border)',
                  backgroundColor: 'transparent', color: '#fff', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={exportingPdf}
                style={{
                  padding: '10px 20px', borderRadius: '6px', border: 'none',
                  backgroundColor: 'var(--project-accent)', color: '#fff', fontWeight: 600, cursor: 'pointer'
                }}
              >
                {exportingPdf ? 'Compiling PDF...' : 'Download PDF'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lead capture start modal */}
      {showLeadModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1999
        }}>
          <form onSubmit={handleLeadSubmit} style={{
            background: 'var(--color-surface)', padding: '36px', borderRadius: '16px',
            border: '1px solid var(--color-border)', width: '420px', display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--project-accent)' }}>Interactive Presentation</h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
              Enter details to unlock interactive unit blueprints, pricing modules, and calculators.
            </p>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Name *</label>
              <input
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                placeholder="E.g. Nirav Patel"
                required
                style={{
                  width: '100%', padding: '10px', borderRadius: '6px',
                  border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-raised)', color: '#fff'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Phone Number *</label>
              <input
                value={leadPhone}
                onChange={(e) => setLeadPhone(e.target.value)}
                placeholder="E.g. +91 98765 43210"
                required
                style={{
                  width: '100%', padding: '10px', borderRadius: '6px',
                  border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-raised)', color: '#fff'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Email (Optional)</label>
              <input
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                placeholder="E.g. nirav@example.com"
                type="email"
                style={{
                  width: '100%', padding: '10px', borderRadius: '6px',
                  border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-raised)', color: '#fff'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', marginTop: '12px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setShowLeadModal(false)}
                style={{
                  background: 'none', border: 'none', color: 'var(--color-text-muted)',
                  cursor: 'pointer', fontSize: '13px', textDecoration: 'underline'
                }}
              >
                Skip details
              </button>
              <button
                type="submit"
                disabled={submittingLead}
                style={{
                  padding: '12px 24px', borderRadius: '6px', border: 'none',
                  backgroundColor: 'var(--project-accent)', color: '#fff', fontWeight: 600, cursor: 'pointer'
                }}
              >
                {submittingLead ? 'Loading...' : 'Start Presentation'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admin PIN authentication modal */}
      {showPinModal && (
        <div role="dialog" aria-label="Enter Admin PIN" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div style={{
            background: 'var(--color-surface)', padding: 32, borderRadius: 16,
            border: '1px solid var(--color-border)', width: '360px', display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <p style={{ margin: 0, fontSize: '15px', color: '#fff', fontWeight: 500 }}>Enter secure Admin authorization PIN</p>
            <input
              type="password"
              id="pin-input"
              placeholder="PIN Code"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              style={{
                width: '100%', padding: '10px', borderRadius: '6px',
                border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-raised)', color: '#fff',
                fontSize: '18px', textAlign: 'center', letterSpacing: '4px'
              }}
            />
            {pinError && (
              <span style={{ fontSize: '12px', color: '#f87171', fontWeight: 500 }}>⚠️ {pinError}</span>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: '4px' }}>
              <button
                onClick={() => setShowPinModal(false)}
                style={{
                  padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--color-border)',
                  backgroundColor: 'transparent', color: '#fff', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handlePinConfirm}
                style={{
                  padding: '8px 20px', borderRadius: '6px', border: 'none',
                  backgroundColor: 'var(--project-accent)', color: '#fff', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Verify PIN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
